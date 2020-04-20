from datetime import timedelta, datetime

from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from airflow.utils.dates import days_ago

from google.cloud.storage import Client


default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': days_ago(1),
    'retries': 1,
    'retry_delay': timedelta(minutes=5)
}


def hello(**kwargs):
    gcs = Client()
    bucket = gcs.bucket("data.visitdata.org")
    blob = bucket.blob("processed/hello/lastrun")
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    blob.upload_from_string(f"{timestamp}\n")
    print("Successfully wrote timestamp to bucket: {}".format(timestamp))


dag = DAG(
    dag_id="dag-hello",
    description="Hello world DAG",
    catchup=False,
    default_args=default_args,
    schedule_interval='@daily'
)


task_hello = PythonOperator(
    task_id="task-hello",
    python_callable=hello,
    dag=dag
)
