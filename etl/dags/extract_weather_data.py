from datetime import timedelta, datetime
from typing import Dict, List

import requests
from airflow import DAG
from airflow.models import Variable
from airflow.operators.python_operator import PythonOperator
from airflow.utils.dates import days_ago
from google.cloud.storage import Client
from urllib import parse
import os
import json

#
# To configure, set a single airflow variable called "extract_weather_data_config" that has a JSON dict with
# the following attributes:
#
# weatherapi_base_url - The URL of the weather API
#     (`http://api.weatherapi.com/v1/history.json?key={key}&q={q}+united+states&dt={dt}`)
# weatherapi_key - The registered key
# visitdata_bucket_name - Name of the bucket to which to store weather data (`data.visitdata.org`)
# weatherapi_bucket_base_path - Base path to store data (`processed/vendor/api.weatherapi.com/asof/{date}`)
#


default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': days_ago(1),
    'retries': 1,
    'retry_delay': timedelta(minutes=5)
}


def slugify_state(selected_state: str):
    return "-".join(selected_state.split())


def extract_weather_for_county_for_date(base_url: str, api_key: str, selected_state: str, county: str,
                                        date: datetime.date):
    weather = {"forecast": {}}
    query = parse.quote(f"{county}, {selected_state}")
    full_url = base_url.format(key=api_key, q=query, dt=date.strftime('%Y-%m-%d'))
    print(full_url)
    response = requests.get(full_url)
    data = response.json()
    try:
        forecast = data["forecast"]["forecastday"][0]
        location = data["location"]
        forecast["day"].pop("condition")
        weather = {**weather, **location}
        weather["forecast"][forecast["date_epoch"]] = forecast["day"]
    except Exception as e:
        print(f"Skipping state {selected_state}, county {county}, date {date} due to error: {e}")

    return weather


def extract_weather_for_state_for_date(base_url: str, api_key: str, state_to_counties: Dict[str, List[str]],
                                       selected_state: str, date: datetime.date):
    return {county: extract_weather_for_county_for_date(base_url, api_key, selected_state, county, date)
            for county in state_to_counties[selected_state]}


def load_weather_for_state_for_date(base_url: str, api_key: str, state_to_counties: Dict[str, List[str]],
                                    bucket_name: str, bucket_base_path: str, selected_state: str,
                                    **context):
    date: datetime.date = context["execution_date"]
    yyyymmdd: str = date.strftime("%Y%m%d")
    gcs = Client()
    bucket = gcs.bucket(bucket_name)
    blob = bucket.blob(f"{bucket_base_path.format(date=yyyymmdd)}/{selected_state}.json")
    blob.upload_from_string(
        json.dumps(
            extract_weather_for_state_for_date(
                base_url=base_url,
                api_key=api_key,
                state_to_counties=state_to_counties,
                selected_state=selected_state,
                date=date
            )
        )
    )
    print(f"Successfully loaded weather data for {str(date)} to bucket")


dag = DAG(
    dag_id="dag-extract-weather-data",
    description="Extract Weather Data",
    catchup=False,
    default_args=default_args,
    schedule_interval='@daily'
)


# State file is stored locally as part of DAG code until it can be generated from upstream dependencies:
with open(f"{os.path.dirname(__file__)}/states_counties.json") as f:
    state_to_countries = json.load(f)


for state in state_to_countries.keys():
    config = Variable.get("extract_weather_data_config", deserialize_json=True)
    print(f"task-load-data-{slugify_state(state)}")
    PythonOperator(
        task_id=f"task-load-weather-{slugify_state(state)}",
        python_callable=load_weather_for_state_for_date,
        op_kwargs={
            "base_url": config["weatherapi_base_url"],
            "api_key": config["weatherapi_key"],
            "state_to_counties": state_to_countries,
            "bucket_name": config["visitdata_bucket_name"],
            "bucket_base_path": config["weatherapi_bucket_base_path"],
            "selected_state": state
        },
        provide_context=True,
        dag=dag
    )

