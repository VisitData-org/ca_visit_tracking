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
a public bucket. You can access the data in the following ways:

## Accessing from the bucket directly
1. Install the [Google Cloud SDK](https://cloud.google.com/sdk/install)
2. Run:
    ```
    gsutil ls gs://data.visitdata.org
    ```

## Accessing via http
The data is also hosted on https://data.visitdata.org/

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
