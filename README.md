# Hello!

If you are a crisis response team who needs help working with this data — please contact support@visitdata.org.

VisitData.org needs volunteer programmers, data analysts, and crisis team liaisons — please contact volunteers@visitdata.org or visit https://github.com/VisitData-org/ca_visit_tracking.

More FAQs here: https://visitdata.org/faq


# Running locally
To run the app locally, in development mode:

1. Obtain a Google Maps API key. If you do not have one, you can just set it to
   `""` and the map will be disabled. Note the API key should never be committed
   to the git repository.
2. Set up a Python virtualenv, as specified below.
3. Run the server, as specified below.
4. Use Chrome or Firefox as your browser - it is reported that Safari reports
   a CORS error in development.

## Set up a Python environment
To set up a virtual env:
```bash
$ python3 -m venv ~/myenv
$ source ~/myenv/bin/activate
$ pip install -r requirements.txt
```

## Run server in development mode:
To run the server in development mode:

```bash
$ export MAPS_API_KEY="..."
$ gcloud auth application-default login
$ make run
```

The development server will automatically refresh when files change.

# Accessing the data
Data has moved out of the repository and into Google Cloud Storage in
a public bucket. You can access the latest data
at https://visitdata.org/data/

## Accessing from the bucket directly
1. Install the [Google Cloud SDK](https://cloud.google.com/sdk/install)
2. Run:
    ```
    gsutil ls gs://data.visitdata.org
    ```

## Accessing via http
The latest data snapshot is hosted on https://visitdata.org/data/

Historic data snapshots are also hosted on https://data.visitdata.org/

For example, you can retrieve
https://data.visitdata.org/processed/vendor/foursquare/asof/20200403-v0/taxonomy.json

# Weather Data

Weather data is retrieved from weatherapi.com. After retrieving the data, it creates a file with the following structure:
`<state>.json:`
```
{
    <county-1>: {
        forecast: {
            day-1-timestamp: { <weather_data> },
            day-2-timestamp: { <weather_data> },
            ...
        }
    },
    <county-2>: { .... }
    ...
}
```

In the **production environment**, a task will be exececuted daily (`etl/dags/extract_weather_data.py`) to store
the weather data into a google cloud bucket.
 
 `BUCKET_NAME` variable must be defined in the airflow server
 
Once the data is stored in the bucket, we can get the weather data for one state in the route 
`weather/<state>`

To get that data from the google cloud the `BUCKET_NAME` environment variable must be defined. Otherwise,
data will be stored locally in the path `localdata/`
 

# Importing new data
To import new data:

1. Copy yesterday's data
   ```bash
   $ gsutil -m cp -r gs://data.visitdata.org/processed/vendor/foursquare/asof/20200402-v0 /tmp
   ```

2. Process the new day's data by pointing to the previous day's data, the new
   download file and the name of the build directory to be created by the script.
   
   ```bash
   $ bin/foursquare_extract.sh /tmp/20200402-v0 ~/Downloads/apr-3 /tmp/build
   ```

3. Load the processed data to the bucket

   ```bash
   $ bin/foursquare_load.sh /tmp/build 20200403-v0 
   ```

4. Modify `app.yaml` to point to the new data version

   ```bash
   $ vi app.yaml
   ...
   env_variables:
     FOURSQUARE_DATA_VERSION: "20200403-v0"
   ```

# Deploying to the web server
To deploy the app to visitdata.org:

## Setting up Google Cloud SDK for AppEngine
1. Install the latest gcloud SDK: https://cloud.google.com/sdk/docs
2. Login using a Google account:

   ```bash
   $ gcloud auth login
   ```
   
3. Set the default project:

   ```bash
   $ gcloud config set project os-covid
   ```
   
## To deploy the app to beta.visitdata.org:
Run:

```bash
$ cd .../ca_visit_tracking
$ make deploy-beta
```

## To deploy the app to visitdata.org (production):
Run:

```bash
$ cd .../ca_visit_tracking
$ make deploy-prod
```

# Data ETL via Airflow
Extract, Transform and Load (ETL) Airflow operators and DAGs in this repository
under `etl/`. These can be run locally or on the production server.

See the `etl/README.md` for details.
