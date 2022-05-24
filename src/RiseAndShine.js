import { useEffect, useState } from 'react';

import clsx from 'clsx';

import {
    CalculateNearestHour,
    CalculateRadius,
    ConditionMap,
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

            setGeoData(gData);
            setWeatherData(wData);
            setGuideVisible('visible');
        };

        init();

        window.addEventListener('resize', resize, false);

        return () => {
            window.removeEventListener('resize', resize);
        }
    }, []);

    useEffect(() => {
        const startProcess = async () => {
            const nextCheck = CalculateNearestHour();

            setTimeout(async () => {
                const wData = await GetWeatherData(geoData);
                setWeatherData(wData);

                WeatherWorker.postMessage({ geoData });
            }, nextCheck);

            WeatherWorker.onmessage = ({ data: { weatherWorkerData } }) => {
                setWeatherData(weatherWorkerData);
            };
        };

        if (geoData) {
            startProcess();
        }
    }, [geoData])

    const resize = () => {
        setRadius(CalculateRadius());

        clearTimeout(window.resizedFinished);

        window.resizedFinished = setTimeout(() => {

        }, 500);
    };

    const handleGuideInit = guideRef => {
        setGuideDimensions(guideRef.getBoundingClientRect());
    };

    const getBackground = () => {
        const { id, main } = weatherData.weather[0];

        const fixMain = main.toLowerCase();
        const map = ConditionMap(id, styles);

        if (Object.keys(map).includes(fixMain)) return map[fixMain];

        return map['default'];
    };

    if (!weatherData) return null;

    return (
        <div className={clsx(styles.RiseAndShine, getBackground())} >
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
                geoData={geoData}
            />
            <TimeBoxes
                weatherData={weatherData}
            />
        </div>
    );
};

export default RiseAndShine;