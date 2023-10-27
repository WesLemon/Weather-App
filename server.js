const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3333;

app.use(express.json());
app.use(cors());

// Endpoint for weather data
app.get('/weather/:city', async (req, res) => {
    const city = req.params.city;
    try {
        const response = await axios.get(
            'https://api.openweathermap.org/data/2.5/forecast?q=' + city + '&units=metric&appid=7a0ddac338ffdbad55ce1d84e1413202'
        );
        weather_data = response.data;
        summary = get_summary(weather_data);
        res.json(summary);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching weather data.' })
    }
});

// Endpoint for pollution data
app.get('/pollution/:lon/:lat', async (req, res) => {
    const lon = req.params.lon;
    const lat = req.params.lat;
    try {
        const response = await axios.get(
            'https://api.openweathermap.org/data/2.5/air_pollution?lat=' + lat + '&lon=' + lon + '&appid=7a0ddac338ffdbad55ce1d84e1413202'
        );

        let pm2_5 = response.data.list[0].components.pm2_5;
        res.json(pm2_5);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching pollution data.' });
    }
});

// Endpoint for sunrise/sunset data
app.get('/sun/:lat/:lon/:date', async (req, res) => {
    const lat = req.params.lat;
    const lon = req.params.lon;
    const date = req.params.date;

    try {
        const response = await axios.get(
            'https://api.sunrise-sunset.org/json?lat=' + lat + '&lng=' + lon + '&date=' + date
        );
        result = {
            sunrise: response.data.results.sunrise,
            sunset: response.data.results.sunset
        };
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching sunrise/sunset data' })
    }
});

// Endpoint for UV index data
app.get('/uv/:lat/:lon', async (req, res) => {
    const lat = req.params.lat;
    const lon = req.params.lon;

    try {
        const response = await axios.get(
            'https://api.openuv.io/api/v1/uv?lat=' + lat + '&lng=' + lon, {
            headers: {
                'x-access-token': 'openuv-7orcjfrlo5q0k7c-io'
            },
        });
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching UV Index data' })
    }
});

// Endpoint to get current location name from Geocoding API
app.get('/location/:lat/:lon', async (req, res) => {
    const lat = req.params.lat;
    const lon = req.params.lon;

    try {
        const response = await axios.get(
            'http://api.openweathermap.org/geo/1.0/reverse?lat=' + lat + '&lon=' + lon + '&limit=1&appid=7a0ddac338ffdbad55ce1d84e1413202'
        );
        res.json(response.data[0].name);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching city name from GeoCoding API' })
    }
});

// Start the server
app.listen(port, () => {
    console.log('Server running at http://localhost:3333');
});

function get_summary(weather_data) {
    let summary = {
        code: weather_data.cod,
        city: weather_data.city.name,
        country: weather_data.city.country,
        rainfall: 0,
        avg_temp: 0,
        avg_wind: 0,
        min_temp: 0,
        max_temp: 0,
        lat: weather_data.city.coord.lat,
        lon: weather_data.city.coord.lon,
        days: {}
    };

    const forecast = weather_data.list;
    let total_rainfall = 0;
    let temps = [];
    let wind_speeds = [];
    let min_temp = forecast[0].main.temp;
    let max_temp = forecast[0].main.temp;

    for (let index = 0; index < forecast.length; index++) {
        let entry = forecast[index];
        let temp = entry.main.temp;
        temps.push(temp);
        if (temp < min_temp) {
            min_temp = temp;
        }
        if (temp > max_temp) {
            max_temp = temp;
        }
        let rain = entry.rain ? entry.rain['3h'] : 0;
        total_rainfall += rain;
        wind_speeds.push(entry.wind.speed)
    }

    summary.rainfall = total_rainfall.toFixed(2);
    summary.avg_temp = temps.reduce((p, c, _, a) => p + c / a.length, 0);
    summary.avg_temp = summary.avg_temp.toFixed(2);
    summary.avg_wind = wind_speeds.reduce((p, c, _, a) => p + c / a.length, 0);
    summary.avg_wind = summary.avg_wind.toFixed(2);
    summary.max_temp = max_temp;
    summary.min_temp = min_temp;
    summary.days = calculate_daily_averages(weather_data);

    return summary;
}

function calculate_daily_averages(weather_data) {
    const daily_averages = {};
    let count = 1;

    for (const entry of weather_data.list) {
        if (count > 5) {
            break;
        }
        const date = entry.dt_txt.split(' ')[0];
        let rain = entry.rain ? entry.rain['3h'] : 0;
        if (!daily_averages[date]) {
            count++;
            daily_averages[date] = {
                avg_temp: entry.main.temp,
                rainfall: rain,
                avg_wind: entry.wind.speed,
                count: 1,
            };
        } else {
            daily_averages[date].avg_temp += entry.main.temp;
            daily_averages[date].rainfall += rain;
            daily_averages[date].avg_wind += entry.wind.speed;
            daily_averages[date].count += 1;
        }
    }

    for (const date in daily_averages) {
        daily_averages[date].avg_temp /= daily_averages[date].count;
        daily_averages[date].avg_temp = daily_averages[date].avg_temp.toFixed(2);
        daily_averages[date].avg_wind /= daily_averages[date].count;
        daily_averages[date].avg_wind = daily_averages[date].avg_wind.toFixed(2);
        daily_averages[date].rainfall = daily_averages[date].rainfall.toFixed(2);
    }

    return daily_averages;
}