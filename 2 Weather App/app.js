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

import COUNTRIES from './countries.js';
import ISO from './iso.js';

const API = 'b984a0e53a91bb44a82f7bbf270aa6cc';

// for Chart.js datalabels plugin
Chart.register(ChartDataLabels)

// actual global variable... #sad
let DATA = [];
let CHARTS = new Array(5);

async function fetchWeather(url) {
    return fetch(url)
        .then(response => response.json())
        .then(JSONdata => {
            console.log('...API data received!')
            console.log(JSONdata);
            return JSONdata;
        })
        .catch(err => {
            console.error('API data NOT received: ', err);
        })
}

function changeLocation(arg1, arg2 = null) {
    //performs an API request based either on (city), (city,country code), or (latitude,longitude)
    // e.g 'London','GB' or '0.23432424','-2.353645' 
    let urlWeather, urlFiveDay;

    if (typeof(arg1) === 'string') {
        if (arg2) {
            urlWeather = `https://api.openweathermap.org/data/2.5/weather?q=${arg1},${arg2}&units=metric&appid=${API}`;
            urlFiveDay = `https://api.openweathermap.org/data/2.5/forecast?q=${arg1},${arg2}&units=metric&appid=${API}`;
        }
        else  {
            urlWeather = `https://api.openweathermap.org/data/2.5/weather?q=${arg1}&units=metric&appid=${API}`;
            urlFiveDay = `https://api.openweathermap.org/data/2.5/forecast?q=${arg1}&units=metric&appid=${API}`;
        }
    }
    else if (typeof(arg1) === 'number' && typeof(arg2) === 'number') {
        urlWeather = `https://api.openweathermap.org/data/2.5/weather?lat=${arg1}&lon=${arg2}&units=metric&appid=${API}`;
        urlFiveDay = `https://api.openweathermap.org/data/2.5/forecast?lat=${arg1}&lon=${arg2}&units=metric&appid=${API}`;

    }
    else console.log('changeLocation had bad arguments passed!\n\'' + arg1 + '\' and \'' + arg2 +'\'');

    updateWeather(urlWeather);
    updateFiveDayForecast(urlFiveDay);
}

async function updateWeather(url) {
    //ask API for the current weather
    const {main, name, sys, weather, wind, timezone, visibility} = await fetchWeather(url);
    if (!main) return;

    let GMT = ("+" + (timezone / 3600)).slice(-2);

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
            <span class="w-feels">Feels like ${Math.round(main.feels_like)}°</span>
            <span class="w-wind">Wind ${Math.round(wind.speed)} km/h</span>
            <span class="w-vis">Visibility ${Math.round(visibility / 1000)}km</span>
        </p>
        <p class="weather-caption">
            <span class="w-pressure">Barometer ${main.pressure}mb</span>
            <span class="w-humidity">Humidity ${main.humidity}%</span>
            <span class="w-zone">Timezone ${GMT} GMT </span>
        </p>
    `
    document.body.style.backgroundImage = `url('./img/${weather[0].icon}.jpg')`;
}

async function updateFiveDayForecast(url) {
    //ask API for the five day forecast
    const data = await fetchWeather(url);
    if (!data || !data.list) return;

    // global variable so it can be accessed anytime
    DATA = data.list;
    DATA.push(data.city);
    
    const forecast = document.querySelector('.forecast-container');
    forecast.innerHTML = '';

    // API returns forecast in 40 3-hour chunks, hence i +=8 to increase by day
    for (let i = 0; i < data.list.length - 1; i += 8) {
        // turn the full date into a data string like 'Mon Mar 27 2020' and split it 
        const d = new Date(data.list[i].dt_txt).toDateString().split(' ');
        // keeping only 'Mon 27'
        const dateDay = d[0] + ' ' + d[2];
        const { description, icon } = DATA[i].weather[0]; 

        let { temp_max, temp_min } = DATA[i].main;
        for (let j = 0; j < 8; j++) {
            if (DATA[i + j].main.temp_max > temp_max) temp_max = DATA[i + j].main.temp_max
            if (DATA[i + j].main.temp_min < temp_min) temp_min = DATA[i + j].main.temp_min
        }


        forecast.innerHTML += `
            <div class="forecast" id="f${i}">
                <h4 class="fore-day">${dateDay}</h4>
                <img src="http://openweathermap.org/img/wn/${icon}@2x.png" alt="icon">
                <p class="high-low">
                    <span class="high">${Math.round(temp_max)}°</span>
                    <span class="low">${Math.round(temp_min)}°</span>
                </p>
                <p>${description}</p>
            </div>
        `
    }
    
    // adds clicking on daily forecasts updates graph for that day
    const forecasts = document.querySelectorAll('.forecast');
    forecasts.forEach((forecast) => {
        const ID = parseInt(forecast.id.slice(1));
        forecast.addEventListener('click', () => {
            updateDetails(ID);
            drawHourlyChart(ID);
        });
    })
    
    // default chart and details are for the first day
    updateDetails(0)
    drawHourlyChart(0);
}

// gets called from updateWeather
// SHOULD GET CALLED FROM 5-DAY SO IT UPDATES FOR EVERY DAY
function updateDetails(ID) {
    const details = document.querySelectorAll('.detail');

    const main = DATA[ID].main;
    const wind = DATA[ID].wind;

    // highs and lows - figuring out WHEN it is day or night with the data is a headache
    const dayNight = document.querySelectorAll('.detail')[0].querySelectorAll('p');

    let { temp_max, temp_min } = DATA[ID].main;
    for (let i = 0; i < 8; i++) {
        if (DATA[ID + i].main.temp_max > temp_max) temp_max = DATA[ID + i].main.temp_max
        if (DATA[ID + i].main.temp_min < temp_min) temp_min = DATA[ID + i].main.temp_min
    }

    dayNight[0].innerHTML = `The high will be ${Math.round(temp_max)}°.`;
    dayNight[1].innerHTML = `The low will be ${Math.round(temp_min)}°.`;

    //sunrise and sunset
    // * 1000 to convert from seconds to milliseconds, then slice just the hours/mins
    const sunDetails = details[1].querySelectorAll('p');
    const timezone = DATA[DATA.length-1].timezone;
    const sunRise = new Date((DATA[DATA.length-1].sunrise + timezone)*1000).toTimeString().slice(0, 5);
    const sunSet = new Date((DATA[DATA.length-1].sunset + timezone)*1000).toTimeString().slice(0, 5);
    sunDetails[0].innerHTML = `${sunRise}`;
    sunDetails[1].innerHTML = `${sunSet}`;

    // moonrise and moonset
    // API doesn't give this data... sooo
    const moonRiseSet = details[2].querySelectorAll('p');
    moonRiseSet[0].innerHTML = `22:12`;
    moonRiseSet[1].innerHTML = `06:42`;

    // circle graph dummy data
    const precip = 80;
    const UV = 1;
    // iterates over canvasses
    const graphData = [precip, main.humidity, UV, wind];  

    for (let i = 0; i < graphData.length; i++) {
        drawCircleCharts(graphData[i], i);
    }
}

// uses Chart.js, gets called from updateDetails
function drawCircleCharts(graphData, p) {

    const ctx = document.getElementById(`${p}`);
    const text = document.querySelectorAll('.graph > p')[p];

    // draws the wind circle graph
    if (p === 3) {
        text.innerHTML = `${graphData.speed} km/h`;

    if (CHARTS[p]) CHARTS[p].destroy();
    CHARTS[p] = new Chart(ctx, {
            type: 'doughnut',
    
            options: {
                cutout: '80%',
                plugins: {
                    datalabels: false,
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                },
            },
    
            data: {
                datasets: [{
                    backgroundColor: ['rgb(20,220,255)', 'rgb(126,138,143)'],
                    data: [graphData, 100 - graphData],
                    borderWidth: 0,
                }]
            }
        })
    }

    // draws the other circle graphs
    else {
        if (p === 2) text.innerHTML = `${graphData} (Low)`; 
        else text.innerHTML = `${graphData}%`;

        if (CHARTS[p]) CHARTS[p].destroy();
        CHARTS[p] = new Chart(ctx, {
            type: 'doughnut',
    
            options: {
                cutout: '80%',
                plugins: {
                    datalabels: false,
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                },
            },
    
            data: {
                datasets: [{
                    backgroundColor: ['rgb(20,220,255)', 'rgb(126,138,143)'],
                    data: [graphData, 100 - graphData],
                    borderWidth: 0,
                }]
            }
        })
    }
}

// uses Chart.js, gets called from updateFiveDayForecast
// or by clicking on a daily forecast
function drawHourlyChart(ID) {
    const ctx = document.getElementById('4');
    const hourlyData = [];
    const timezone = DATA[DATA.length-1].timezone;

    for (let i = ID; i < ID + 8; i++) {
        let temp = Math.round(DATA[i].main.temp);
        hourlyData.push(temp);
    }
    
    for (let i = 0; i < 8; i++) {
        let time = new Date((DATA[i].dt + timezone)*1000).toTimeString().slice(0, 5);;
        hourlyData.push(time)
    }

    // (DATA[DATA.length-1].sunset + timezone)*1000).toTimeString().slice(0, 5);

    const hourlyLabels = hourlyData.slice(0, 8).map((n) => {
        return n.toString() + '°';
    })

    const yMin = Math.min(...hourlyData.slice(0, 8)) - 2;
    const yMax = Math.max(...hourlyData.slice(0, 8)) + 1;

    if (CHARTS[4]) CHARTS[4].destroy();
    CHARTS[4] = new Chart(ctx, {
        type: 'line',

        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    suggestedMin: yMin,
                    suggestedMax: yMax,
                    display: false
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#fff'
                    }
                }
            },
            elements: {
                point: {
                    pointStyle: false,
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                },
            },
        },

        data: {
            labels: hourlyData.slice(8),
            datasets: [{
                data: hourlyData.slice(0, 8),
                fill: 'origin',
                borderColor: 'rgb(200, 220, 220)',
                borderWidth: 1,
                tension: 0,
                datalabels: {
                    align: 'end',
                    color: '#fff'
                }
            }]
        }
    })
}

function autocomplete() {
    const input = document.getElementById('search');
    
    // clears input on page refresh
    input.value = '';

    // which result we're highlighting, if any
    let focus = -1;

    // every time you type in here... things happen
    input.addEventListener('input', function (e) {
        closeOldList();
        const val = this.value.toLowerCase();

        // new div to contain cities
        const containerDiv = document.createElement('div');
        containerDiv.setAttribute('class', 'auto-items')
        this.parentNode.appendChild(containerDiv);

        
        // searches the big countries list, returns the first 5 matches
        let arr = [];
        const countries = Object.keys(COUNTRIES);

        search:
        for (let i = 0; i < countries.length; i++) {
            let cities = COUNTRIES[countries[i]];
            for (let j = 0; j < cities.length; j++) {
                if (cities[j].toLowerCase().includes(val)) {
                    // add to array and update results
                    let info = {
                        country: Object.keys(COUNTRIES)[i],
                        city: cities[j],
                    }
                    arr.push(info);

                    // make each result, make it clickable
                    const resultDiv = document.createElement('div');
                    resultDiv.innerHTML = `${info.city}, ${info.country}`;
                    resultDiv.addEventListener('click', (e) => {
                        selectLocation(e.target.innerHTML);
                        closeOldList();
                        this.value = '';
                    })

                    containerDiv.appendChild(resultDiv);
                    if (arr.length === 5) break search;
                }
            }
        }
    })

    input.addEventListener('keydown', (e) => {
        let results = document.querySelector('.auto-items')
        if (results) results = results.children;
        else return

        switch (e.key) {
            case 'Enter':
                // prevent form submission, and if something is highlighted, click it
                e.preventDefault();
                if (focus >= 0 && focus < 5) results[focus].click();
                break;
            case 'ArrowUp':
                focus--;
                addFocus(results);
                break;
            case 'ArrowDown':
                focus ++;
                addFocus(results);
                break;
        }
    });

    // highlights results
    function addFocus(results) {
        // first we reset
        [...results].forEach(r => r.classList.remove('auto-active'));

        if (focus >= results.length) focus = 0;
        else if (focus < 0) focus = results.length - 1;
        results[focus].classList.add('auto-active');
    }

    // place gets split into [city, country]
    function selectLocation(place) {
        place = place.split(', ');

        // replaces country name with country code for the API
        for (let i = 0; i < Object.keys(ISO).length; i++) {
            if (Object.values(ISO)[i] === place[1]) {
                place[1] = Object.keys(ISO)[i];
            }
        }

        changeLocation(place[0], place[1]);
    }

    function closeOldList() {
        // closes the autocomplete lists!
        const list = document.querySelector('.auto-items');
        if (!list) return
        else list.remove();
    }

    document.addEventListener('click', () => {
        focus = -1;
        closeOldList();
    })
}

function modal() {
    const modal = document.getElementById('about-modal');
    const btn = document.getElementById('about');
    const closeIcon = document.getElementById('about-close');

    btn.addEventListener('click', () => modal.style.display = 'block')
    closeIcon.addEventListener('click', () => modal.style.display = 'none')
    window.addEventListener('click', (e) => {if (e.target === modal) modal.style.display = 'none'})
}

// adds all event listeners
window.addEventListener('DOMContentLoaded', (e) => {

    // makes the info icon clickable for mobile
    const icon = document.querySelector('.search-icon');
    const tooltip = document.querySelector('.search-tooltip');
    icon.addEventListener('click', () => tooltip.classList.toggle('hidden'));


    // OLD SEARCH, WE MAKE A NEW ONE
    // search.addEventListener('keydown', (e) => {
    //     if (e.key === 'Enter') {
    //         const searchText = search.value;

    //         if (searchText.search(',')) {
    //             const cityAndCode = searchText.split(',');
    //             console.log(cityAndCode)
    //             changeLocation(cityAndCode[0], cityAndCode[1]);
    //         }
    //     }
    // });

    // NEW SEARCH:
    autocomplete();

    // opens and closes the 'about' modal
    // click on close or anywhere outside the modal to close it
    modal();    

    // loads default location
    changeLocation('London','GB');
})

// only displays content after everything is done
window.addEventListener('load', (e) => {
    const loading = document.querySelector('.loading');
    // it's not perfect... but it is easy
    setTimeout(() => {
        loading.classList.add('hidden');
    }, 400);
})