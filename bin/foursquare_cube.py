import sys
import os.path
import distutils.dir_util
import shutil
import json
import re
import subprocess
import pandas as pd
import numpy as np
from datetime import date
import tarfile

ALL_FIELDS = ['date', 'country', 'state', 'county', 'zip',
              'categoryid', 'categoryname', 'hour', 'demo',
              'visits', 'avgDuration', 'p25Duration', 'p50Duration',
              'p75Duration', 'p90Duration', 'p99Duration',
              'pctTo10Mins', 'pctTo20Mins', 'pctTo30Mins',
              'pctTo60Mins', 'pctTo2Hours', 'pctTo4Hours',
              'pctTo8Hours', 'pctOver8Hours']
SORT_FIELDS = ['state', 'county', 'zip', 'demo', 'hour']
STATE_COUNTY_FN = '{}_{}.csv'
STATE_FN = '{}.csv'
ZIP_FN = 'zip3_{}.csv'
INDEX_FN = 'index.json'

EXTRACT_FN = 'fs'
RAW_FN = 'raw'
GROUPED_FN = 'grouped'
BY_DATE_FN = 'bydate'  

FS_URL_PREFIX = 'gs://data.visitdata.org/processed/vendor/foursquare/asof/'

def load_rollup(path):
    rollup = pd.read_csv(path, dtype={4: str})
    rollup.columns = ALL_FIELDS
    return rollup

def clean(roll):
    roll = roll[roll.country == 'US'].copy()
    roll.drop(columns=['country'], inplace=True)
    roll.loc[pd.isna(roll.zip), 'zip'] = ''
    roll.loc[pd.isna(roll.state), 'state'] = ''
    roll.loc[pd.isna(roll.county), 'county'] = ''
    roll['zip3'] = roll.zip.str[:3]
    roll.sort_values(SORT_FIELDS, inplace=True)
    return roll

def slice_by_fields(rollup, fields, fn_template, out_dir,
                    rem_trans = str.maketrans({' ': '', "'": ''})):
    groups = rollup.sort_values(fields).groupby(fields)
    for field_values, group in groups:
        if type(field_values) is not tuple:
            field_values = (field_values,)
        if len(field_values) and field_values[0]:
            field_values = [v.translate(rem_trans) for v in field_values]
            path = os.path.join(out_dir, fn_template.format(*field_values))
            group = group.drop(columns=['zip3'])
            group.to_csv(path, index=False)

def gen_index(rollup, out_dir):
    states = list(rollup.state.unique())
    if '' in states:
        states.remove('')

    counties = {}
    for ((state, county), g) in rollup.groupby(['state', 'county']):
        if state and county:
            if state not in counties:
                counties[state] = []
            counties[state].append(county)

    zips = list(rollup.zip.unique())
    if '' in zips:
        zips.remove('')

    demos = list(rollup.demo.unique())
    hours = list(rollup.hour.unique())
    categories = list(rollup.categoryname.unique())

    index = {'states': states,
             'counties': counties,
             'zips': zips,
             'demos': demos,
             'hours': hours,
            'categories': categories}

    with open(os.path.join(out_dir, INDEX_FN), 'w') as f:
        json.dump(index, f, indent=2)    

def cube_one(rollup, out_dir):
    state_county_rollup = rollup[(rollup.state != '') & (rollup.county != '')]
    slice_by_fields(state_county_rollup, ['state', 'county'],
                    STATE_COUNTY_FN, out_dir)

    #zip_rollup = rollup[rollup.zip != '']
    #slice_by_fields(zip_rollup, ['zip3'], ZIP_FN, out_dir)

    state_rollup = rollup[(rollup.state != '') & (rollup.county == '')]
    slice_by_fields(state_rollup, ['state'], STATE_FN, out_dir)

    gen_index(rollup, out_dir)

def cube(rollup, raw_out_dir, grouped_out_dir):
    rollup_raw = rollup[rollup.categoryid != 'Group']
    rollup_grouped = rollup[rollup.categoryid == 'Group']
    cube_one(rollup_raw, raw_out_dir)
    cube_one(rollup_grouped, grouped_out_dir)

def find_fs_csvs(new_dir):
    dates_fns = os.listdir(new_dir)
    dates_fns.sort()
    date_and_csvs = []
    for dn in dates_fns:
        if dn.startswith('dt='):
            date = dn[3:]
            for fn in os.listdir(os.path.join(new_dir, dn)):
                date_and_csvs.append((date, os.path.join(new_dir, dn, fn)))
        else:
            eprint('Warning: found directory "{}" without "dt=" prefix'.format(dn))
    return date_and_csvs

# split each date file by state/county or zip or just state
# and put in date directory
def split_one_day(date, csv_path, raw_out_dir, grouped_out_dir):
    # load raw data
    rollup_raw = load_rollup(csv_path)
    
    # TESTING WITH SMALL DataFrame
    #rollup_raw = rollup_raw[(rollup_raw.state == 'New York') | (rollup_raw.zip == '11201')].copy()
    #rollup_raw['state'] = 'New York'
    
    # clean NAs and sort
    rollup = clean(rollup_raw)

    # split files into state/county and date
    cube(rollup, raw_out_dir, grouped_out_dir)

def split_days(dates_and_csvs, raw_dir, grouped_dir):
    for date, csv_path in dates_and_csvs:
        # create date paths
        raw_date_dir = makedir(os.path.join(raw_dir, date))
        grouped_date_dir = makedir(os.path.join(grouped_dir, date))

        print(('Splitting FS data {} into geo files ' +
               'to raw {} and grouped {}').format(csv_path,
                                                  raw_date_dir,
                                                  grouped_date_dir))

        # generate the split files
        split_one_day(date, csv_path, raw_date_dir, grouped_date_dir)

# copies data from the prev geo file to out_files for dates not in new_dates
# returns None if there was no prev csv for this geo: we've written nothing so far
# otherwise returns a list of dates in teh prev csv that we didn't copy over
# because we they're in the new files (likely an empty list)
def copy_prev(geo_fn, prev_dir, new_dates, out_file):
    if prev_dir:
        prev_path = os.path.join(prev_dir, geo_fn)
        if os.path.isfile(prev_path):
            regen_dates = []
            with open(prev_path, 'r') as in_file:
                # write header
                out_file.write(in_file.readline()) 
                for line in in_file:
                    sp_line = line.split(',', 1)
                    if len(sp_line) > 0:
                        line_date = sp_line[0]
                        if line_date not in new_dates:
                            out_file.write(line)
                        else:
                            if len(regen_dates) == 0 or line_date != regen_dates[0]:
                                regen_dates.append(line_date)
            return regen_dates
    #eprint(('Warning: merge did not find geo {} in previous data, ' +
    #        'expected {}').format(geo_fn, prev_path))
    return None

def copy_split(geo_fn, split_dir, need_header, new_dates, out_file):
    for date in new_dates:
        date_csv_path = os.path.join(split_dir, date, geo_fn)
        if os.path.isfile(date_csv_path):
            with open(date_csv_path) as in_file:
                # only include the header for the first file
                header = in_file.readline()
                if need_header:
                    out_file.write(header)
                    need_header = False
                # stream the lines per date
                for line in in_file:
                    out_file.write(line)
        else:
            pass
            #eprint(('Warning: merge did not find geo {} in new FS data, ' +
            #        'expected {}').format(geo_fn, date_csv_path))

def merge_days_one_geo(geo_fn, prev_dir, split_dir, new_dates, out_dir):
    with open(os.path.join(out_dir, geo_fn), 'w') as out_file:
        # copy data from prev geo file before first new date
        ret = copy_prev(geo_fn, prev_dir, set(new_dates), out_file)
        need_header = ret == None
        regen_dates = ret if ret else []

        # copy data from split_dir
        copy_split(geo_fn, split_dir, need_header, new_dates, out_file)
    return regen_dates

def find_geo_fns(prev_dir, split_dir, dates):
    pred = lambda fn: fn.endswith('.csv')
    if prev_dir and os.path.isdir(prev_dir):
        fns = list(filter(pred, os.listdir(prev_dir)))
    else:
        fns = []
    for date_fn in dates:
        date_fns = filter(pred, os.listdir(os.path.join(split_dir, date_fn)))
        fns.extend(date_fns)
    return np.unique(fns).tolist()
        
def merge_days(prev_dir, split_dir, dates, out_dir):
    print('Merging prev files and split files to {}'.format(out_dir))
    regen_dates = []
    for geo_fn in find_geo_fns(prev_dir, split_dir, dates):
        rdates = merge_days_one_geo(geo_fn, prev_dir, split_dir, dates, out_dir)
        regen_dates.extend(rdates)
    if regen_dates:
        rdates = ','.join(np.unique(regen_dates))
        eprint(('Warning: found overlapping data, you are regenerating for ' +
                'dates {}.').format(rdates))

def get_index(path):
    try:
        with open(path) as index_file:
            return json.load(index_file)
    except:
        sys.exit('Index file missing {}'.format(path))

def collect_indexes(split_dir, dates):
    indexes = []
    for dn in dates:
        index_path = os.path.join(split_dir, dn, INDEX_FN)
        indexes.append(get_index(index_path))
    return indexes

def prev_index(prev_dir):
    return [get_index(os.path.join(prev_dir, INDEX_FN))] if prev_dir else []

def merge_indexes(prev_dir, split_dir, new_dates, out_dir):
    indexes = prev_index(prev_dir) + collect_indexes(split_dir, new_dates)
    total_index = indexes[0]
    # all keys but counties are lists
    for key in filter(lambda k: k != 'counties', total_index.keys()):
        # extend and unique
        for ind in indexes[1:]:
            total_index[key].extend(ind[key])
        total_index[key] = np.unique(total_index[key]).tolist()

    # counties is a dictionary of state to counties, do this seperately
    total_counties = total_index['counties']
    for ind in indexes[1:]:
        for state, counties in ind['counties'].items():
            if state in total_counties:
                total_counties[state].extend(counties)
            else:
                total_counties[state] = counties
    # unique county list for each state
    for state, counties in total_counties.items():
        total_counties[state] = np.unique(total_counties[state]).tolist()

    # write merged file
    with open(os.path.join(out_dir, INDEX_FN), 'w') as f:
        json.dump(total_index, f, indent=2)

def download_prev(prev_version, out_dir):
    url = FS_URL_PREFIX + prev_version
    print("Downloading previous day's data {}".format(url))
    ret = subprocess.run(['gsutil', '-m', 'cp', '-r', url, out_dir])
    ret.check_returncode()
    return os.path.join(out_dir, prev_version)

def extract_fs(fs_tar_path, out_dir):
    extract_dir = makedir(out_dir, EXTRACT_FN)
    print('Extracting new FS data to {}'.format(extract_dir))
    with tarfile.open(fs_tar_path) as tf:
        tf.extractall(path=extract_dir)
    return extract_dir

def create_version_dir(dates_and_csvs, cur_version_num, out_dir):
    # last date in sorted list, date is first in tuple
    cur_date = dates_and_csvs[-1][0].replace('-', '')
    cur_version = '{}-{}'.format(cur_date, cur_version_num)
    cur_dir = os.path.join(out_dir, cur_version)
    makedir(cur_dir)
    return cur_dir

def main(fs_tar_path, prev_version, cur_version_num, out_dir):
    makedir(out_dir)
    
    # download previous day data directory from data.visitdata.org
    if prev_version:
        prev_dir = download_prev(prev_version, out_dir)
    else:
        prev_dir = None
        eprint('Warning: starting fresh, not with a existing data')

    # extract fs tar with new data, find the dates & csv paths it contains
    fs_extract_dir = extract_fs(fs_tar_path, out_dir)
    dates_and_csvs = find_fs_csvs(fs_extract_dir)
    new_dates = [d[0] for d in dates_and_csvs]
    print('Found dates in FS data: {}'.format(', '.join(new_dates)))

    # split fs extracted data into date dirs and state/county/zip csvs into those
    raw_split_dir = makedir(out_dir, BY_DATE_FN, RAW_FN)
    grouped_split_dir = makedir(out_dir, BY_DATE_FN, GROUPED_FN)
    split_days(dates_and_csvs, raw_split_dir, grouped_split_dir)

    # create dir for current data
    cur_dir = create_version_dir(dates_and_csvs, cur_version_num, out_dir)

    # merge prev data with new split data for each of raw and grouped
    for type_fn, split_dir in [(RAW_FN, raw_split_dir),
                               (GROUPED_FN, grouped_split_dir)]:
        prev_type_dir = os.path.join(prev_dir, type_fn) if prev_dir else None
        cur_type_dir = makedir(cur_dir, type_fn)
        merge_days(prev_type_dir, split_dir, new_dates, cur_type_dir)
        merge_indexes(prev_type_dir, split_dir, new_dates, cur_type_dir)

def makedir(*path_comps):
    path = os.path.join(*path_comps)
    os.makedirs(path)
    return path

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

def usage(err=None):
    if err:
        eprint(err)
    sys.exit(('Usage: {} <foursquare.tar> <prev_day version string YYYYMMDD-v# ' +
              'or FRESH> <current version number string v#> ' +
              '<scratch dir>').format(sys.argv[0]))

def check_args():
    if len(sys.argv) != 5:
        usage('Wrong number of arguments')
    _, fs_tar_path, prev_version, cur_version_num, scratch_dir = sys.argv
    if not os.path.isfile(fs_tar_path):
        usage('Foursquare tar file {} does not exist'.format(fs_tar_path))
    ver_re = re.compile('\d{4}\d{2}\d{2}-v\d+')
    if not ver_re.match(prev_version) and prev_version != 'FRESH':
        usage(('Previous day version string "{}" is not of ' +
              'format YYYYMMDD-v# or FRESH for starting fresh').format(prev_version))
    ver_num_re = re.compile('v\d+')
    if not ver_num_re.match(cur_version_num):
        usage(('Current version number "{}" is not of ' +
              'format v#').format(cur_version_num))
    if os.path.exists(scratch_dir):
        usage(('Scratch directory {} already exists.  Please ' +
               'remove first.').format(scratch_dir))
    # TODO: make this a switch
    if prev_version == 'FRESH':
        prev_version = None
    return fs_tar_path, prev_version, cur_version_num, scratch_dir 
        
if __name__ == "__main__":
    args = check_args()
    main(*args)
