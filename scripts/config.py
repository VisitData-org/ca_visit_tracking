BASE_URL = "http://api.weatherapi.com/v1/history.json?key={}&q={}+united+states&dt={}"
API_KEY = "1ebc11488ad5487a83a191652201604"
DATA_PATH = "localdata/"
STATES = {
    "Montana": [
        "Cascade County",
        "Flathead County",
        "Gallatin County",
        "Lewis and Clark County",
        "Madison County",
        "Missoula County",
        "Ravalli County",
        "Silver Bow County",
        "Yellowstone County"
    ],
    "Idaho": [
        "Ada County",
        "Bannock County",
        "Bingham County",
        "Blaine County",
        "Bonner County",
        "Bonneville County",
        "Canyon County",
        "Elmore County",
        "Jerome County",
        "Kootenai County",
        "Latah County",
        "Madison County",
        "Minidoka County",
        "Nez Perce County",
        "Twin Falls County",
    ]
}

NO_STATE_ERROR_RESPONSE = {
    "error": "There is no data for that state"
}