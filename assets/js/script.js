// Main page Elements
var cityInputEl = $("#cityInput");
var countryListEl = $("#countries");
var statesListEl = $("#states");
var searchButtonEl = $("#searchButton");
var weatherCurrentEl = $("#weatherCurrent");
var weather5DayEl = $("#weather5Day");
var weatherHistoryEl = $("#weatherHistory");

// API info
var apiCountries = "https://restcountries.com/v3.1/all";
var apiGeo = "https://api.openweathermap.org/geo/1.0/direct";
var apiOneCall = "https://api.openweathermap.org/data/2.5/onecall";
var apiKey = "3b1598e13550c0d6619df609201a1c27";

// Shortens future luxon calls
var DateTime = luxon.DateTime;

// Variable for Location to be searched for
var geoLocation = "";
var cityLocation = "";

// Function to load search History
var historyList = [];

// Running function to setup the page when first loaded.
pageStart();

// Display states list only when United States is selected from country list.
countryListEl.change(function() {
    if (countryListEl.val() == "US") {
        document.getElementById('states').style.display = '';
    } else {
        document.getElementById('states').style.display = 'none';
}});

// When search button is clicked.
searchButtonEl.on("click", function(event) {
    event.preventDefault();
    // If the city input is left blank, user will be notified to enter a city name.
    if(cityInputEl.val() === "") {
        displayModal("Please enter a city name.");
        return;
    // If user selects the United States but doesn't select a state, user will be notified to select a state
    } else if(countryListEl.val() === "US" && statesListEl.val() === null) {
        displayModal("Please select a state.");
        return;
    // If city searched for is in United States then city, state and country will be included in it's Location search and page display will show city and state
    } else if(countryListEl.val() === "US") {
        geoLocation = (cityInputEl.val() + "," + statesListEl.val() + "," + countryListEl.val());
        cityLocation = (cityInputEl.val() + ", " + statesListEl.val());
    // If city searched for is not in the United States, then city and country will be included in the location search and displayed on the page
    } else {
        geoLocation = (cityInputEl.val() + "," + countryListEl.val());
        cityLocation = (cityInputEl.val() + ", " + countryListEl.val());
    }
    // Run the function to search for the geo coordinates
    findCoords();
});

// When search history button is clicked.
weatherHistoryEl.on("click", function(event) {
    if (event.target.matches(".btn")) {
        // Pulls geo location from targetted button's dataset
        geoLocation = event.target.dataset.loc;
        // Pulls city text from button's displayed value
        cityLocation = event.target.value;
        // Find the info for the clicked button in the history array of objects
        var indexOfObject = historyList.findIndex(object => {
            return object.geo === geoLocation;
          });
        // Button clicked is removed from history list and then re-added to move it to top of the list
        historyList.splice(indexOfObject, 1);
        addItemToHistory();
        // Run the function to search for the geo coordinates
        findCoords();
    }
});

// First function run when page loads.
function pageStart() {
    // Fetches an API list of all 250 countries.
    fetch(apiCountries)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // Pulls all country names and country codes and creates an array of objects for each.
            var countryList = [];
            data.forEach(function (country) {
                var countryObject = {name: country.name.common, value: country.cca2}
                countryList.push(countryObject);
            })
            // Sorts array alphabetically by country name.
            countryList.sort((a, b) => (a.name > b.name) ? 1 : -1)
            // Goes through array and appends each country to dropdown list with a stored value of the country's initials
            countryList.forEach(function (country) {
                // When setting the United States on the list, it is also set as the default selected value.
                if(country.value === "US") {
                    countryListEl.append(`<option value="${country.value}" selected>${country.name}</option>`);
                } else
                countryListEl.append(`<option value="${country.value}">${country.name}</option>`);
            })
        });
    // Pulls from state list in other js file and appends each state into the dropdown list
    states.forEach(function (state) {
        statesListEl.append(`<option value="${state.abbreviation}">${state.name}</option>`);
    })
    // Runs function to display search history onto page.
    populateSearchHistory();
}

// Adds a searched city to the History List
function addItemToHistory () {
    // If searched item is not already located on list, then create Object using searched info
    if (!historyList.some(e => e.geo === geoLocation)) {
        var historyItem = {
            geo: geoLocation,
            city: cityLocation
            };
        // Attach city object to start of list
        historyList.unshift(historyItem);
        // History list is limited to 6 items, removing the last item on the list
        if (historyList.length > 6) {
            historyList.length = 6;
        }
        // Stores history list to local storage
        localStorage.setItem("historyList", JSON.stringify(historyList));
        // Runs function to display search history onto page.
        populateSearchHistory();
      }
}

// Displays search list onto page.
function populateSearchHistory() {
    // sets list variable to contents of local storage list
    var storedHistory = JSON.parse(localStorage.getItem("historyList"));
    if (storedHistory !== null) {
        historyList = storedHistory;
        // Clears anything currently being displayed
        weatherHistoryEl.html("");
        // Goes through history list and displays each history object onto the page as a button containing important data for future searches.
        historyList.forEach(function (historyItem) {
            weatherHistoryEl.append(`
            <div class="col-5 col-md-4 col-lg-10 my-1 px-2">
            <input class="btn btn-secondary col-12" type="button" data-loc="${historyItem.geo}" value="${historyItem.city}">
            </div>
            `);
        })
    }
};

// Search for a city's geo location
function findCoords() {
    // Connects to the geo api and runs a search for the city pulled from either the search form or history button
    fetch(`${apiGeo}?q=${geoLocation}&appid=${apiKey}`)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
        // If no city data is found, prompts user to check their search parameters.
        if(!data[0]) {
            displayModal("City not found, please check info entered.");
            return;
        // If city is found add the city to the search history and send that city's geo coordinates to the function for pulling weather info.
        } else {
            addItemToHistory();
            pullWeatherData(data[0].lat, data[0].lon);
        }
    }
)};

// Search for weather info for set coordinates
function pullWeatherData(lat, lon) {
    // Connects to the weather api and runs a search using the lat and lon found in the geo coordinate search.
    fetch(`${apiOneCall}?lat=${lat}&lon=${lon}&units=imperial&exclude=minutely,hourly&appid=${apiKey}`)
    .then(function (response) {
        return response.json();
    })
    // Sends retrieved info to the function for displaying that info
    .then(function (data) {
        printWeather(data.current, data.daily, data.timezone);
    })
}

// Print weather data to page.
function printWeather(current, daily, timezone) {
    // Converts dt variable from data into a readable Date
    var currentDate = DateTime.fromSeconds(current.dt, {zone: timezone}).toFormat("EEE, M/d/y");
    var currentWeatherDesc = current.weather[0].description;
    // Capitalizes the first letter in the current weather's description
    currentWeatherDesc = currentWeatherDesc.charAt(0).toUpperCase() + currentWeatherDesc.slice(1);
    // Runs function to determine background color for UV Index
    var uvColor = uvBackColor(current.uvi);
    // Clears any weather data already on page.
    weatherCurrentEl.html("");
    // Creates a border around weather data that wasn't there on page load.
    weatherCurrentEl.addClass("border border-2 border-dark rounded");
    // Prints current weather for searched location to page.
    weatherCurrentEl.append(`
        <h2 class="text-center mb-0 mb-md-4">${cityLocation} (${currentDate})</h2>
        <h3 class="text-center">Current time: ${DateTime.fromSeconds(current.dt, {zone: timezone}).toFormat("h:mma")}</h3>
        <div class="row justify-content-center">
            <div class="col-auto">
                <img src="http://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png">
                <p>${currentWeatherDesc}</p>
            </div>
            <div class="col-0 col-md-2">
            </div>
            <div class="col-auto text-center"
                <p>Temp: ${Math.round(current.temp)}°F</p>
                <p><span class="text-warning">Hi: ${Math.round(daily[0].temp.max)}°F</span>, <span class="text-info">Lo: ${Math.round(daily[0].temp.min)}°F</span></p>
                <p>Wind: ${windDirection(current.wind_deg)} at ${Math.round(current.wind_speed)}mph</p>
                <p>Humidity: ${current.humidity}%</p>
                <span class="p-1 rounded"style="background-color:${uvColor}; margin: auto">UV Index: ${current.uvi} </span>
            </div>
        </div>
        `);
    // Clears any 5 day forecast weather data from page.
    weather5DayEl.html("");
    // Prints 5 day weather forecast data to page.
    weather5DayEl.append(`
        <h3 class="text-center">5-Day Forcast:</h3>
        <div class="d-flex flex-wrap justify-content-evenly" id="fiveDayForcast">
    `);
    var testEl = $("#fiveDayForcast")
    for (var i = 1; i < 6; i++){
        testEl.append(`
            <div class="bg-secondary col-12 col-md-2 p-2 m-1 text-center">
                <p class="fw-bold mt-2" style="line-height:.25">${DateTime.fromSeconds(daily[i].dt, {zone: timezone}).toFormat("EEEE")}</p>
                <p class="fw-bold" style="line-height:.25">${DateTime.fromSeconds(daily[i].dt, {zone: timezone}).toFormat("(M/d/yy)")}</p>
                <img src="http://openweathermap.org/img/wn/${daily[i].weather[0].icon}.png">
                <p>${(daily[i].weather[0].description).charAt(0).toUpperCase() + (daily[i].weather[0].description).slice(1)}</p>
                <p><span class="text-warning">Hi: ${Math.round(daily[i].temp.max)}°F</span>, <span class="text-info">Lo: ${Math.round(daily[i].temp.min)}°F</span></p>
                <p>Wind: ${windDirection(daily[i].wind_deg)} at ${Math.round(daily[i].wind_speed)}mph</p>
                <p>Humidity: ${daily[i].humidity}%</p>
            </div>
        `)
    }
}

// Determines wind direction from wind angle given
function windDirection(angle) {
    var directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    var index = Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8;
    return directions[index]
}

// Deterimines UV Index background color based on UV Index value
function uvBackColor(uvi) {
    if (uvi <= 2) {
        uvColor = "green";
    } else if(uvi <= 5) {
        uvColor = "yellow";
    } else if(uvi <= 7) {
        uvColor = "orange";
    } else if(uvi <= 10) {
        uvColor = "red";
    } else {
        uvColor = "Purple";
    }
    return uvColor;
}

// Displays modal with alerts for user.
function displayModal(text) {
    $("#error").html(text);
    $('#myModal').modal("show");
};