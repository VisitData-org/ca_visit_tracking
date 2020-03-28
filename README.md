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
$ gcloud app deploy .
```
