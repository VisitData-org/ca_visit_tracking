# [START gae_python37_app]
from flask import Flask, redirect, render_template

app = Flask(__name__, static_url_path="", static_folder="static")
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 60


@app.route("/")
def root():
    return redirect("/index.html")


@app.route("/index.html")
def index():
    return render_template("index.html")


@app.route("/bydate.html")
def bydate():
    return render_template("bydate.html")


@app.route("/report_tree.html")
def report_tree():
    return render_template("report_tree.html")


if __name__ == "__main__":
    # This is used when running locally only. When deploying to Google App
    # Engine, a webserver process such as Gunicorn will serve the app. This
    # can be configured by adding an `entrypoint` to app.yaml.
    app.run(host="127.0.0.1", port=8080, debug=True)
# [END gae_python37_app]
