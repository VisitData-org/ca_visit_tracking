import requests, json
from datetime import datetime, timedelta

base_url = "http://api.weatherapi.com/v1/history.json?key={}&q={}&dt={}"
api_key = "1ebc11488ad5487a83a191652201604"

def get_cached_data(state, date_epoch):
    # TODO Retrieve stored data
    return {}



def get_weather_data(state, limit=7):
    weather = {}
    for day in range(limit, -1, -1):
        date = datetime.today() - timedelta(days=day)
        full_url = base_url.format(api_key, state, date.strftime('%Y-%m-%d'))
        response = requests.get(full_url)
        data = response.json()
        try:
            forecast = data["forecast"]["forecastday"][0]
            location = data["location"]
            state_name = location["name"]
            forecast["day"].pop("condition")
            if day == limit:
                weather[state_name] = {}
                weather[state_name]["forecast"] = {}
                weather[state_name] = {**weather[state_name], **location}

            weather[state_name]["forecast"][forecast["date_epoch"]] = forecast["day"]
        except :
            continue

    print(weather)

get_weather_data("montana+Yellowstone");