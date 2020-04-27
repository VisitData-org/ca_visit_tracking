# [START gae_python37_app]
import os
import pathlib
import sys
import traceback
from functools import lru_cache
from urllib.parse import urlparse, urlunparse

import yaml
from flask import Flask, redirect, render_template, request
from google.cloud import storage
from scripts.weather import get_state_weather_locally, get_state_weather_cloud


app = Flask(__name__, static_url_path="", static_folder="static")
app_state = {
    "maps_api_key": "",
    "weather_path_data": "vd-weather-data",
    "foursquare_data_url": "",
    "foursquare_data_version": ""
}


def error(message):
    print(message, file=sys.stderr)


@app.before_request
def redirect_www_and_http():
    """Redirect www requests to non-www and http to https."""
    url_parts = urlparse(request.url)

    if url_parts.netloc == "www.visitdata.org":
        url_parts_list = list(url_parts)
        url_parts_list[0] = "https"
        url_parts_list[1] = "visitdata.org"
        return redirect(urlunparse(url_parts_list), code=301)

    if url_parts.scheme == "http" and url_parts.netloc.endswith("visitdata.org"):
        url_parts_list = list(url_parts)
        url_parts_list[0] = "https"
        return redirect(urlunparse(url_parts_list), code=301)

    return None


@app.route("/")
def root():
    return redirect("/index.html")


@app.route("/index.html")
def index():
    return render_template("statelist.html", maps_api_key=app_state["maps_api_key"])


@app.route("/counties/<counties>")
def bycounties(counties):
    return render_template("index.html", counties=counties, venues="")


@app.route("/venues/<venues>")
def byvenues(venues):
    return render_template("index.html", counties="", venues=venues)


@app.route("/bydate.html")
def bydate():
    return render_template("bydate.html", state="", counties="", venues="",
                           foursquare_data_url=app_state["foursquare_data_url"])


@app.route("/bydatesel/<state>")
def bydateselstate(state):
    return render_template("bydate.html", state=state, counties="", venues="",
                           foursquare_data_url=app_state["foursquare_data_url"])


@app.route("/bydatesel/<state>/<counties>/<venues>")
def bydatesel(state, counties, venues):
    return render_template("bydate.html", state=state, counties=counties, venues=venues,
                           foursquare_data_url=app_state["foursquare_data_url"])


@app.route("/allstate.html")
def bystate():
    return render_template("allstate.html", state="ALL", venues="ALL",
                           foursquare_data_url=app_state["foursquare_data_url"])


@app.route("/bystatesel/<state>")
def bystateselstate(state):
    return render_template("allstate.html", state=state, venues="",
                           foursquare_data_url=app_state["foursquare_data_url"])


@app.route("/bystatesel/<state>/<venues>")
def bystatesel(state, venues):
    return render_template("allstate.html", state=state, venues=venues,
                           foursquare_data_url=app_state["foursquare_data_url"])


# @app.route("/cube.html")
# def rendercube():
#     return render_template("cube.html",
#                            foursquare_data_url=app_state["foursquare_data_url"])


@app.route("/faq")
def faq():
    return render_template("faq.html")


@app.route("/venuegroupdetails")
def venuegroupdetails():
    return render_template("venuegroupdetails.html")


@lru_cache(maxsize=1)
def _list_names():
    root_data_path = f"processed/vendor/foursquare/asof/{app_state['foursquare_data_version']}"
    storage_client = storage.Client()
    bucket = "data.visitdata.org"
    return [blob.name[len(root_data_path)+1:]
            for blob in storage_client.list_blobs(bucket, prefix=f"{root_data_path}/", )]


@app.route("/data")
def data_root():
    return data("")


@app.route("/data/")
def data_root_slash():
    return data("")


@app.route("/data/<path:path>")
def data(path):
    root_data_path = f"processed/vendor/foursquare/asof/{app_state['foursquare_data_version']}"
    if path.endswith(".csv") or path.endswith(".json"):
        return redirect(f"//data.visitdata.org/{root_data_path}/{path}", code=302)
    if path != "":
        return page_not_found("")
    names = _list_names()
    return render_template("list_data.html", names=names, url_prefix=f"/data",
                           snapshot_id=app_state['foursquare_data_version'])


@app.route("/weather/<state>")
def weather(state):
    if app_state["weather_path_data"] != "":
        return get_state_weather_cloud(state, app_state["weather_path_data"])
    else:
        return get_state_weather_locally(state)

def page_not_found(e):
    return render_template('404.html'), 404


def _init_maps_api_key():
    if os.getenv("GAE_ENV", "").startswith("standard"):
        # Production in the standard environment
        try:
            storage_client = storage.Client()
            project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
            project_bucket = f"{project_id}.appspot.com"
            bucket = storage_client.bucket(project_bucket)
            blob = bucket.blob("secrets/maps_api_key")
            maps_api_key = blob.download_as_string().decode("utf-8").rstrip()
        except IOError:
            traceback.print_exc(file=sys.stderr)
            maps_api_key = ""
    else:
        # Local execution.
        maps_api_key = os.getenv("MAPS_API_KEY", "")

    if maps_api_key == "":
        error("Could not retrieve API key. Disabling Google Maps API.")

    app_state["maps_api_key"] = maps_api_key


def _init_data_env():
    if "FOURSQUARE_DATA_VERSION" in os.environ:
        foursquare_data_version = os.getenv("FOURSQUARE_DATA_VERSION")
    else:
        # read from app.yaml
        app_yaml_file = pathlib.Path(__file__).parent.absolute() / "app.yaml"
        with open(app_yaml_file) as f:
            app_yaml_obj = yaml.safe_load(f)
            foursquare_data_version = app_yaml_obj["env_variables"]["FOURSQUARE_DATA_VERSION"]
    app_state["foursquare_data_version"] = foursquare_data_version
    app_state["foursquare_data_url"] =\
        f"//data.visitdata.org/processed/vendor/foursquare/asof/{foursquare_data_version}"

def _init_weather_data_env():
    # Gcloud bucket name
    bucket_name = os.getenv("BUCKET_NAME", "vd-weather-data")

    if bucket_name == "":
        error("Weather data will be stored locally")

    app_state["weather_path_data"] = bucket_name


def _init():
    app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 60
    app.register_error_handler(404, page_not_found)
    _init_maps_api_key()
    _init_weather_data_env()
    _init_data_env()
    print(app_state)


_init()


if __name__ == "__main__":
    # This is used when running locally only. When deploying to Google App
    # Engine, a webserver process such as Gunicorn will serve the app. This
    # can be configured by adding an `entrypoint` to app.yaml.
    app.run(host="127.0.0.1", port=8080, debug=True)
# [END gae_python37_app]
