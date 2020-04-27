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
API_KEY = os.environ.get("API_WEATHER_KEY", "a70a4e2736644cdcb9d85348202404")
BUCKET_NAME = os.environ.get("BUCKET_NAME", "default")

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': days_ago(1),
    'retries': 1,
    'retry_delay': timedelta(minutes=5)
}

gcs = Client()
bucket = gcs.bucket(BUCKET_NAME)
state_file = bucket.get_blob("states_counties.json")
STATES = json.loads(state_file.download_as_string())

def slugify_state(state):
    return "-".join(state.split())

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

def weather_func_builder(state):
    selected_state = state
    def get_weather():
        data = {"updated": datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        counties = STATES[selected_state]
        blob = bucket.get_blob("{}.json".format(selected_state))
        if blob is None:
            stated_cached_data = {}
        else:
            stated_cached_data = json.loads(blob.download_as_string())
        for county in counties:
            api_data = get_weather_data(county)
            cached_data = stated_cached_data.get(county, {})
            data[county] = always_merger.merge(cached_data, api_data)

        state_blob = bucket.blob("{}.json".format(selected_state))
        state_blob.upload_from_string(json.dumps(data))

        return True
    return get_weather



def create_dag(dag_id, state):
    dag = DAG(
        dag_id=dag_id,
        description="Weather DAG",
        default_args=default_args,
        schedule_interval='@daily'
    )


    get_data_api = PythonOperator(
        task_id="get-data-{}".format(slugify_state(state)),
        python_callable=weather_func_builder(state),
        dag=dag
    )

    return dag

for state in STATES.keys():
    dag_id = "{}-weather".format(slugify_state(state))
    globals()[dag_id] = create_dag(dag_id, state)

