# Extract Transform and Load (ETL)
This directory contains ETL jobs for visitdata.org. They are coded as airflow operators and
DAGs.

# Setting up a local development environment
To run these DAGs locally, first create a local development environment as follows:

```bash
$ cd etl/
$ virtualenv ~/venv/visitdata-dag -p python3.7
$ source ~/venv/visitdata-dag/bin/activate
$ pip install -r requirements.txt
$ airflow initdb
```

# Running the sample DAG
The sample `hello` dag writes the current time to `gs://data.visitdata.org/processed/hello/lastrun`.

## Setup
Because this DAG uses Google Cloud Storage, first initialize as follows:

```bash
$ gcloud auth application-default login
```

## Testing the hello dag
To run the hello dag locally:

```bash
$ make test-hello
```

## Deploying to the airflow server
The airflow server gets the latest dags from `gs://dev.visitdata.org/dags/`.
To deploy the dags to the airflow server, run:

```bash
$ cd etl/
$ make deploy
``` 

## Browsing the airflow GUI
To access the airflow UI, first, start the airflow tunnel:
```bash
$ cd ca_visit_tracking
$ make airflow-tunnel
```

After starting the tunnel, you can access the UI at http://localhost:18080.
