# [START gae_python37_app]
from flask import Flask

app = Flask(__name__, static_url_path="", static_folder="www")

@app.route('/')
def hello():
    return app.send_static_file("index.html")


if __name__ == '__main__':
    # This is used when running locally only. When deploying to Google App
    # Engine, a webserver process such as Gunicorn will serve the app. This
    # can be configured by adding an `entrypoint` to app.yaml.
    app.run(host='127.0.0.1', port=8080, debug=True)
# [END gae_python37_app]
