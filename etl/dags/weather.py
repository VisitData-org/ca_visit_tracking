from collections import defaultdict
from datetime import timedelta, datetime
from typing import Dict, List

import requests
from airflow import DAG
from airflow.models import Variable
from airflow.operators.python_operator import PythonOperator
from google.cloud.exceptions import NotFound
from google.cloud.storage import Client, Bucket
from urllib import parse
import os
import json

#
# To configure, set a single airflow variable called "weather_config" that has a JSON dict with
# the following attributes:
#
# weatherapi_base_url - The URL of the weather API
#     (`http://api.weatherapi.com/v1/history.json?key={key}&q={q}+united+states&dt={dt}`)
# weatherapi_key - The registered key
# visitdata_bucket_name - Name of the bucket to which to store weather data (`data.visitdata.org`)
# weatherapi_raw_bucket_base_path - Base path to store data (`raw/vendor/api.weatherapi.com/asof/{date}`)
# weatherapi_merged_bucket_base_path - Base path to store data (`processed/vendor/api.weatherapi.com/asof/{date}`)
# start_date - Date of start of merged data (`2020-02-01`)
#


default_args = {
    'owner': 'airflow',
    'depends_on_past': True,
    'retries': 1,
    'retry_delay': timedelta(minutes=5)
}


def slugify_state(selected_state: str):
    return "-".join(selected_state.split())


def extract_raw_weather_for_county_for_date(base_url: str, api_key: str, selected_state: str, county: str,
                                            date: datetime.date):
    query = parse.quote(f"{county}, {selected_state}")
    full_url = base_url.format(key=api_key, q=query, dt=date.strftime('%Y-%m-%d'))
    response = requests.get(full_url)
    result = response.json()
    # Sanity check result
    if "error" in result.keys():
        raise RuntimeError(f"Error encountered for {county}, {selected_state} on {date}: {result['error']['message']}")
    return result


def extract_raw_weather_for_state_for_date(base_url: str, api_key: str, selected_state: str, date: datetime.date):
    return {county: extract_raw_weather_for_county_for_date(base_url, api_key, selected_state, county, date)
            for county in state_to_counties[selected_state]}


def load_raw_weather_for_state_for_date(base_url: str, api_key: str, bucket_name: str, bucket_raw_base_path: str,
                                        selected_state: str, **context):
    date: datetime.date = context["execution_date"]
    yyyymmdd: str = date.strftime("%Y%m%d")
    gcs = Client()
    bucket = gcs.bucket(bucket_name)
    blob = bucket.blob(f"{bucket_raw_base_path.format(date=yyyymmdd)}/{selected_state}.json")
    blob.upload_from_string(
        json.dumps(
            extract_raw_weather_for_state_for_date(
                base_url=base_url,
                api_key=api_key,
                selected_state=selected_state,
                date=date
            )
        )
    )
    print(f"Successfully loaded weather data for {str(date)} to bucket")


def read_weather_for_state_for_date(bucket: Bucket, bucket_raw_base_path: str, selected_state: str,
                                    date: datetime.date):
    yyyymmdd: str = date.strftime("%Y%m%d")
    blob = bucket.blob(f"{bucket_raw_base_path.format(date=yyyymmdd)}/{selected_state}.json")
    try:
        return json.loads(blob.download_as_string())
    except NotFound:
        return None


def load_merged_weather_for_state_for_date(bucket_name: str, bucket_raw_base_path: str, bucket_merged_base_path: str,
                                           selected_state: str, start_date: datetime.date, **context):
    end_date: datetime.date = context["execution_date"]
    yyyymmdd: str = end_date.strftime("%Y%m%d")
    gcs = Client()
    bucket = gcs.bucket(bucket_name)

    # Dict like {"county": {"location": {...}, "forecast": {"yyyymmdd1": {...}, "yyyymmdd2": {...}}}}
    merged_weather = defaultdict(lambda: {"forecast": {}})

    # Read raw data for each date from first date to execution date and merge into one record
    for n in range(int((end_date - start_date).days) + 1):
        date = start_date + timedelta(n)
        state_data = read_weather_for_state_for_date(bucket=bucket, bucket_raw_base_path=bucket_raw_base_path,
                                                     selected_state=selected_state, date=date)
        if state_data is None:
            print(f"Warning: No data for state {selected_state} for date {date}. Skipping.")
            continue

        for county in state_data.keys():
            print(f"Merging {county}, {selected_state} on {date}...")
            data = state_data[county]
            try:
                forecast = data["forecast"]["forecastday"][0]
                county_weather = merged_weather[county]
                county_weather["forecast"][forecast["date_epoch"]] = {
                    "maxtemp_f": forecast["day"]["maxtemp_f"],
                    "totalprecip_in": forecast["day"]["totalprecip_in"]
                }
            except Exception as e:
                print(f"Skipping state {selected_state}, county {county}, date {date} due to error: {e}")

    target_blob = bucket.blob(f"{bucket_merged_base_path.format(date=yyyymmdd)}/{selected_state}.json")
    target_blob.upload_from_string(json.dumps(merged_weather, sort_keys=True))
    print(f"Successfully loaded merged weather data for state {selected_state} to bucket")


config = Variable.get("weather_config", deserialize_json=True)
config_start_date = datetime.strptime(config["start_date"], '%Y-%m-%d')

dag = DAG(
    dag_id="dag-weather",
    description="ETL Weather Data",
    catchup=True,
    start_date=config_start_date,
    default_args=default_args,
    schedule_interval='@daily'
)


# State file is stored locally as part of DAG code until it can be generated from upstream dependencies:
with open(f"{os.path.dirname(__file__)}/states_counties.json") as f:
    state_to_counties = json.load(f)


for state in state_to_counties.keys():
    load_raw_task = PythonOperator(
        task_id=f"load-raw-weather-{slugify_state(state)}",
        python_callable=load_raw_weather_for_state_for_date,
        op_kwargs={
            "base_url": config["weatherapi_base_url"],
            "api_key": config["weatherapi_key"],
            "bucket_name": config["visitdata_bucket_name"],
            "bucket_raw_base_path": config["weatherapi_raw_bucket_base_path"],
            "selected_state": state
        },
        provide_context=True,
        dag=dag
    )
    load_merged_task = PythonOperator(
        task_id=f"load-merged-weather-{slugify_state(state)}",
        python_callable=load_merged_weather_for_state_for_date,
        op_kwargs={
            "bucket_name": config["visitdata_bucket_name"],
            "bucket_raw_base_path": config["weatherapi_raw_bucket_base_path"],
            "bucket_merged_base_path": config["weatherapi_merged_bucket_base_path"],
            "selected_state": state,
            "start_date": config_start_date
        },
        provide_context=True,
        dag=dag
    )
    load_raw_task >> load_merged_task
