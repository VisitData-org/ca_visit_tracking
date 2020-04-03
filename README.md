# Hello!

If you are a crisis response team who needs help working with this data — please contact support@visitdata.org.

VisitData.org needs volunteer programmers, data analysts, and crisis team liaisons — please contact volunteers@visitdata.org or visit https://github.com/dsjoerg/ca_visit_tracking.

More FAQs here: https://visitdata.org/faq


# Running locally
To run the app locally, in development mode:

1. Obtain a Google Maps API key. If you do not have one, you can just set it to
   `""` and the map will be disabled. Note the API key should never be committed
   to the git repository.
2. Set up a Python virtualenv, as specified below.
3. Run the server, as specified below.

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
$ make run
```

The development server will automatically refresh when files change.

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
