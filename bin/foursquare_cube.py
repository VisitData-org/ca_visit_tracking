import sys
import os.path
import distutils.dir_util
import shutil
import json
import pandas as pd
import numpy as np
from datetime import date

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
RAW_FN = 'raw'
GROUPED_FN = 'grouped'
BY_DATE_FN = 'bydate'
ALL_DATES_FN = 'alldates'

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

    zip_rollup = rollup[rollup.zip != '']
    slice_by_fields(zip_rollup, ['zip3'], ZIP_FN, out_dir)

    state_rollup = rollup[(rollup.state != '') & (rollup.county == '')]
    slice_by_fields(state_rollup, ['state'], STATE_FN, out_dir)

    gen_index(rollup, out_dir)

def cube(rollup, raw_out_dir, grouped_out_dir):
    rollup_raw = rollup[rollup.categoryid != 'Group']
    rollup_grouped = rollup[rollup.categoryid == 'Group']
    cube_one(rollup_raw, raw_out_dir)
    cube_one(rollup_grouped, grouped_out_dir)

def find_new_csvs(new_dir):
    dates_fns = os.listdir(new_dir)
    dates_fns.sort()
    for dn in dates_fns:
        if dn.startswith('dt='):
            date = dn[3:]
            for fn in os.listdir(os.path.join(new_dir, dn)):
                yield (date, os.path.join(new_dir, dn, fn))
        else:
            eprint('Warning: found directory "{}" without "dt=" prefix'.format(dn))

# split each date file by state/county or zip or just state
# and put in date directory
def split_one_day(date, csv_path, raw_out_dir, grouped_out_dir):
    print('Splitting files for date {} for path {}'.format(date, csv_path))
    # load raw data
    rollup_raw = load_rollup(csv_path)
    
    # TESTING WITH SMALL DataFrame
    #rollup_raw = rollup_raw[(rollup_raw.state == 'New York') | (rollup_raw.zip == '11201')].copy()
    #rollup_raw['state'] = 'New York'
    
    # clean NAs and sort
    rollup = clean(rollup_raw)

    # split files into state/county and date
    cube(rollup, raw_out_dir, grouped_out_dir)

def make_date_dir(dir_path, date):
    date_out_dir = os.path.join(dir_path, date)
    if os.path.isdir(date_out_dir):
        eprint(('Warning: date directory "{}" already exists, ' +
                'must be regenerating this date').format(date_out_dir))
    os.makedirs(date_out_dir, exist_ok=True)
    return date_out_dir

def split_days(new_dir, out_dir):
    raw_dir = os.path.join(out_dir, RAW_FN, BY_DATE_FN)
    grouped_dir = os.path.join(out_dir, GROUPED_FN, BY_DATE_FN)
    # these already likely exist due to copy of prior data
    os.makedirs(raw_dir, exist_ok=True)
    os.makedirs(grouped_dir, exist_ok=True)

    for date, csv_path in find_new_csvs(new_dir):
        # create date paths
        raw_date_dir = make_date_dir(raw_dir, date)
        grouped_date_dir = make_date_dir(grouped_dir, date)

        # generate the split files
        split_one_day(date, csv_path, raw_date_dir, grouped_date_dir)

def merge_days_one_location(by_date_dir, all_dates_dir, location_fn):
    with open(os.path.join(all_dates_dir, location_fn), 'w') as out_file:
        first_date = True
        date_fns = list(os.listdir(by_date_dir))
        date_fns.sort()
        for date_fn in date_fns:
            date_csv_path = os.path.join(by_date_dir, date_fn, location_fn)
            if os.path.isfile(date_csv_path):
                with open(date_csv_path) as in_file:
                    # only include the header for the first file
                    first_line = in_file.readline()
                    if first_date:
                        out_file.write(first_line)
                        first_date = False
                    # stream the file in case they're large
                    for line in in_file:
                        out_file.write(line)
                first_date = False
            else:
                eprint(('Warning: file does not exist for ' +
                        'date {}').format(date_csv_path))
        
def merge_days_one_type(out_dir):
    all_dates_dir = os.path.join(out_dir, ALL_DATES_FN)
    by_date_dir = os.path.join(out_dir, BY_DATE_FN)
    if os.path.isdir(all_dates_dir):
        print('Removing existing alldates files {}'.format(all_dates_dir))
        shutil.rmtree(all_dates_dir)
    else:
        print(('No existing files at {}; you ' +
               'are starting fresh').format(all_dates_dir))
    os.makedirs(all_dates_dir)
    fns = []
    for date_fn in os.listdir(by_date_dir):
        date_dir = os.path.join(by_date_dir, date_fn)
        fns.extend(os.listdir(date_dir))
    unique_fns = np.unique(fns).tolist()
    unique_fns.remove(INDEX_FN)
    for fn in unique_fns:
        merge_days_one_location(by_date_dir, all_dates_dir, fn)

def collect_indexes(out_dir):
    dates_fns = os.listdir(os.path.join(out_dir, BY_DATE_FN))
    dates_fns.sort()
    indexes = []
    for dn in dates_fns:
        index_path = os.path.join(out_dir, BY_DATE_FN, dn, INDEX_FN)
        try:
            with open(index_path) as index_file:
                indexes.append(json.load(index_file))
        except:
            sys.exit('Index file missing {}'.format(index_path))
    return indexes

def merge_indexes_one_type(out_dir):
    indexes = collect_indexes(out_dir)
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

def merge_indexes(out_dir):
    merge_indexes_one_type(os.path.join(out_dir, RAW_FN))
    merge_indexes_one_type(os.path.join(out_dir, GROUPED_FN))

def merge_days(out_dir):
    merge_days_one_type(os.path.join(out_dir, RAW_FN))
    merge_days_one_type(os.path.join(out_dir, GROUPED_FN))

def copy_source_files(prev_day_dir, out_dir):
    print('copying files from {} to {}'.format(prev_day_dir, out_dir))
    distutils.dir_util.copy_tree(prev_day_dir, out_dir,
                                 preserve_mode=1, preserve_times=1)

def main(prev_day_dir, new_dir, out_dir):
    if os.path.isdir(prev_day_dir):
        copy_source_files(prev_day_dir, out_dir)
    split_days(new_dir, out_dir)
    merge_days(out_dir)
    merge_indexes(out_dir)

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

def usage(err=None):
    if err:
        eprint(err)
    sys.exit(('Usage: {} <prev-day-dir> <source-dir> ' +
              '<target-dir>').format(sys.argv[0]))

def check_args():
    if len(sys.argv) != 4:
        usage()
    _, prev_day_dir, new_dir, out_dir = sys.argv
    if (not os.path.exists(prev_day_dir) or
        not os.path.isfile(os.path.join(prev_day_dir, 'taxonomy.json'))):
        eprint(('Warning: previous day directory "{}" does not exist or does ' +
                'not have taxonomy.json').format(prev_day_dir))
    if not os.path.isdir(new_dir):
        usage('Source directory "{}" does not exist'.format(new_dir))
    if os.path.exists(out_dir):
        usage(('Output dir "{}" already exits.  ' +
               'Please remove first.').format(out_dir))
    return prev_day_dir, new_dir, out_dir
        
if __name__ == "__main__":
    args = check_args()
    main(*args)
