// card flipping game
// var to hold cards sent from Flask
let cards = {};
// Array to store 10 random cards/info as objects

const shuffle = document.getElementById('test-button');
// html collection of li elements as game board spaces
const gameSpaces = document.getElementsByClassName('col');

// fetch api call to flask for hearthstone cards and info
fetch('/api_call')
    .then(function (response){
        // parse response as JSON
        return response.json()
    }).then(function (json){
        const obj = JSON.parse(json);
        // make shuffle button appear only after api call is complete
        return cards = obj;
    })
// populate array with random 10 cards and create doubles
// shuffle deck so doubles are not side x side
// call function to insert card imgs to html doc
function fillDeck(){
    const cardsInPlay = [];
    for(let i = 0; i < 10; i++){
        let random = Math.floor(Math.random() * 500);
        // add doubles of each card
        for(let i = 0; i < 2; i++){
            cardsInPlay.push(cards.cards[random]);
        }
    }
    // Use Durstenfeld shuffle to randomize card array
    for(let i = cardsInPlay.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [cardsInPlay[i], cardsInPlay[j]] = [cardsInPlay[j], cardsInPlay[i]];
    }
    fillBoard(cardsInPlay);
}
// insert card imgs into html game board
function fillBoard(deck){
    console.log(deck);
    for(let i = 0; i < gameSpaces.length; i++){
        let cardIMG = `<img src=${deck[i].image} alt='Hearthstone card face #${i}'>`;
        gameSpaces[i].innerHTML = cardIMG;
    }
}

shuffle.addEventListener('click', fillDeck);