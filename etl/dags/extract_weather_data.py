from datetime import timedelta, datetime
from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from airflow.utils.dates import days_ago
import json
from google.cloud.storage import Client
import requests
from deepmerge import always_merger
import os

BASE_URL = "http://api.weatherapi.com/v1/history.json?key={}&q={}+united+states&dt={}"
# Get a weatherapi.com api key
API_KEY = os.environ.get("API_WEATHER_KEY", "1ebc11488ad5487a83a191652201604")

BUCKET_NAME = os.environ.get("BUCKET_NAME", "default")

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': days_ago(1),
    'retries': 1,
    'retry_delay': timedelta(minutes=5)
}

def get_weather_data(query):
    weather = {}
    weather["forecast"] = {}
    date = datetime.today()
    full_url = BASE_URL.format(API_KEY, query, date.strftime('%Y-%m-%d'))
    response = requests.get(full_url)
    data = response.json()
    try:
        forecast = data["forecast"]["forecastday"][0]
        location = data["location"]
        forecast["day"].pop("condition")
        weather = {**weather, **location}

        weather["forecast"][forecast["date_epoch"]] = forecast["day"]
    except:
        return weather

    return weather

def get_weather():
    data = {}
    gcs = Client()
    bucket = gcs.bucket(BUCKET_NAME)
    state_file = bucket.get_blob("states_counties.json")
    states = json.loads(state_file.download_as_string())

    for state, counties in states.items():
        data[state] = {}
        data[state]["updated"] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        blob = bucket.get_blob("{}.json".format(state))
        if blob is None:
            stated_cached_data = {}
        else:
            stated_cached_data = json.loads(blob.download_as_string())
        for county in counties:
            api_data = get_weather_data(county)
            cached_data = stated_cached_data.get(county, {})
            data[state][county] =always_merger.merge(cached_data, api_data)

        state_blob = bucket.blob("{}.json".format(state))
        state_blob.upload_from_string(json.dumps(data[state]))

    return True


dag = DAG(
    dag_id="retrieve_weather_data",
    description="Weather DAG",
    default_args=default_args,
    schedule_interval='@daily'
)

get_data_api = PythonOperator(
    task_id="get-data-api",
    python_callable=get_weather,
    execution_timeout=timedelta(days=30),
    dag=dag
)

