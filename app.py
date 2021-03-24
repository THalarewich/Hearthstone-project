from flask import Flask, redirect, render_template, request, session, url_for
from flask_session import Session
from authlib.integrations.flask_client import OAuth

import sqlite3

# config app
app = Flask(__name__)
# use config file

# *add to config file*
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)
# Oauth config
oauth = OAuth(app)
# *figure out why client_id and client_secret are not being read from config.py*
hearthstone = oauth.register(
    name = "hearthstone", 
    access_token_url = "https://us.battle.net/oauth/token",
    access_token_params = None,
    authorize_url = "https://us.battle.net/oauth/authorize",
    authorize_params = None,
    api_base_url = "http://us.battle.net",
    client_kwargs = {"scope":"openid"}
)
app.config.from_object('config.Config')

# Create connection with DB, preform query, return result set, close DB connection 
def SQL(query):
    conn = sqlite3.connect("hearthstone.db")
    with conn:
        cur = conn.cursor()
        result = cur.execute(query)
        conn.commit()
        return result

@app.route("/", methods=["GET", "POST"])
#@login_required
def index():
    # resp = get.("")
    # user_info = resp.json()
    battle_tag = dict(session).get("battletag", None)  
    return f"hello {battle_tag}"

@app.route("/battlenet_login")
def login():
    hearthstone = oauth.create_client("hearthstone")
    redirect_uri = url_for("authorize", _external=True)
    return hearthstone.authorize_redirect(redirect_uri)

@app.route("/authorize")
def authorize():
    hearthstone = oauth.create_client("hearthstone")
    token = hearthstone.authorize_access_token()
    resp = hearthstone.get("oauth/userinfo")
    resp.raise_for_status()
    user = resp.json()
    session["battletag"] = user["battletag"]
    # do something with the token and profile
    return redirect("/")