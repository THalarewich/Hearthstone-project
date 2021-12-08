// card flipping game

// TODO: 
//      bug that deals with flipping the cards
//          when you get a match if you flip another card all 3 will disapear and game cannot be completed
//          if 2 are flipped over (not a match) and a 3rd is flipped as the first 2 are flipping back the 3rd will flip
//              back by itself after the first 2 have flipped back

//      display timer on screen???

// holds data from api calls
let fullDeck = {};
// 
let start;
const gameTime = {timePlayed: null};
let discarded;
let cardsFaceDown;
// array for cards that are currently face up
let cardsFaceUp = [];
// html button for new game
const shuffle = document.getElementById('test-button');
// html collection of li elements as game board spaces
const gameSpaces = document.getElementsByClassName('col');

// fetch api call to flask for hearthstone cards and info
// error handling?? try, catch?
async function fetchCards() {
    const [faceResponse, backResponse] = await Promise.all([
        fetch('/api_call/face'),
        fetch('/api_call/back')
    ]);
    const face = await faceResponse.json();
    const back = await backResponse.json();
    // if access token expires
    if (faceResponse.status != 200 || backResponse.status != 200) {
        console.log(`error code ${faceResponse.status}${backResponse.status}`)
    }else {
        return [face, back];
    }
};

// Make shuffle button show up on UI only after fullDeck is populated
// error handling?? .catch?
fetchCards().then(([face, back]) => {
    shuffle.style.display = 'block';
    return fullDeck = {
        face: JSON.parse(face), 
        back: JSON.parse(back)
    };
});

// randomly select a card back from the api
// populate array with random 10 cards and create doubles
// shuffle deck so doubles are not side x side
// call function to insert card imgs to html doc
function fillDeck(){
    const cardsInPlay = [];
    const cards = fullDeck.face.cards;
    const cardBacks = fullDeck.back.cardBacks;
    // Randomly select 1 card back to use for the round
    const cardBack = cardBacks[Math.floor(Math.random() * cardBacks.length)];
    for(let i = 0; i < 10; i++){
        let random = Math.floor(Math.random() * 500);
        // add doubles of each card
        for(let i = 0; i < 2; i++){
            cardsInPlay.push(cards[random]);
        }
    }
    // Use Durstenfeld shuffle to randomize card array
    for(let i = cardsInPlay.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [cardsInPlay[i], cardsInPlay[j]] = [cardsInPlay[j], cardsInPlay[i]];
    }
    fillBoard(cardsInPlay, cardBack);
}

// insert card imgs into html game board
function fillBoard(deck, cardBack){
    for(let i = 0; i < gameSpaces.length; i++){
        // insert html structure and card images for game/flipping animation
        let flippingCard = 
            `<div class="flip-card">
                <div class="flip-card-inner">
                    <div class="flip-card-front">
                        <img src=${deck[i].image} alt='Hearthstone card face #${i}'>
                    </div>
                    <div class="flip-card-back">
                        <img src=${cardBack.image} alt='Hearthstone card back'>
                    </div>
                </div>
            </div>`;
        gameSpaces[i].innerHTML = flippingCard;
    }
    //              start a timer for how long the round will take
    //              save PBs for profile of website
    cardsFaceDown = document.getElementsByClassName('flip-card');
    stopWatch('start')
    flipCards();
}

// click event listener to each card 
// error handling for any element ancestor of flip-card-inner??
function flipCards() {
    Array.from(cardsFaceDown).forEach(card => {
        card.addEventListener('click', e => {
            let targetCard = e.target;
            let found = false;
            // if 2 cards are flipped already dont do anything
            if(cardsFaceUp.length <= 1){
                // if correct div is selected add animation class
                //      JS console error when the first flipped card is clicked again (mouse double click   )
                while(found == false){
                    if(targetCard.className === 'flip-card-inner'){
                        targetCard.classList.add('card-selected');
                        cardsFaceUp.push({
                            cardClicked: targetCard,
                            cardImage: targetCard.firstElementChild.firstElementChild.src
                        });
                        found = true;
                    } else{
                        targetCard = targetCard.parentNode;
                    }
                }
                matchCards();
            }
        })
    })
}

// use an array with the max length of 2 to check the 2 cards face up if they are a match
function matchCards(){
    if(cardsFaceUp.length == 2){
        if(cardsFaceUp[0].cardImage == cardsFaceUp[1].cardImage){
            // you've made a match
            // remove selected-card class and make cards disapper from board
            setTimeout(() => {
                for(let i = 1; i >= 0; i--){
                    let card = cardsFaceUp[i].cardClicked;
                    card.classList.add('discarded');
                    card.classList.remove('card-selected');
                    cardsFaceUp.pop();
                }
                if(discarded.length == 20) {
                    stopWatch('stop');
                }
            }, 1000);
            discarded = document.getElementsByClassName('discarded')
        } else{
            // clear cardsFaceUp array and remove .selected-card class from cards to turn them back over
            setTimeout(() => {
                for(let i = 1; i >= 0; i--){
                    cardsFaceUp[i].cardClicked.classList.remove('card-selected');
                    cardsFaceUp.pop();
                }
            }, 1500);
        }
    }
}

function stopWatch(startStop) {
    let stop;
    // start the timer
    if (startStop === 'start') {
        start = Date.now();
    // stop the timer
    }else if (startStop === 'stop') {
        stop = Date.now();
        // play time in seconds
        gameTime.timePlayed = (stop - start) / 1000;
        timeInPlay();
    }
}
async function timeInPlay(){
    const timeResponse = await fetch('/match', {
        headers: {
            'Content-Type': 'application/json'
        }, 
        method: 'POST',
        body: JSON.stringify(gameTime)
    })
// possibly trying to parse the response object itself <Response OK 200>

        // if the code in app.py/match is changed from 
        // data = json.loads(request.data)
        //     time = data.get("timePlayed", None)
        //     if time is None:
        //         return jsonify({"message":"time not found"})
        //     else:
        // to: time = request.get_json()
        // there is a bunch of errors that is flask not accepting what is being sent as real JSON
    // take the JSON in the response and store it
    const messageJSON = await timeResponse.json();
    if (messageJSON.outcome == "win"){
        console.log(`${messageJSON.message}, with a time of ${messageJSON.score}`)
    }else if (messageJSON.outcome == "lose") {
        console.log(`${messageJSON.message} The time to beat is ${messageJSON.score[1]}, your time was ${messageJSON.score[0]}`)
    }
    console.log(messageJSON.message);
}
shuffle.addEventListener('click', fillDeck);