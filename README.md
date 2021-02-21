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

# Importing new data
To import new data:

1. Copy yesterday's data
   ```bash
   $ gsutil -m cp -r gs://data.visitdata.org/processed/vendor/foursquare/asof/20200402-v0 /tmp
   ```

2. Process the new day's data by pointing to the previous day's data, the new
   download file and the name of the build directory to be created by the script.
   
   ```bash
   $ python3 bin/foursquare_cube.py --prevdir /tmp/build2/20200807-v20200807-v0/ /Users/david/Downloads/drive-download-20200810T211412Z-001/data-cube2-2020-08-07.tar v20200808-v0 /tmp/build3
   ```

3. Load the processed data to the bucket

   ```bash
   $ bin/foursquare_load.sh /tmp/build2/20200807-v20200807-v0/ 20200807-v0
   ```

4. Modify `app.yaml` to point to the new data version

   ```bash
   $ vi app.yaml
   ...
   env_variables:
     FOURSQUARE_DATA_VERSION: "20200403-v0"
   ```

## AJ's Daily Deployment Routine

I have something that notifies me via text message when there is a new file uploaded to the google drive between 5am and 10pm.  That prevents me from having to ask Nate to post in slack.  Data doesn't come in reliably at the same time every day and sometimes comes in 2-3 days in a batch.

1. Download the new data from the [Data Cube v20201120 Google Drive](https://drive.google.com/drive/folders/1gydRMonsn_tLwVRUe4CCFMdZ6uOLW0iy).
2. Move the files to my scratch directory:
```bash
ca_visit_tracking/datascratch on  master on ☁️ andrew@janian.net(emailstats)
❯ pwd
/Users/andrewjanian/covid/ca_visit_tracking/datascratch

ca_visit_tracking/datascratch on  master on ☁️ andrew@janian.net(emailstats)
❯ mv /Users/andrewjanian/Downloads/data-cube-2021-02-16.tar /Users/andrewjanian/Downloads/data-cube-2021-02-17.tar /Users/andrewjanian/Downloads/data-cube-2021-02-18.tar .
```
3. Cat the tars together
```bash
ca_visit_tracking/datascratch on  master on ☁️ andrew@janian.net(emailstats)
❯ rm data.tar && find . -type f -name "*.tar" -exec tar Af data.tar {} \;
```
4. In a single command process the files and upload them
```bash
ca_visit_tracking on  master via 🐍 v3.8.5 on ☁️ andrew@janian.net(emailstats)
❯ pwd
/Users/andrewjanian/covid/ca_visit_tracking

ca_visit_tracking on  master via 🐍 v3.8.5 on ☁️ andrew@janian.net(emailstats)
❯ python ./bin/foursquare_cube.py --prevdir=datascratch/20210215/20210215-v0 datascratch/data.tar v0 datascratch/20210218 && ./bin/foursquare_load.sh datascratch/20210218/20210218-v0 20210218-v0 && iphone "visitdata uploaded" "20210218" && make deploy-prod-quiet && make deploy-beta-quiet && iphone "visitdata deployed" "20210218"
```

### Notes
* This depends on you having the prior day's data in your scratch directory
* This uploads ~6GB of data so it takes a while
* In my command to process and upload the files there is a function I have called iphone which sends me a notification via pushover.net.  It doesn't have an impact on the processing or upload but let's me know that it is done so I can check
* Because I've done this so many times I use the quite versions of the deployment make targets so they don't ask me questions.  If you're starting it may be better to use the regular (non-quiet) targets.

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
