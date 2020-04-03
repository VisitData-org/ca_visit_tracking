# [START gae_python37_app]
from flask import Flask, redirect, render_template


app = Flask(__name__, static_url_path="", static_folder="static")


@app.route("/")
def root():
    return redirect("/index.html")


@app.route("/index.html")
def index():
    return render_template("statelist.html")

@app.route("/counties/<counties>")
def bycounties(counties):
    return render_template("index.html", counties=counties, venues="")

@app.route("/venues/<venues>")
def byvenues(venues):
    return render_template("index.html", counties="", venues=venues)

@app.route("/bydate.html")
def bydate():
    return render_template("bydate.html", state="", counties="", venues="")

@app.route("/bydatesel/<state>")
def bydateselstate(state):
    return render_template("bydate.html", state=state, counties="", venues="")

@app.route("/bydatesel/<state>/<counties>/<venues>")
def bydatesel(state, counties, venues):
    return render_template("bydate.html", state=state, counties=counties, venues=venues)

@app.route("/allstate.html")
def bystate():
    return render_template("allstate.html", state="ALL", venues="ALL")

@app.route("/bystatesel/<state>")
def bystateselstate(state):
    return render_template("allstate.html", state=state, venues="")

@app.route("/bystatesel/<state>/<venues>")
def bystatesel(state, venues):
    return render_template("allstate.html", state=state, venues=venues)

@app.route("/faq")
def faq():
    return render_template("faq.html")

@app.route("/nonav")
def nonav():
    return render_template(maps_api_key=appstate["maps_api_key"])

def page_not_found(e):
    return render_template('404.html'), 404

app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 60
app.register_error_handler(404, page_not_found)


if __name__ == "__main__":
    # This is used when running locally only. When deploying to Google App
    # Engine, a webserver process such as Gunicorn will serve the app. This
    # can be configured by adding an `entrypoint` to app.yaml.
    app.run(host="127.0.0.1", port=8080, debug=True)
# [END gae_python37_app]
