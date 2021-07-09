// deck builder

// Deck Rules
// no more then 20 cards total
// no more then 2 of the same card (some cards have a max of 1)
// you can't use class specific cards from another class


// dynamic filter menu
// currentDeck will hold values for:
//      deck class
//      cards selected by user (and amount per card)
//      
const currentDeck = {};

const deckClasses = document.getElementsByClassName('deck-class');
const filterSelections = Array.from(document.getElementsByClassName('filter-btn'));
const dropDownArray = Array.from(document.getElementsByClassName('drop-down'));

// iterate through deck class options to store users class choice for deck
//      error handling (allow only one class to be choosen, hide class choices after class is chose)
//      (allow a different class to be picked but alert user that any class specific cards will be lost)
Array.from(deckClasses).forEach(klass => {
    klass.addEventListener('click', e => {
        currentDeck.class = e.target.innerHTML;
    })
})
// when a filter section is clicked, a dropdown menu for that section should appear
// if you click else where on the screen OR select a filter option from the drop down menu it should disapear
filterSelections.forEach(filter => {
    filter.addEventListener('click', e => {
        const targetMenu = e.target.nextElementSibling;
        if(targetMenu.className === 'drop-down'){
            // if no other drop menus in the dropDownArray have the class selected-filter then apply to e.target dropmenu
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
            if(selectedMenu.menu !== targetMenu) {
                targetMenu.classList.add('selected-filter');
            }
        }
    })
})