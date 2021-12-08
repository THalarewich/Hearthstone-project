// deck builder

// Deck Rules
// no more then 20 cards total
// no more then 2 of the same card (some cards have a max of 1)
// you can't use class specific cards from another class

// NOTES: 
//      CSS class selectors
//          'X' on deck cards class = 'delete'
//          amount of each card class = 'card-amount'
//      CSS TODO:
//          popup window to notify user for when user clicks to drop deck class
//          all console.log messages to be relayed to user on UI
//              popups???

// todo in this file
// implement 
//      user clicks else where on page while a drop down menu is open
//      In app.py check on a way to fix the hacky json conversion & a way to check if a deck was already saved in the DB

// BUG!
// when i made 1 deck then deleted all cards from it the card counter was stuck at 3 even after changing classes

//      html class "selected-card" is in use by the match game, causing cards in deck in builder to appear mirrored


// dynamic filter menu
// currentDeck will hold values for:
//      cards selected by user (and amount per card)
//      amount of total cards (including doubles)
let currentDeck = [{card_count: 0, deck_name: '', deck_class: '', class_id: null}];

// hold values from the filter menus to pass to flask in order for api calls
//      show current search params on screen for user to disable specific search params
let currentSearch = {
    class: null,
    attack: null,
    health: null,
    cardType: null,
    manaCost: null,
    minionType: null
};
// hold values for drop down menus
const selectedMenu = {
    menu: null,
    showing: false
}
// filter selection divs
const filterButtons = document.getElementById('filter-buttons');
const classSelection = document.getElementById('pick-a-class');
// user selected current card filters
const currentFilters = document.getElementById('current-filters');
// save button
const saveDeck = document.getElementById('save-deck');
// reset button
const resetDeck = document.getElementById('reset');

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
let lastClickedCard;

// when a 'X' on the card in the deck is clicked, remove one copy from deck
function deckCards() {
    let deckDisplayed = Array.from(document.getElementsByClassName('delete'));
    deckDisplayed.forEach(card => {
        card.addEventListener('click', e => {
            // parentNode.previousSiblingNode.firstElementChild
            let cardIndex = currentDeck.findIndex(card => 
                card.id == e.target.parentNode.parentNode.firstElementChild.classList[0]);
            // if there is a double remove one
            if(currentDeck[cardIndex].amount == 2) {
                currentDeck[cardIndex].amount = 1;
                currentDeck[0].card_count --;
            // remove completely if there is one 
            }else if (currentDeck[cardIndex].amount == 1) {
                currentDeck.splice(cardIndex, 1);
                currentDeck[0].card_count --;
            }
            displayCards(currentDeck, 1, 'selected-card', currentDeckDiv)
        })
    })
}

// for each card displayed from api search
//      will add clicked cards to currentDeck array for users deck
//      no more then 2 of the same card in the deck and no more then 20 total cards
//      cannot selected class cards unless specific class is selected
function selectCards() {
    returnedCards.forEach(card => {
        card.addEventListener('click', e => {
            // makes sure the click target is a returned card from fetch api call
            if(e.target.parentNode.classList.contains('returned-card')) {
                // matches clicked card with the card obj that is sent from flask
                let selectedCard = searchResults.cards.find(card => card.id == e.target.classList[0]);
                // check to see if user selectedCard is already in the currentDeck
                let filteredDeck = currentDeck.filter(card => card.id == selectedCard.id);
                // add cards if all rules are met
                if(currentSearch.class == null && selectedCard.classId == 12){
                    checkDeck(selectedCard, filteredDeck);
                }else if (currentSearch.class != null) {
                    checkDeck(selectedCard, filteredDeck);
                }else {
                    console.log("You cannot add class specific cards without selecting a deck class");
                }
            }
        })
    })
}

function checkDeck(selectedCard, filteredDeck){
    // no more then 20 cards total
    if(currentDeck[0].card_count < 20){
        // checks how many copies of selectedCard are in currentDeck
        if(filteredDeck.length > 0 && filteredDeck[0].amount == 2){
            console.log("You can't hold more then 2 of those cards");
        // if there is only one then add one more
        }else if(filteredDeck.length > 0 && filteredDeck[0].amount == 1){
            let index = currentDeck.indexOf(filteredDeck[0]);
            currentDeck[`${index}`].amount = 2;
            currentDeck[0].card_count += 1;
            displayCards(currentDeck, 1, 'selected-card', currentDeckDiv);
        // if there is none then add one 
        }else{
            selectedCard.amount = 1;
            currentDeck.push(selectedCard);
            currentDeck[0].card_count += 1;
            displayCards(currentDeck, 1, 'selected-card', currentDeckDiv);
        }
    }else {
        console.log('error, you can not hold anymore cards in your deck');
    }
}


// display the api search results/user selected cards for deck to be built
// @param 1     pass in searchResults.cards / currentDeck
// @param 2     index in which to start the for loop on ( 0 for results / 1 for deck)
// @param 3     "returned-card" for results / "selected-card" for deck
// @param 4     resultsDiv / currentDeckDiv
function displayCards(cardPool, index, divClass, htmlDiv){
    let cardsDisplayed = `
        ${(cardPool == currentDeck) ? `<span>Cards in deck: ${currentDeck[0].card_count}</span>` : ""}`;
    for(let i = index; i < cardPool.length; i++){
        cardsDisplayed += `
            <div class="${divClass}">
                <img class="${cardPool[i].id}" src="${cardPool[i].image}" alt="${cardPool[i].name}">
                ${cardPool[i].amount ? `<div>
                        <span class="card-amount">${cardPool[i].amount}</span>
                        <span class="delete">X</span>
                        </div>` : ""}
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
    // ***do i really need to use both .json() and JSON.parse()???
    // ^ if they are close to the same thing then why do i need both of them in this function

    // if access token expires
    if (searchResponse.status != 200) {
        console.log(`error code ${searchResponse.status}, make sure to re-link to your battle.net account`);
    }else {
        const searchJSON = await searchResponse.json();
        searchResults = JSON.parse(searchJSON);
        displayCards(searchResults.cards, 0, 'returned-card', resultsDiv);
    }
}

// event for user selected search params
// *add if statement to deal with user clicking filters other then class
function selectedFilters(){
    const selectedFilterBtns = Array.from(document.getElementsByClassName('selected-filter-button'));
    selectedFilterBtns.forEach(filter => {
        filter.addEventListener('click', e => {
            // *add a popup window telling user that removing class will remove all class specific cards from deck
            if(e.target.parentNode.classList[0] == 'selected-class'){
                // popup
                let popUp = prompt(`Are you sure you wish to remove the class ${e.target.innerHTML}? 
                    Doing so will remove all class specific cards from your deck. Yes or No`);
                // condition will be met when user agrees (need to implement)
                if(popUp.toUpperCase() = 'YES'){
                    removeClassCards();
                }
            }else {
                currentSearch[`${e.target.classList[1]}`] = null;
                apiSearch();
            }
            e.target.remove();
        })
    })
}

function removeClassCards() {
    // remove all class specific card from currentDeck obj
    // class id key and multi-class id key need to be checked
    // DH id 14
    // Druid id 2
    // Hunter id 3
    // Mage id 4
    // Pally id 5
    // Priest id 6
    // Rogue id 7
    // Shaman id 8
    // Warlock id 9
    // Warrior id 10
    for(let i = 1; i < currentDeck.length; i++){
        if (currentDeck[i].classId == currentDeck[0].class_id || 
            currentDeck[i].multiClassIds.includes(currentDeck[0].class_id)) {
                currentDeck.splice(i, 1);
                currentDeck[0].card_count -= 1;
                i--;
        }
    }
    // reset variables
    currentSearch.class = null;
    currentDeck[0].class_id = null;
    // change CSS classes
    classSelection.classList.remove('hidden');            
    filterButtons.classList.add('hidden');
    displayCards(currentDeck, 1, 'selected-card', currentDeckDiv);
    apiSearch();
}

//              Event Listeners for filter selections

// for class options to store users class choice for deck
//      error handling (allow only one class to be choosen, hide class choices after class is chose)
//      (allow a different class to be picked but alert user that any class specific cards will be lost)
Array.from(deckClasses).forEach(klass => {
    klass.addEventListener('click', e => {
        // * need to implement *
        if(currentSearch.class !== null) {
            // **** dont think i need this if statement as the message/popup is handled in a different func
            // alert user they will lose all class related cards, ask if they want to continue to change class
            console.log('changing classes will remove all current class specific cards from your deck');
        }else {
            // save search param
            currentSearch.class = e.target.innerHTML;
            // save class id
            currentDeck[0].class_id = e.target.classList[1];
            // change CSS classes
            classSelection.classList.add('hidden');            
            filterButtons.classList.remove('hidden');
            // add on screen filter btn
            currentFilters.firstElementChild.innerHTML = `
                <button class="selected-filter-button">${e.target.innerHTML}</button>`;
            // add event listener to btn
            selectedFilters();
            // search api with new param
            apiSearch();
        }
        
    })
})

// when a filter section is clicked, a dropdown menu for that section should appear
filterCatagories.forEach(filter => {
    filter.addEventListener('click', e => {
        // drop down divs
        const targetMenu = e.target.nextElementSibling;
        // verify that the event target sibling is a drop down menu
        if(targetMenu.classList.contains('drop-down')) {
            // if there is a drop down showing
            if(selectedMenu.showing) {
                selectedMenu.menu.classList.remove('selected-filter');
                selectedMenu.showing = false;
                selectedMenu.menu = null;
            }
            // show event target menu if not already showing
            if(selectedMenu.menu !== targetMenu) {
                targetMenu.classList.add('selected-filter');
                selectedMenu.menu = targetMenu;
                selectedMenu.showing = true;
            }
        }
    })
})

// if drop down menu is open and user clicks somewhere else in the browser
document.body.addEventListener('click', e => {
    if(filterCatagories.includes(e.target) == false){
        if(selectedMenu.showing) {
            selectedMenu.menu.classList.remove('selected-filter');
            selectedMenu.menu = null;
            selectedMenu.showing = false;
        }
    }
})

// add specific search params to currentSearch when clicked by user
filterOptions.forEach(option => {
    option.addEventListener('click', e => {
        const filterCatagory = e.target.parentNode.parentNode.parentNode;
        let filter = filterCatagory.classList[0];
        currentFilters.innerHTML += `
            <button class="selected-filter-button ${filter}">${e.target.innerHTML}</button>`;
        const selectedFilterBtns = Array.from(document.getElementsByClassName('selected-filter-button'));
        if(currentSearch[`${filter}`] != null) {
            let index = selectedFilterBtns.findIndex(btn => btn.classList[1] == filter);
            selectedFilterBtns[index].remove();
        }
        currentSearch[`${filter}`] = e.target.innerHTML;
        apiSearch(e.target);
        selectedFilters();
    })
})

// check to see if the deck is full, save to DB
saveDeck.addEventListener('click', async () => {
    deckName = document.getElementById('deck-name').value;
    if (deckName === '') {
        console.log('you must name your deck, please fill out the deck name box');
        return;
    }else {
        currentDeck[0].deck_name = deckName;
    }

    if (currentDeck[0].card_count < 20) {
        console.log(`Your deck is not yet full, you need ${20 - currentDeck[0].card_count} more cards, consider adding more cards`);
    }else if (currentDeck[0].card_count == 20){
        currentDeck[0].deck_class = currentSearch.class;
        // convert currentDeck data to JSON
        // send data to flask
        // save data in DB
        // send notice back to JS to notify user deck is saved
        const deckResponse = await fetch('/builder', {
            headers: {
                'Content-Type': 'application/json'
            }, 
            method: 'POST',
            body: JSON.stringify(currentDeck)
        })
         // take the JSON in the response and store it
        const saveInfo = await deckResponse.json();
        let message = `${saveInfo.message}'${saveInfo.deck_name}'`;
        // deck was saved
        if(saveInfo.deck_saved) {
            // popup
            console.log(message);
        // card makeup was found else where
        }else if(saveInfo.deck_found) {
            // popup
            console.log(message);
        // deck name already in use
        }else if(!saveInfo.deck_saved && !saveInfo.deck_found) {
            // popup
            console.log(message);
        }else {
            console.log("server error???");
        }
    }
})

// reset all filters and remove all cards from deck
resetDeck.addEventListener('click', () => {
    // offer buttons in the popup asking if they wish to reset the filters the deck or both
    // popup
    let userPrompt = prompt('Are you sure you wish to reset all filters and your deck? Filters, Deck or Both');
    if(userPrompt.toUpperCase() === 'FILTERS' || userPrompt.toUpperCase() === 'BOTH') {
        // remove filter btns from screen
        Array.from(document.getElementsByClassName('selected-filter-button')).forEach(btn => {
            btn.remove();
        });
        currentSearch = {
            class: null,
            attack: null,
            health: null,
            cardType: null,
            manaCost: null,
            minionType: null
        };
        // change CSS variables
        classSelection.classList.remove('hidden');            
        filterButtons.classList.add('hidden');
        removeClassCards();
    }
    if(userPrompt.toUpperCase() === 'DECK' || userPrompt.toUpperCase() === 'BOTH') {
        currentDeck = [{
            card_count: 0, 
            deck_name: '', 
            deck_class: ''
        }];
        // display new empty deck
        displayCards(currentDeck, 1, 'selected-card', currentDeckDiv);
    }
});