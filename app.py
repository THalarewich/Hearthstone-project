from flask import Flask, redirect, render_template, request, session
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
import sqlite3

# config app
app = Flask(__name__)
# use config file
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
    redirect("/login")

@app.route("/login", methods=["GET", "POST"])
def login():
    session.clear()
    if request.method == "POST":
        if not request.form.get("username"):
            pass
            # return error("Must enter username")
        elif not request.form.get("password"):
            pass
            # return error("Must enter password")
        
        redirect("/")
    else:
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