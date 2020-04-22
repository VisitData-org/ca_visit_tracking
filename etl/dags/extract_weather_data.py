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

# TODO Create a file with the counties for each State and save it in cloud
STATES = {
    "Montana": [
        "Cascade County",
        "Flathead County",
        "Gallatin County",
        "Lewis and Clark County",
        "Madison County",
        "Missoula County",
        "Ravalli County",
        "Silver Bow County",
        "Yellowstone County"
    ],
    "Idaho": [
        "Ada County",
        "Bannock County",
        "Bingham County",
        "Blaine County",
        "Bonner County",
        "Bonneville County",
        "Canyon County",
        "Elmore County",
        "Jerome County",
        "Kootenai County",
        "Latah County",
        "Madison County",
        "Minidoka County",
        "Nez Perce County",
        "Twin Falls County",
    ]
}
BUCKET_NAME = os.environ.get("BUCKET_NAME", "default")

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': days_ago(1),
    'retries': 1,
    'retry_delay': timedelta(minutes=5)
}

def get_weather_data(query, limit=7):
    weather = {}
    weather["forecast"] = {}
    for day in range(limit, -1, -1):
        date = datetime.today() - timedelta(days=day)
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
            continue

    return weather

def get_weather():
    data = {}
    for state, counties in STATES.items():
        data[state] = {}
        data[state]["updated"] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        for county in counties:
            data[state][county] = get_weather_data(county)
    return data


def get_cached_data():
    data = {}
    gcs = Client()
    bucket = gcs.bucket(BUCKET_NAME)
    for state in STATES.keys():
        blob = bucket.get_blob("{}.json".format(state))
        if blob is None:
            data[state] = {}
        else:
            data[state] = json.loads(blob.download_as_string())
    return data



def merge_data(**context):
    ti = context["ti"]
    data = {}
    stored_data = ti.xcom_pull(task_ids="get-data-gcloud", key=None)
    api_data = ti.xcom_pull(task_ids="get-data-api", key=None)
    for state in STATES.keys():
        data[state] = always_merger.merge(stored_data[state], api_data[state])

    return data

def update_data(**context):
    ti = context["ti"]
    data = ti.xcom_pull(task_ids="merge-all-data", key=None)
    gcs = Client()
    bucket = gcs.bucket(BUCKET_NAME)
    for state in STATES.keys():
        blob = bucket.blob("{}.json".format(state))
        blob.upload_from_string(json.dumps(data[state]))

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
    dag=dag
)

get_data_gcloud = PythonOperator(
    task_id="get-data-gcloud",
    python_callable=get_cached_data,
    dag=dag
)

merge_all_data = PythonOperator(
    task_id="merge-all-data",
    python_callable=merge_data,
    provide_context=True,
    dag=dag
)

update_all_data = PythonOperator(
    task_id="save-data",
    python_callable=update_data,
    provide_context=True,
    dag=dag
)

update_all_data << merge_all_data << [get_data_api, get_data_gcloud]
