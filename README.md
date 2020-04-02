# Hello!

If you are a crisis response team who needs help working with this data — please contact support@visitdata.org.

VisitData.org needs volunteer programmers, data analysts, and crisis team liaisons — please contact volunteers@visitdata.org or visit https://github.com/dsjoerg/ca_visit_tracking.

# Running locally
To run the app locally, in development mode:

## Set up a Python environment
To set up a virtual env:
```bash
$ python3 -m venv ~/myenv
$ source ~/myenv/bin/activate
$ pip install -r requirements.txt
```

## Run server in development mode:
The development server will automatically refresh when files change:

```bash
$ python main.py
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
   
## To deploy the app
Run:

```bash
$ cd .../ca_visit_tracking
$ make deploy
```
