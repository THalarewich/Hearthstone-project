// card flipping game
// fetch Flask route "/api_call" 
let cards = {};
// fetch('/api_call')
//     .then(function (response){
//         return response.text();
//     }).then(function (text){
//         console.log("GET response text: ");
//         console.log(text);
//     })

fetch('/api_call')
    .then(function (response){
        return response.json()
    }).then(function (json){
        console.log("GET reponse as JSON:");
        // prints card data as JSON to console
        console.log(json);
    }).then(function (data){
        // prints card data as JS object to console
        console.log(data);
    })