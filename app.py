from flask import Flask, redirect, render_template, request, session, url_for
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
from authlib.integrations.flask_client import OAuth
from functools import wraps
from tempfile import mkdtemp
import sqlite3

# config app
app = Flask(__name__)
# use config file

# *add to config file*
app.config["SESSION_FILE_DIR"] = mkdtemp()
app.config["SESSION_PERMANENT"] = False
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
def SQL(query, p1=None):
    conn = sqlite3.connect("hearthstone.db")
    with conn:
        cur = conn.cursor()
        if p1 == None:
            result = cur.execute(query)
        else:
            result = cur.execute(query, p1)
        conn.commit()
        return list(result)


def login_required(f):
    """
    Decorate routes to require login.
    https://flask.palletsprojects.com/en/1.1.x/patterns/viewdecorators/
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") == None:
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated_function


@app.route("/", methods=["GET", "POST"])
@login_required
def index():

    battle_tag = dict(session).get("battletag", None)
    user_id = dict(session).get("username", None) 
    return f"hello {battle_tag} user {user_id}"


@app.route("/login", methods=["GET", "POST"])
def login():
    session.clear()
    error = None
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        # Preform DB query for username
        sql_query = SQL("SELECT * FROM users WHERE username = ?", (username,))
        # Checks if username field was left blank
        if not username:
            error = "Must enter a username."
        # Check if PW field was blank
        elif not password:
            error = "Must enter a password."
        # Check both username and PW in users DB
        elif not len(sql_query) == 1 or not check_password_hash(sql_query[0][2], password):
            error = "No registered account with that username and password."
        # Sign in user/load homepage
        if error == None:
            session["user_id"] = sql_query[0][0]
            session["username"] = sql_query[0][1]
            return redirect("/")

    return render_template("login.html", error=error)


@app.route("/logout")
def logout():
    session.clear()
    return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    error = None
    if request.method == "POST":
        # grab user input from form
        username = request.form.get("username")
        password = request.form.get("password")
        confirm = request.form.get("confirm")
        # verify user input
        query_result = SQL("SELECT COUNT(id) FROM users WHERE username = ?", (username,))
        if query_result[0][0] == 1 or username == "":
            error = "Username already in use or field was left blank."
        elif password == "" or not password == confirm:
            error = "Passwords do not match or field was left blank"
        else:
            # hash password to store in DB
            PWhash = generate_password_hash(password, method='pbkdf2:sha256')
            SQL("INSERT INTO users (username, hash) VALUES (?, ?)", (username, PWhash))
            return render_template("login.html")

    return render_template("register.html", error=error) 

@app.route("/battlenet_login")
@login_required
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
    # store token and battletag in database
    SQL(("UPDATE users SET token = ?, battle_tag = ? WHERE id = ?", token, user["battle_tag"], session.user_id))
    return redirect("/")