from scripts.weather import get_weather_data
from scripts.config import STATES


def load_weather_data():
    for state in STATES.keys():
        get_weather_data(state)


load_weather_data()

