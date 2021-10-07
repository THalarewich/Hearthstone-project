// deck builder

// Deck Rules
// no more then 20 cards total
// no more then 2 of the same card (some cards have a max of 1)
// you can't use class specific cards from another class


// todo in this file
// implement 
//      what happens when cards are selected for the deck / removed
//          follow hearthstone deck building rules
//      if a user wants to change deck classes
//      user clicks else where on page while a drop down menu is open
//      able to save deck to your account
//      remove filters if the "any" selection is selected from different drop downs



// dynamic filter menu
// currentDeck will hold values for:
//      cards selected by user (and amount per card)
const currentDeck = [];
// hold values from the filter menus to pass to flask in order for api calls
//      show current search params on screen for user to disable specific search params
//      ^^(when specific params are disabled call api search func to refresh cards on page)^^
const currentSearch = {
    class: null,
    attack: null,
    health: null,
    cardType: null,
    manaCost: null,
    minionType: null
};
// // card api data sent back from flask
// const searchResults = {};

// filter selection divs
const filterButtons = document.getElementById('filter-buttons');
const classSelection = document.getElementById('pick-a-class');

// search result div
const resultsDiv = document.getElementById('search-results');

// possible selection of deck class
const deckClasses = document.getElementsByClassName('deck-class');
// selection of buttons to expand drop down menus
const filterCatagories = Array.from(document.getElementsByClassName('filter-btn'));
// all drop down menus
const dropDownArray = Array.from(document.getElementsByClassName('drop-down'));
// all drop down menu options
const filterOptions = Array.from(document.getElementsByClassName('filter-selection'));
// array of cards that are within the search results
let searchResults;
let returnedCards;


// add event listener to each card after they are displayed
function selectCards() {
    returnedCards.forEach(card => {
        card.addEventListener('click', e => {
            if(e.target.parentNode.classList.contains('returned-card')) {
                currentDeck.push({
                    // take a look at using searchResults obj and using array filter method to find card by ID 
                    //      so the whole card obj can be stored in current deck, to later be stored in the DB
                    cardID: e.target.classList[0],
                    cardImg: e.target.src,
                    name: e.target.alt
                });
                console.log(e.target.classList[0]);
            }
        })
    })
}

// use obj in searchResults to display cards to the screen
function displayResults() {
    let cardsDisplayed = ``;
    for(i = 0; i < searchResults.cards.length; i++) {
        cardsDisplayed += `
            <div class="returned-card">
                <img class="${searchResults.cards[i].id}"src="${searchResults.cards[i].image}" alt="${searchResults.cards[i].name}">
            </div>`;
    }
    resultsDiv.firstElementChild.innerHTML = cardsDisplayed;
    returnedCards = Array.from(document.getElementsByClassName('returned-card'));
    selectCards();
}

async function apiSearch(filter = null) {
    //  after a filter option is selected make filter list hidden
    if(filter !== null) {
        filter.parentNode.parentNode.classList.remove('selected-filter');
    }
    // send currentSearch JS obj to flask in order to make an api call
    // after receiving the card search data convert to JS obj and print cards to the page
    const searchResponse = await fetch('/api_call/search', {
        headers: {
            'Content-Type': 'application/json'
        }, 
        method: 'POST',
        body: JSON.stringify(currentSearch)
    })
    // take the JSON in the response and store it
    const searchJSON = await searchResponse.json();
    searchResults = JSON.parse(searchJSON);
    displayResults();
}


//              Event Listeners

// Create event listeners to class options to store users class choice for deck
//      error handling (allow only one class to be choosen, hide class choices after class is chose)
//      (allow a different class to be picked but alert user that any class specific cards will be lost)
Array.from(deckClasses).forEach(klass => {
    klass.addEventListener('click', e => {
        // * need to implement *
        if(currentSearch.class !== null) {
            // alert user they will lose all class related cards, ask if they want to continue to change class
            console.log('changing classes will remove all current class specific cards from your deck');
        }else {
            currentSearch.class = e.target.innerHTML;
            classSelection.classList.add('hidden');            
            filterButtons.classList.remove('hidden');
        }
        
    })
})

// when a filter section is clicked, a dropdown menu for that section should appear
// if you click else where on the screen OR select a filter option from the drop down menu it should disapear
//          (seperate function?? ^^^^)
filterCatagories.forEach(filter => {
    filter.addEventListener('click', e => {
        const targetMenu = e.target.nextElementSibling;
        // verify that the event target sibling is a drop down menu
        if(targetMenu.classList.contains('drop-down')) {
            const selectedMenu = {
                menu: null,
                showing: false
            }
            // check to see if any drop down menus are showing on the screen
            dropDownArray.forEach(menu => {
                if(menu.classList.contains('selected-filter')) {
                    selectedMenu.menu = menu;
                    selectedMenu.showing = true;
                }
            })
            // if there is a drop down showing
            if(selectedMenu.showing === true) {
                selectedMenu.menu.classList.remove('selected-filter');
            }
            // show event target menu if not already showing
            if(selectedMenu.menu !== targetMenu) {
                targetMenu.classList.add('selected-filter');
            }
        }
    })
})

// add specific search params to currentSearch when clicked by user
//          is there a way to reduce code used in this event handler??? DRY! 
//          ^^(a seperate func to iterate over search params??)^^
//      add if statements for the "any" selection in each menu (to NOT apply any filter and just remove said filter
//      from api search)
filterOptions.forEach(option => {
    // * todo: create an array holding strings of html class names, loop through class names to minumize lines of code*
    option.addEventListener('click', e => {
        const filterCatagory = e.target.parentNode.parentNode.parentNode;
        if(filterCatagory.classList.contains('attack')) {
            currentSearch.attack = e.target.innerHTML;
            // call api search func
            apiSearch(e.target);
        }else if(filterCatagory.classList.contains('health')) {
            currentSearch.health = e.target.innerHTML;
            // call api search func
            apiSearch(e.target);
        }else if(filterCatagory.classList.contains('card-type')) {
            currentSearch.cardType = e.target.innerHTML;
            // call api search func
            apiSearch(e.target);
        }else if(filterCatagory.classList.contains('mana-cost')) {
            currentSearch.manaCost = e.target.innerHTML;
            // call api search func
            apiSearch(e.target);
        }else if(filterCatagory.classList.contains('minion-type')) {
            currentSearch.minionType = e.target.innerHTML;
            // call api search func
            apiSearch(e.target);
        }
    })
})