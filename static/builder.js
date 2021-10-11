// deck builder

// Deck Rules
// no more then 20 cards total
// no more then 2 of the same card (some cards have a max of 1)
// you can't use class specific cards from another class


// todo in this file
// implement 
//      if a user wants to change deck classes
//      user clicks else where on page while a drop down menu is open
//      able to save deck to your account
//      remove filters if the "any" selection is selected from different drop downs



// dynamic filter menu
// currentDeck will hold values for:
//      cards selected by user (and amount per card)
//      amount of total cards (including doubles)
const currentDeck = [{card_count: 0}];

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

// filter selection divs
const filterButtons = document.getElementById('filter-buttons');
const classSelection = document.getElementById('pick-a-class');

// search result div
const resultsDiv = document.getElementById('search-results');

// current deck div
const currentDeckDiv = document.getElementById('current-deck');

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


// TODO: Make an X to be clicked instead of the whole card?
//      Display amount of each card in the deck
// when a card in the deck is clicked
function deckCards() {
    let deckDisplayed = Array.from(document.getElementsByClassName('selected-card'));
    deckDisplayed.forEach(card => {
        card.addEventListener('click', e => {
            let cardIndex = currentDeck.findIndex(card => card.id == e.target.classList[0]);
            // if there is a double remove one
            if(currentDeck[cardIndex].amount == 2) {
                currentDeck[cardIndex].amount = 1;
                currentDeck[0].card_count --;
            // remove completly if there is one
            }else if(currentDeck[cardIndex].amount == 1) {
                currentDeck.splice(cardIndex, 1);
                currentDeck[0].card_count --;
                let parentDiv = e.target.parentNode;
                if(parentDiv.classList.contains('selected-card')) {
                    parentDiv.remove();
                }
            }
        })
    })
}

// for each card displayed from api search
//      will add clicked cards to currentDeck array for users deck
//      no more then 2 of the same card in the deck and no more then 20 total cards
function selectCards() {
    returnedCards.forEach(card => {
        card.addEventListener('click', e => {
            console.log(e.target);
            // makes sure the click target is a returned card from fetch api call
            if(e.target.parentNode.classList.contains('returned-card')) {
                // matches clicked card with the card obj that is sent from flask
                let selectedCard = searchResults.cards.find(card => card.id == e.target.classList[0]);
                // no more then 20 cards total
                if(currentDeck[0].card_count < 20){
                    // checks how many copies of selected card (if any) are already in the deck
                    if(currentDeck.includes(selectedCard)){
                        for(let i = 0; i < currentDeck.length; i++){
                            if(currentDeck[i].id == selectedCard.id){
                                if(currentDeck[i].amount > 1){
                                    console.log('error cannot hold more then 2 of those cards');
                                    break;
                                }else if(currentDeck[i].amount == 1){
                                    currentDeck[i].amount = 2;
                                    currentDeck[0].card_count += 1;
                                    displayCards(currentDeck, 1, 'selected-card', currentDeckDiv);
                                    break;
                                }
                            }
                        }
                    // add selected card to deck
                    }else {
                        selectedCard.amount = 1;
                        currentDeck.push(selectedCard);
                        currentDeck[0].card_count += 1;
                        displayCards(currentDeck, 1, 'selected-card', currentDeckDiv);
                    }
                }else{
                    console.log('error, you can not hold anymore cards in your deck')
                }
            }
        })
    })
}


// display the api search results/user selected cards for deck to be built
// @param 1     pass in searchResults.cards / currentDeck
// @param 2     index in which to start the for loop on ( 0 for results / 1 for deck)
// @param 3     "returned-card" for results / "selected-card" for deck
// @param 4     resultsDiv / currentDeckDiv
function displayCards(cardPool, index, divClass, htmlDiv){
    let cardsDisplayed = '';
    for(let i = index; i < cardPool.length; i++){
        cardsDisplayed += `
            <div class="${divClass}">
                <img class="${cardPool[i].id}" src="${cardPool[i].image}" alt="${cardPool[i].name}">
            </div>`;
    }
    htmlDiv.firstElementChild.innerHTML = cardsDisplayed;
    // populate returnedCards array / call event listener function if search results are changed
    if(cardPool === searchResults.cards){
        returnedCards = Array.from(document.getElementsByClassName('returned-card'));
        selectCards();
    }else{
        deckCards();
    }
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
    displayCards(searchResults.cards, 0, 'returned-card', resultsDiv);
}


//              Event Listeners for filter selections

// for class options to store users class choice for deck
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
filterOptions.forEach(option => {
    option.addEventListener('click', e => {
        const filterCatagory = e.target.parentNode.parentNode.parentNode;
        let filter = filterCatagory.classList[0];
        currentSearch[`${filter}`] = e.target.innerHTML;
        apiSearch(e.target);
    })
})