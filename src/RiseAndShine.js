import { useEffect, useState } from 'react';

import {
    CalculateNearestHour,
    CalculateRadius,
    GetGeoData,
    GetWeatherData
} from './helpers/Helpers';

import Guide from './Guide';
import TimeBoxes from './TimeBoxes';
import TravelingIcon from './TravelingIcon';

import styles from './RiseAndShine.module.scss';

const WeatherWorker = new Worker(new URL('./workers/Weather.js', import.meta.url));

const RiseAndShine = () => {

    const [radius, setRadius] = useState(CalculateRadius());

    const [guideVisible, setGuideVisible] = useState('hidden');
    const [guideDimensions, setGuideDimensions] = useState();

    const [geoData, setGeoData] = useState();
    const [weatherData, setWeatherData] = useState();

    useEffect(() => {
        const init = async () => {
            const gData = await GetGeoData();
            let wData = await GetWeatherData(gData);

            const nextCheck = CalculateNearestHour();

            setGeoData(gData);
            setWeatherData(wData);
            setGuideVisible('visible');

            setTimeout(async () => {
                wData = await GetWeatherData(gData);
                setWeatherData(wData);

                WeatherWorker.postMessage({ gData });
            }, nextCheck);

            WeatherWorker.onmessage = ({ data: { weatherWorkerData } }) => {
                setWeatherData(weatherWorkerData);
            };
        };

        init();

        window.addEventListener('resize', resize, false);

        return () => {
            window.removeEventListener('resize', resize);
        }
    }, []);

    const resize = () => {
        setRadius(CalculateRadius());

        clearTimeout(window.resizedFinished);

        window.resizedFinished = setTimeout(() => {

        }, 500);
    };

    const handleGuideInit = guideRef => {
        setGuideDimensions(guideRef.getBoundingClientRect());
    };

    if (!weatherData) return null;

    return (
        <div className={styles.RiseAndShine} >
            <Guide
                onGuideInit={handleGuideInit}
                radius={radius}
                visibility={guideVisible}
                weatherData={weatherData}
            />
            <TravelingIcon
                guideDimensions={guideDimensions}
                radius={radius}
                weatherData={weatherData}
            />
            <TimeBoxes
                weatherData={weatherData}
            />
        </div>
    );
};

export default RiseAndShine;