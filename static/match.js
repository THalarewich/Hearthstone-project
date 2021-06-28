// card flipping game
// var to hold cards sent from Flask
let fullDeck = {};
let cardsFaceDown;
let cardsFaceUp = [];
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
    return [face, back];
};

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
    console.log(cardBack.image);
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
    cardsFaceDown = document.getElementsByClassName('flip-card');
    flipCards();
}

// make a html collection for every .flip-card 
// after they are generated in the for loop in filBoard()
// use that html collection to add click event listeners

// Make shuffle button show up on UI only after fullDeck is populated
// error handling?? .catch?
fetchCards().then(([face, back]) => {
    shuffle.style.display = 'block';
    return fullDeck = {
        face: JSON.parse(face), 
        back: JSON.parse(back)
    };
});

// click event listener to each card 
// error handling for any element ancestor of flip-card-inner??
// error handling for flipping over more then 2 cards at once
function flipCards() {
    Array.from(cardsFaceDown).forEach(item => {
        item.addEventListener('click', e => {
            let targetCard = e.target;
            let found = false;
            // if correct div is selected add animation class
            while(found == false){
                if(targetCard.className === 'flip-card-inner'){
                    targetCard.classList.add('selected-card');
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
                for(let i = cardsFaceUp.length - 1; i >= 0; i--){
                    let card = cardsFaceUp[i].cardClicked;
                    card.classList.add('discarded');
                    card.classList.remove('selected-card');
                    cardsFaceUp.pop();
                }
            }, 2000);
        } else{
            // clear cardsFaceUp array and remove .selected-card class from cards to turn them back over
            setTimeout(() => {
                for(let i = cardsFaceUp.length - 1; i >= 0; i--){
                    cardsFaceUp[i].cardClicked.classList.remove('selected-card');
                    cardsFaceUp.pop();
                }
            }, 2000);
        }
    }
}

shuffle.addEventListener('click', fillDeck);