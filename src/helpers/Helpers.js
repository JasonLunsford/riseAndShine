import axios from 'axios';

const _instance = axios.create({
  baseURL: 'http://api.openweathermap.org/'
});

const _fixTime = value => {
    if (value < 10) {
        return '0' + value;
    }

    return value;
};

const GetTime = (timestamp) => {
    let time;

    if (timestamp) {
        time = new Date(timestamp * 1000);
    } else {
        time = new Date();
    }

    const rawHours = time.getHours();
    const rawMinutes = time.getMinutes();
    let hours = _fixTime(rawHours), minutes = _fixTime(rawMinutes);

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
    GetTime,
    GetGeoData,
    GetWeatherData
}