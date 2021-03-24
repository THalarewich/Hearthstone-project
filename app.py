from flask import Flask, redirect, render_template, request, session, url_for
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
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
    battle_tag = dict(session).get("battletag", None)  
    return f"hello {battle_tag} user {session.user_id}"

@app.route("/login", methods=["GET", "POST"])
def login():
    session.clear()
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        # Checks if username field was left blank
        if not username:
            pass
            # return error("Must enter username")
        elif not password:
            pass
            # return error("Must enter password")
        # Checks if username is in the Database
        sql_query = SQL(("SELECT * FROM users WHERE username = ?", username))
        if not len(sql_query) == 1 or not check_password_hash(sql_query[0]["hash"], password):
            # return error("No registered account with that username and password")
            pass
        session["user_id"] = sql_query[0]["id"]
        return redirect("/")
    else:
        return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        # grab user input from form
        username = request.form.get("username")
        password = request.form.get("password")
        confirm = request.form.get("confirm")
        # verify user input
        query_result = SQL(("SELECT COUNT(id) FROM users WHERE username = ?", username))
        if query_result[0]["COUNT(id)"] == 1 or username == "":
            pass
            #return error(Username already taken or field was left blank)
        elif password == "" or not password == confirm:
            pass
            #return error(Passwords don't match or field was left blank)
        else:
            # hash password to store in DB
            PWhash = generate_password_hash(password, method='pbkdf2:sha256')
            SQL(("INSERT INTO users (username, hash) VALUES (?, ?)", username, PWhash))
        return render_template("login.html")
    else:
        return render_template("register.html") 

@app.route("/battlenet_login")
def battlenet_login():
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
    # store 
    SQL(("UPDATE users SET token = ?, battle_tag = ? WHERE id = ?", token, user["battle_tag"], session.user_id))
    return redirect("/")