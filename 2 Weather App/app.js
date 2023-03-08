// api key is b984a0e53a91bb44a82f7bbf270aa6cc

// window.addEventListener('load', () => {
//     // asks for precise geolocation, if denied shows London
//     navigator.geolocation.getCurrentPosition(
//         pos => {
//             console.log('permission granted!\nshowing current location!')
//             const lat = pos.coords.latitude;
//             const lon = pos.coords.longitude;
//             changeLocation(lat, lon);
//         },
//         error => {
//             if (error.code === error.PERMISSION_DENIED)
//             console.log('geolocation permission denied!');
//             else console.log('unknown error! error code: ' + error.code);
//         });  
// })

// fetches that data, babey!
async function fetchWeather(url) {
    return fetch(url)
        .then (response => response.json())
        .then (JSONdata => {
            console.log('...API data received!')
            console.log(JSONdata);
            return JSONdata;
        })
}

async function updateWeather(url) {
    //ask API for the current weather
    const {main, name, sys, weather, wind} = await this.fetchWeather(url);
    if (!main) return;

    // easier than making and assigning 100 variables, but every time the html changes, this has to change too
    const weatherHTML = document.querySelector('.weather-container');
    weatherHTML.innerHTML = `
        <h2 class="location">${name}, ${sys.country}</h2>
        <div class="weather-main">
            <img class="w-icon" src="http://openweathermap.org/img/wn/${weather[0].icon}@2x.png" alt="cloud">
            <span class="w-temp">${Math.round(main.temp)}°</span>
            <span class="w-units">C</span>
        </div>

        <h4 class="weather-desc">${weather[0].main}</h4>
        <p class="weather-caption">
            <span class="w-feels">feels like ${Math.round(main.feels_like)}°</span>
            <span class="w-wind">wind ${wind.speed} km/h</span>
            <span class="w-humidity">humidity ${main.humidity}%</span>
        </p>
    `
    document.body.style.backgroundImage = `url('./img/${weather[0].icon}.jpg')`;
}

async function updateFiveDayForecast(url) {
    //ask API for the five day forecast
    const data = await this.fetchWeather(url);
    if (!data.list) return;


    const forecast = document.querySelector('.forecast-container');
    forecast.innerHTML = '';

    // API returns forecast in 40 3-hour chunks, hence i +=8 to increase by day
    for (let i = 0; i < data.list.length; i += 8) {
        // turn the full date into a data string like 'Mon Mar 27 2020' and split it 
        const d = new Date(data.list[i].dt_txt).toDateString().split(' ');
        // keeping only 'Mon 27'
        const dateTime = d[0] + ' ' + d[2];

        // get rest of the data from API add chunks of html
        const { temp_max, temp_min } = data.list[i].main;
        const { description, icon } = data.list[i].weather[0]; 

        forecast.innerHTML += `
            <div class="forecast">
                <h4 class="fore-day">${dateTime}</h4>
                <img src="http://openweathermap.org/img/wn/${icon}@2x.png" alt="icon">
                <p class="high-low">
                    <span class="high">${Math.round(temp_max)}°</span>
                    <span class="low">${Math.round(temp_min)}°</span>
                </p>
                <p>${description}</p>
            </div>
        `
    }
}

function changeLocation(arg1, arg2 = null) {
    //performs an API request based either on (city,country code), or (latitude,longitude)
    // e.g 'London','GB' or '0.23432424','-2.353645' 
    if (typeof(arg1) === 'string') {
        urlWeather = `https://api.openweathermap.org/data/2.5/weather?q=${arg1},${arg2}&units=metric&appid=b984a0e53a91bb44a82f7bbf270aa6cc`;
        urlFiveDay = `https://api.openweathermap.org/data/2.5/forecast?q=${arg1},${arg2}&units=metric&appid=b984a0e53a91bb44a82f7bbf270aa6cc`;
    }
        
    else if (typeof(arg1) === 'number' && typeof(arg2) === 'number') {
        urlWeather = `https://api.openweathermap.org/data/2.5/weather?lat=${arg1}&lon=${arg2}&units=metric&appid=b984a0e53a91bb44a82f7bbf270aa6cc`;
        urlFiveDay = `https://api.openweathermap.org/data/2.5/forecast?lat=${arg1}&lon=${arg2}&units=metric&appid=b984a0e53a91bb44a82f7bbf270aa6cc`;

    }

    else console.log('changeLocation had bad arguments passed!\n' + arg1 + ' and ' + arg2);

    updateWeather(urlWeather);
    updateFiveDayForecast(urlFiveDay);
}


//search functionality, placename and (optionally) country or state code
const search = document.querySelector('.search')
search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const searchText = search.value;

        if (searchText.search(',')) {
            console.log('hi');
            const cityAndCode = searchText.split(',');
            changeLocation(cityAndCode[0], cityAndCode[1]);
        }
    }
});

changeLocation('London','GB');