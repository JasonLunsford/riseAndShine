import { GetWeatherData } from '../helpers/Helpers';

onmessage = ({ data: { geoData } }) => {
    setInterval(() => {
        GetWeatherData(geoData).then(weatherWorkerData => {
            postMessage({
                weatherWorkerData: weatherWorkerData
            });
        });
    }, 3600000);
};