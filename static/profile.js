// search saved decks
// display PB match time
// allow user to delete saved decks
// carousel for displaying decks? (too ambitious?)


//          USER SEARCH FUNCTION
// collect user input on click event
// check user input is valid
// convert user input to JSON and send to flask
// query the input to SQL 
// return queried results back to JS to display

//          DISPLAY DECKS
// figure out a good way to display the returned decks for the user to view
// a clear and readable way to scroll through returned decks w/o taking up whole page

//          USER DELETE DECKS
// allow user to click an 'X' on a deck
// prompt user asking if they are sure they want to delete deck (will be gone forever)
// send request to flask to delete deck in SQL db


//          BUGS
// after deleting a deck, the page doesnt refresh and remove said deck from screen
// radio button option "AnyClass" doesnt return any class

let searchParams = {};
let returnedDecks = [];

// what to do for different screen sizes???
const displayClasses = [
    "one-three", 
    "two-four", 
    "three-five", 
    "four-six",
    "highlight-card", 
    "nine-eleven", 
    "ten-twelve", 
    "eleven-thirteen", 
    "twelve-fourteen", 
    "hide-card"
]

// popup error message for BN login link
const err = document.querySelector('.error');
if (err.innerHTML == '') {
    err.style.display = 'none';
}

const searchBTN = document.getElementById('search-decks');
// html ele for inserting returned decks
const deckViewing = document.getElementById('returned-decks');

// verify user input before making fetch request
function inputCheck(){
    searchParams = {
        deckClass: null,
        deckName: null
    };
    // radio btns
    const deckClasses = document.getElementsByName('deck-class');
    // input search field
    const deckName = document.getElementById('search').value;
    // find which radio btn was selected
    for(let i = 0; i < deckClasses.length; i++) {
        if(deckClasses[i].checked) {
            searchParams.deckClass = String(deckClasses[i].value);
        }
    }
    if(deckName != '') {
        searchParams.deckName = String(deckName);
    }
    // return bool depending on user input
    if(searchParams.deckClass === null && searchParams.deckName === null){
        return false;
    }else {
        return true;
    }
}

// make fetch request to flask to search db for decks with searchParams
async function searchDecks() {
    const searchResponse = await fetch('/profile', {
        headers: {
            'Content-Type': 'application/json'
        }, 
        method: 'POST',
        body: JSON.stringify(searchParams)
    })
    // take the JSON in the response and store it
    
    // ***do i really need to use both .json() and JSON.parse()???
    //  .json() and JSON.parse() do close to the same thing?
    const searchJSON = await searchResponse.json();
    return searchJSON;
}

// take returned data from flask and display on page for user to view
function displayDecks() {
    let printDecks = document.getElementById('deck-count');
    if(returnedDecks.deckCount > 0) {
        let displayDeck = '';
        for(const deckID in returnedDecks) {
            let cardNames = [];
            let cardImages = ''
            // do not use property 'deckCount' for the following iterations
            if(returnedDecks[deckID] !== returnedDecks.deckCount) {
                // collect card names/images from individual decks
                for(let i = 1; i < returnedDecks[`${deckID}`].length; i++){
                    // change name to image
                    cardNames.push(returnedDecks[`${deckID}`][i].image);
                    // add classes for carousel func
                    cardImages += `
                        <img 
                            class="deck-card ${
                                (i > displayClasses.length ? displayClasses[displayClasses.length -1] : displayClasses[i - 1])
                            }" 
                            src="${returnedDecks[`${deckID}`][i].image}" 
                            alt="${returnedDecks[`${deckID}`][i].name}"
                        >`
                }
                displayDeck += `
                    <div>
                        <span class="delete" id="${deckID}">X</span>
                        <h3>${returnedDecks[`${deckID}`][0].deck_name}</h3>
                        <h4>${returnedDecks[`${deckID}`][0].deck_class}</h4>
                        <div class="deck-cards">
                            <span class="arrow left"></span>
                            ${cardImages}
                            <span class="arrow right"></span>
                        </div>
                    </div>`;
            }else {
                // message on how many decks where returned and under what search criteria
                let deckClass = '';
                let deckName = '';
                (searchParams.deckClass != null ? deckClass = ` for the class '${searchParams.deckClass}''` : null);
                (searchParams.deckName != null ? deckName = ` with the name '${searchParams.deckName}'` : null);
                let deckCount = `
                    <h3>
                        Deck search${deckClass}${deckName} returned ${returnedDecks.deckCount} 
                        deck${(returnedDecks.deckCount > 1 ? 's' : '')}
                    </h3>`
                printDecks.innerHTML = deckCount;
            }
            deckViewing.innerHTML = displayDeck;
        }
        deckDelete();
        cardScroll();
    }else {
        // clear previously returned decks from page
        deckViewing.innerHTML = '';
        printDecks.innerHTML = `<h3>You do not have any decks saved that meet your search criteria of
            ${(searchParams.deckClass != null ? ` Class: '${searchParams.deckClass}'` : '')}
            ${(searchParams.deckName != null ? ` Deck Name: '${searchParams.deckName}'`: '')} </h3>`;
    }
}

function deckDelete() {
    const X = Array.from(document.getElementsByClassName('delete'));
    X.forEach(deck => {
        deck.addEventListener('click', async e => {
            // find the deck the user selected
            // save ID and name in a var
            // send ID and name to flask
            // replace prompt with CSS popup window and logic for button clicks
            // popup
            let discard = prompt('Are you sure you would like to delete this from your saved decks? Once deleted you cannot get it back. Yes or No?');
            let deckDeleted = {};
            if (discard.toUpperCase() === 'YES') {
                // delete deck that the X was clicked on
                deckDeleted.id = e.target.id;
                deckDeleted.name = e.target.nextElementSibling.innerHTML;
                // send request to delete deck from db
                const deleteResponse = await fetch('/delete', {
                    headers: {
                        'Content-Type': 'application/json'
                    }, 
                    method: 'POST',
                    body: JSON.stringify(deckDeleted)
                })
                // take the JSON in the response and store it
                // ***probably want to do something different rather then use a message for displaying
                const deleteJSON = await deleteResponse.status;
                if(deleteJSON == 200) {
                    // popup
                    console.log('deck deleted');
                    userSearch();
                }else {
                    console.log(`server error, deck either doesn't exist or was unable to be deleted`);
                }
            }else {
                console.log('you do not wish to delete this deck');
            }
        })
    })
}

async function userSearch() {
    let userInput;
    userInput = inputCheck();
    if(userInput) {
        returnedDecks = await searchDecks();
        displayDecks();
    }else {
        console.log('You must provide either a class and/or a deck name to use the seach function');
    }
}
// deck carousel
function cardScroll() {
    const arrows = document.querySelectorAll(".arrow");
    arrows.forEach( arrow => {
        arrow.addEventListener("click", e => {
            let parentDeck = e.target.parentNode;
            // deck event was triggered on
            let deckCards = parentDeck.querySelectorAll(".deck-card");
            // right arrow clicked
            if(e.target.classList.contains("right")) {
                moveCards(deckCards, "right");
            // left arrow clicked
            } else if(e.target.classList.contains("left")) {
                moveCards(deckCards, "left");
            }
            // remove previous card class to change card position step 2
            for (let i = deckCards.length - 1; i >= 0; i--) {
                if (deckCards[i].classList.length == 3) {
                    deckCards[i].classList.remove(`${deckCards[i].classList[1]}`);
                }
            }
        })
    })
}

// change card position step 1
function moveCards(deck, direction) {
    for (let i = 0; i < deck.length; i++) {
        const right = (i == 0 ? deck.length - 1 : i - 1);
        const left = (i == deck.length - 1 ? 0 : i + 1);
        deck[i].classList.add(`${deck[(direction === "right" ? right : left)].classList[1]}`)
    }
}

searchBTN.addEventListener('click', userSearch);