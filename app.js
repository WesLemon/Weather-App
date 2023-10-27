const  { createApp, ref, reactive, onMounted } = Vue;

const app = createApp({
    data() {
        return {
            city: '',
            weather_data: null,
            // pollution_data: null,
        };
    },
    methods: {
        fetchWeatherData() {
            console.log(this.city)
            fetch('http://localhost:3333/' + this.city)
            .then(response => response.json())
            .then(data => {
                this.weather_data = data;
                console.log(this.weather_data);
            })
            .catch(error => {
                console.error(error);
            });
        },
        onSubmit() {
            this.fetchWeatherData();
        },
    },
    template: `
        <div>
            <h1>Weather App</h1>
            <input v-model="city" placeholder="Enter city name">
            <button @click="onSubmit">Get Weather</button>

            <div v-if="weatherData">
                <h2>Weather for {{ city }}</h2>
                <pre>{{ weatherData }}</pre>
            </div>
        </div>
    `,
});

app.mount('#app');