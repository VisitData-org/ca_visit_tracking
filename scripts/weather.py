import requests, json
from datetime import datetime, timedelta
from deepmerge import always_merger
from scripts.config import *
from google.cloud import storage


def get_weather_data(query, limit=30):
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
        except :
            continue

    return weather

def __load_state_file(state):
    try:
        with open("{}{}.json".format(DATA_PATH, state)) as f:
            data = json.load(f);
            return data
    except FileNotFoundError:
        return {}

def __update_state_file(state, data):
    with open("{}{}.json".format(DATA_PATH, state), "w+") as f:
        json.dump(data, f)

def get_state_weather_locally(state):
    STATES = {}

    with open("states_counties.json") as f:
        STATES = json.load(f)

    if state not in STATES:
        return json.dumps(NO_STATE_ERROR_RESPONSE)
    cached_data = __load_state_file(state)
    for county in STATES[state]:
        weather_data = get_weather_data(county)
        county_data = cached_data.get(county, {})
        cached_data[county] = always_merger.merge(county_data, weather_data)
    __update_state_file(state, cached_data)
    return json.dumps(cached_data)

def get_state_weather_cloud(state, bucket_name):
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    file = bucket.get_blob("{}.json".format(state))
    return json.loads(file.download_as_string()) if file is not None else {}


