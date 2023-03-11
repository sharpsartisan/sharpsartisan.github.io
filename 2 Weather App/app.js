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

// for Chart.js datalabels plugin
Chart.register(ChartDataLabels)

// actual global variable... #sad
let DATA = [];
let CHARTS = new Array(5);

async function fetchWeather(url) {
    return fetch(url)
        .then (response => response.json())
        .then (JSONdata => {
            console.log('...API data received!')
            console.log(JSONdata);
            return JSONdata;
        })
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
    updateDetails(main, sys, weather, wind)
}

async function updateFiveDayForecast(url) {
    //ask API for the five day forecast
    const data = await this.fetchWeather(url);
    if (!data.list) return;

    // global variable so it can be accessed anytime
    DATA = data.list;
    
    const forecast = document.querySelector('.forecast-container');
    forecast.innerHTML = '';

    // API returns forecast in 40 3-hour chunks, hence i +=8 to increase by day
    for (let i = 0; i < data.list.length; i += 8) {
        // turn the full date into a data string like 'Mon Mar 27 2020' and split it 
        const d = new Date(data.list[i].dt_txt).toDateString().split(' ');
        // keeping only 'Mon 27'
        const dateDay = d[0] + ' ' + d[2];

        // get rest of the data from API add chunks of html
        const { temp_max, temp_min } = data.list[i].main;
        const { description, icon } = data.list[i].weather[0]; 

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
        forecast.onclick = () => drawHourlyChart(ID);
    })

    drawHourlyChart(0);
}

// gets called from updateWeather
function updateDetails(main, sys, weather, wind) {
    const details = document.querySelectorAll('.detail');

    // day and night
    const dayNight = details[0].querySelectorAll('p');
    dayNight[0].innerHTML = `The high will be ${Math.round(main.temp_max)}°.`;
    dayNight[1].innerHTML = `The low will be ${Math.round(main.temp_min)}°.`;

    //sunrise and sunset
    // * 1000 to convert from seconds to milliseconds, then slice just the hours/mins
    const sunDetails = details[1].querySelectorAll('p');
    const sunRise = new Date(sys.sunrise*1000).toTimeString().slice(0, 5);
    const sunSet = new Date(sys.sunset*1000).toTimeString().slice(0, 5);
    sunDetails[0].innerHTML = `${sunRise}`;
    sunDetails[1].innerHTML = `${sunSet}`;

    // moonrise and moonset
    const moonRiseSet = details[2].querySelectorAll('p');
    moonRiseSet[0].innerHTML = `${16}`;
    moonRiseSet[1].innerHTML = `${26}`;

    // circle graph dummy data
    const precip = 80;
    const UV = 1;
    // iterates over canvasses
    const graphData = [precip, main.humidity, UV, wind];  

    for (i = 0; i < graphData.length; i++) {
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
    console.log('hi');

    const ctx = document.getElementById('4');
    const hourlyData = [];

    for (let i = ID; i < ID + 8; i++) {
        let temp = Math.round(DATA[i].main.temp);
        hourlyData.push(temp);
    }
    
    for (let i = 0; i < 8; i++) {
        let time = DATA[i].dt_txt.slice(-8, -3);
        hourlyData.push(time)
    }

    const hourlyLabels = hourlyData.slice(0, 8).map((n) => {
        return n.toString() + '°';
    })

    console.log(hourlyData)
    console.log(hourlyLabels)

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

// adds all event listeners
window.addEventListener('DOMContentLoaded', (e) => {

    // makes the info icon clickable for mobile
    const icon = document.querySelector('.search-icon');
    const tooltip = document.querySelector('.search-tooltip');
    icon.onclick = () => {
        tooltip.classList.toggle('hidden');
    }

    // search functionality, placename and (optionally) country or state code
    const search = document.querySelector('.search')
    // clears input box when page refreshes
    search.value = '';
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

    // opens and closes the 'about' modal
    const modal = document.getElementById('about-modal');
    const btn = document.getElementById('about');
    const closeIcon = document.getElementById('about-close');
    // click on close or anywhere outside the modal to close it
    btn.onclick = () => modal.style.display = 'block';
    closeIcon.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => {if (e.target === modal) modal.style.display = 'none';}

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