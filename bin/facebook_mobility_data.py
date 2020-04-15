import urllib
import gzip
import pandas as pd
import datetime

BASE_URL = 'https://visualization.covid19mobility.org/data'
DEMO_URL = '/'.join((BASE_URL, 'us_county_demographics.csv'))
STATE_URL = '/'.join((BASE_URL, 'us_state_mobility_statistics.{timestamp}.csv'))
COUNTY_URL = '/'.join((BASE_URL, '{state_fips}_county_mobility_statistics.{timestamp}.csv'))

# e.g. 20200412
def timestamp(date = None):
    # FIXME - this is last known good date, schedule of new postings unknown
    if date is None:
        return '20200412'
    return date.strftime('%Y%m%d')

# mobility CSVs come back gzipped; extract them
def df_csv_url_to_df(url):
    with urllib.request.urlopen(url) as csv_gz_f:
        with gzip.open(csv_gz_f) as csv_f:
            df = pd.read_csv(csv_f)
            
            # FIPS for US is NaN, make it legible
            df.FIPS[df.FIPS.isnull()] = 0
            
            # FIPS gets read in as float, make it string index
            df.FIPS = df.FIPS.map(lambda x: '%02d'%x)
            
            return df
        
# demographic data
def get_demo_index():
    return df_csv_url_to_df(DEMO_URL)

# country and state timeseries
def get_state_ts(date = None):
    return df_csv_url_to_df(STATE_URL.format(timestamp=timestamp(date)))

# county timeseries for sate
def get_county_ts(state_fips, date = None):
    return df_csv_url_to_df(COUNTY_URL.format(state_fips=state_fips, timestamp=timestamp(date)))

# returns 2 dataframes, one for demographic and one with all timeseries
def all_data(date = None):
    demo_df = get_demo_index()
    
    ts_df = get_state_ts()
    for state_fips in [sf for sf in demo_df.FIPS if int(sf) > 0 and len(sf) == 2]:
        try:
            ts_df = ts_df.append(get_county_ts(state_fips))
        except:
            # FIXME - plug in environment logging
            print('Failed to retrieve FIPS: ' + state_fips)
    
    return demo_df, ts_df

# run in a notebook
demo_df, ts_df = all_data()
display(demo_df)
display(ts_df)
