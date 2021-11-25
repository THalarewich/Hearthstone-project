from flask import Flask, jsonify, redirect, render_template, request, session, url_for
from flask.wrappers import Response
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
from authlib.integrations.flask_client import OAuth
from functools import wraps
import json
import requests
import sqlite3

# config app
app = Flask(__name__)
# configure app using config.py file
app.config.from_object('config.Config')

Session(app)
# Oauth config
oauth = OAuth(app)
# *figure out why client_id and client_secret are not being read from config.py*
hearthstone = oauth.register(
    name = "hearthstone", 
    client_id = app.config["CLIENT_ID"],
    client_secret = app.config["CLIENT_SECRET"],
    access_token_url = "https://us.battle.net/oauth/token",
    access_token_params = None,
    authorize_url = "https://us.battle.net/oauth/authorize",
    authorize_params = None,
    api_base_url = "http://us.battle.net",
    client_kwargs = {"scope":"openid"}
)

# Create connection with DB, preform query, return result set, close DB connection
# Params need to be set as tuples (with a ,) 
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
def root():
    if request.method == "POST":
        pass
    battle_tag = dict(session).get("battletag", None)
    user_id = dict(session).get("username", None)
    #print(battle_tag, user_id)
    # pass in PB times for match game
    return render_template("profile.html")

@app.route("/profile", methods=["GET", "POST"])
@login_required
def profile():
    # user sends post request to /profile
    # check for correct user input
    # query SQL db for decks
    if request.method == "POST":
        search_params = request.get_json()
        print(search_params)
        returned_decks = {"deckCount": 0}
        SQLquery = None
        # *** What if 'Any class' is selected???
        if search_params["deckClass"] == None:
            print('deckclass = none')
            SQLquery = SQL('SELECT deck, id FROM decks WHERE deck_name = ? AND user_id = ?', 
                (search_params["deckName"], session["user_id"]))
        elif search_params["deckName"] == None:
            print('deckname = none')
            SQLquery = SQL('SELECT deck, id FROM decks WHERE class = ? AND user_id = ?', 
                (search_params["deckClass"], session["user_id"]))
        else:
            print('last chance')
            print(search_params["deckName"], search_params["deckClass"])
            SQLquery = SQL('SELECT deck, id FROM decks WHERE class = ? AND deck_name = ? AND user_id = ?', 
                (search_params["deckClass"], search_params["deckName"], session["user_id"]))
        # convert tuple to list of lists
        if  SQLquery != None:
            i = 0
            # create a dict that holds {deckID: deck} pairs
            for deck in SQLquery:
                returned_decks[str(SQLquery[i][1])] = json.loads(''.join(deck[0]))
                returned_decks["deckCount"] += 1
                i += 1
        # ***deal with if any class is selected!
        return jsonify(returned_decks)
        # pass in PB times and decks to be displayed
    battle_tag = dict(session).get("battletag", None)
    user_id = dict(session).get("username", None)
    #print(battle_tag, user_id)
    # pass in PB times for match game
    return render_template("profile.html")

# Handles checking user login credentials and login
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
    # If route is requested through a GET request
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
            error = "Password field was left blank or passwords do not match"
        else:
            # hash password to store in DB
            PWhash = generate_password_hash(password, method='pbkdf2:sha256')
            SQL("INSERT INTO users (username, hash) VALUES (?, ?)", (username, PWhash))
            return render_template("login.html")
    # if route is requested through a GET request
    return render_template("register.html", error=error) 

# Oauth functions for Battle.net login
@app.route("/battlenet_login")
@login_required
def battlenet_login():
    hearthstone = oauth.create_client("hearthstone")
    redirect_uri = url_for("authorize", _external=True)
    return hearthstone.authorize_redirect(redirect_uri)

# Oauth func / save info to DB for BN logins & api calls
@app.route("/authorize")
def authorize():
    hearthstone = oauth.create_client("hearthstone")
    token = hearthstone.authorize_access_token()
    resp = hearthstone.get("oauth/userinfo")
    resp.raise_for_status()
    user = resp.json()
    # store token and battletag in database
    SQL("UPDATE users SET access_token = ?, battle_tag = ? WHERE id = ?", (token["access_token"], user["battletag"], session["user_id"]))
    return redirect("/")

@app.route("/builder", methods=["GET", "POST"])
def deck_builder():
    if request.method == "POST":
        deck = request.get_json()
        print(request)
        deck_list = []
        message = []
        
        # look into another way of dealing with the data from request
        # hacky work around got past the error (unable to bind parameter 1 - probably unsupported type)
            # using request.get_json() to take the json from the request and parse it to a python list
            # then using json.dumps() to the serialize that python list into json

        # use class of deck and user_id to narrow down what decks to check against
        saved_decks = SQL('SELECT deck FROM decks WHERE user_id = ? AND class = ?', 
            (session["user_id"], deck[0]["deck_class"]))
        # once those decks are narrowed down, convert them from JSON to a list
        for single_deck in saved_decks:
            deck_list.append(json.loads(''.join(single_deck)))
        i = 0
        deck_found = False
        # loop through lists to see if the same card make up is already in use
        while i < len(deck_list) and deck_found == False:
            deck_search = {
                "matched_cards" : 0,
                "start_pos" : 1
            }
            x = 1
            while x < len(deck):
                j = deck_search["start_pos"]
                while j < len(deck_list[i]):
                    # if card "x" in "deck" = card "j" in "deck" "i" from SQL query (deck_list)
                    if deck[x]["id"] == deck_list[i][j]["id"]:
                        # if card amount is the same
                        if deck[x]["amount"] == deck_list[i][j]["amount"]:
                            deck_search["matched_cards"] += deck[x]["amount"]
                            # change order of the DB list to make search faster
                            temp = deck_list[i][j]
                            deck_list[i].pop(j)
                            deck_list[i].insert(1, temp)
                            deck_search["start_pos"] += 1
                            print("match", i, x, j)
                            x += 1
                            break
                    # if card "x" is not in deck_list[i] end the 2 inner loops to move to the next deck
                    elif j == (len(deck_list[i]) - 1):
                        x = len(deck)
                    print('no match that time', i, x, j, deck_search["matched_cards"])
                    # if card "x" doesnt match card "j" increase j by 1
                    j += 1
            if deck_search["matched_cards"] == 20:
                # ***notify the user to let them know a deck with the same cards is already saved 
                        # (return to the user the name of said deck)
                deck_found = True
                message = {
                    "deck_name" : deck_list[i][0]["deck_name"],
                    "message" : "You have already saved a deck with those cards"
                }
                print("deck found")
            i += 1
        if deck_found == False:
            # save the 'deck'
            # ***notify the user the deck has been saved
            print("the deck has been saved!")
            message = {
                "message" : "Your deck has been saved"
            }
            SQL('INSERT INTO decks (user_id, deck_name, deck, class) VALUES (?, ?, ?, ?)', 
                (session["user_id"], deck[0]["deck_name"], json.dumps(deck), deck[0]["deck_class"]))
        # ***return info to JS to display for user (whether the deck was saved or 
            # already exists(if so send the name of the saved deck to JS))
            # refresh builder.html template if deck was saved successfully
        return jsonify(message)
    return render_template("builder.html")

@app.route("/match", methods=["GET", "POST"])
def match():
    if request.method == "POST":        

# ****JS console error (uncaught error in promise) unexpected token < in JSON at pos 0
#  the above error could be caused by the response object being sent back instead of JSON OR it could be sending 
#   back the HTML template!!!!!!

    #         if the code in app.py/match is changed from 
    #      data = json.loads(request.data)
    #          time = data.get("timePlayed", None)
    #          if time is None:
    #              return jsonify({"message":"time not found"})
    #          else:
    #         to: time = request.get_json()
    # there is a bunch of errors that is flask not accepting what is being sent as real JSON
        #  the following code is working
        #     it sends the correct JSON from JS and sends the correct JSON back to JS
        # do something with the data to check DB for top 3 times
        # if the data time beats atleast one of the times, edit the DB table
        # send a message back to JS to notify user
        print(request)
        data = json.loads(request.data)
        time = data.get("timePlayed", None)
        message = {"message": "","score": None, "outcome": None}
        if time is None:
            message["message"] = "time not found"
            return jsonify(message)
        else:
            player_times = SQL("SELECT * FROM times WHERE user_id = ?", (session["user_id"],))
            high_score = []
            times = []
            # figure out a better way to deal with messages to the user, ei different outcomes to different situations
            #   (when the user has only played the game once before and has 9999 as the other 2 scores)
            # if the user has played the game before
            if player_times != []:
                high_score = list(player_times[0])
                high_score.pop(0)
            # iterate through to create an individual duplicate list
                for scores in high_score:
                    times.append(scores)
            # check for fastest completion time
                i = 0
                while i < len(times):
                    if time < times[i]:
                        times.insert(i, time)
                        if len(times) == 3:
                            times.pop()
                        message["score"] = time
                        message["outcome"] = "win"
                        break
                    i += 1
                # if there is a new 3 top scores
                if times != high_score:
                    SQL("UPDATE times SET first = ?, second = ?, third = ? WHERE user_id = ?", 
                        (times[0], times[1], times[2], session["user_id"]))
                    message["message"] = "You beat one of your top 3 high scores!"
                else:
                    message["message"] = "Sorry, you were not able to beat one of your top 3 scoring times. Please try again!"
                    message["score"] = [time, times[2]]
                    message["outcome"] = "lose"
            # if a user has never played the game before
            else:
                SQL("INSERT INTO times (user_id, first, second, third) VALUES (?, ?, 9999, 9999)", (session["user_id"], time))
                message["message"] = "Your new high score"
                message["score"] = time
                message["outcome"] = "win"
            return jsonify(message)
    return render_template("match.html")

@app.route("/api_call/<card>", methods=["GET", "POST"])
def api_card_call(card):
    # ***NEED ERROR HANDLING FOR IF USER DID NOT LINK TO BATTLE.NET ACCOUNT***
    # SQL query for current user access token
    token = SQL("SELECT access_token FROM users WHERE id = ?", (session["user_id"],))
    response = ''
    if request.method == "POST":
        # store search params from user 
        # use params to request certian data from api
        klass = None
        attack = None
        health = None
        card_type = None
        mana_cost = None
        minion_type = None
        card_search_url = "https://us.api.blizzard.com/hearthstone/cards?locale=en_US&set=standard&pageSize=500&access_token=" + token[0][0]

        print(token[0][0])
        search_params = request.get_json()
        if search_params["class"] != None:
            klass = "class=" + search_params["class"].lower().replace(" ", "") + "%2Cneutral"
            card_search_url += "&" + klass
            print(klass)
        if search_params["attack"] != None and search_params["attack"] != "Any Attack":
            attack = "attack=" + search_params["attack"].replace("Attack: ", "")
            card_search_url += "&" + attack
            print(attack)
        if search_params["health"] != None and search_params["health"] != "Any Health":
            health = "health=" + search_params["health"].replace("Health: ", "")
            card_search_url += "&" + health
            print(health)
        if search_params["cardType"] != None and search_params["cardType"] != "Any Type":
            card_type = "type=" + search_params["cardType"].lower()
            card_search_url += "&" + card_type
            print(card_type)
        if search_params["manaCost"] != None and search_params["manaCost"] != "Any Mana Cost":
            mana_cost = "manaCost=" + search_params["manaCost"].replace("Mana Cost: ", "")
            card_search_url += "&" + mana_cost
            print(mana_cost)
        if search_params["minionType"] != None and search_params["minionType"] != "Any Type":
            minion_type = "minionType=" + search_params["minionType"].lower()
            card_search_url += "&" + minion_type
            print(minion_type)
        print(card_search_url)
        print(search_params)
        # use set=standard to get only standard cards to show
        response = requests.get(card_search_url)
    else:
        #   Make a loop and get data from all 5 pages then send it to js
        # make api call and store in response var
        # api call params for card face currently
        # minion and 500 results per page
        if card == 'face':
            # returns card face/info
            response = requests.get(
            "https://us.api.blizzard.com/hearthstone/cards?locale=en_US&type=minion&pageSize=500&access_token=" + token[0][0])
        elif card == 'back':
            # returns card backs
            response = requests.get(
            "https://us.api.blizzard.com/hearthstone/cardbacks?locale=en_US&pageSize=500&sort=dateAdded%3Adesc&order (deprecated)=desc&access_token="  + token[0][0])
        # save response text to convert to JSON
    json_cards = response.text
    print(json_cards)
        # sends minion cards to JS file
    return jsonify(json_cards)

@app.route("/delete", methods=["POST"])
def delete():
    deleted_deck = request.get_json()
    print(deleted_deck)
    print(deleted_deck["id"])
    deck_exists = None
    # perform a sql query to check that the deck that was selected exists
    deck = SQL('SELECT COUNT(deck) FROM decks WHERE id = ? AND deck_name = ? AND user_id = ?', 
        (deleted_deck["id"], deleted_deck["name"], session["user_id"]))
    # check if deck exists
    print(deck[0][0])
    if deck[0][0] != 1:
        # figure out better error handling
        # return (500)
        print('deck not deleted')
    else:
        SQL('DELETE FROM decks WHERE id = ? AND deck_name = ? AND user_id = ?', 
        (deleted_deck["id"], deleted_deck["name"], session["user_id"]))
        print('deck deleted')
        
    return ('OK', 200)