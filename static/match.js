// card flipping game
// var to hold cards sent from Flask
let fullDeck = {};
let cardsFaceDown;
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
function flipCards() {
    Array.from(cardsFaceDown).forEach(item => {
        item.addEventListener('click', e => {
            let targetCard = e.target;
            let found = false;
            console.log(e.target);
            // if correct div is selected add animation class
            while(found == false){
                if(targetCard.className === 'flip-card-inner'){
                    targetCard.classList.add('selected-card');
                    found = true;
                } else{
                    targetCard = targetCard.parentNode;
                }
            }
        })
    })
}

shuffle.addEventListener('click', fillDeck);