import axios from 'axios';

const _instance = axios.create({
  baseURL: 'http://api.openweathermap.org/'
});

const FixTime = value => {
    if (value < 10) {
        return '0' + value;
    }

    return value;
};

const GetCurrentTime = () => {
    const now = new Date();

    const rawHours = now.getHours();
    const rawMinutes = now.getMinutes();
    let hours = FixTime(rawHours), minutes = FixTime(rawMinutes);

    return `${hours}:${minutes}`;
};

const GetGeoData = async () => {
    const { data } = await _instance.get(`geo/1.0/zip?zip=15044,US&appid=${process.env.REACT_APP_OPENWEATHER_KEY}`);

    return data;
};

const GetWeatherData = async geoData => {
    const { data } = await _instance.get(`data/2.5/weather?lat=${geoData.lat}&lon=${geoData.lon}&units=imperial&appid=${process.env.REACT_APP_OPENWEATHER_KEY}`);

    return data;
};

export {
    FixTime,
    GetCurrentTime,
    GetGeoData,
    GetWeatherData
}