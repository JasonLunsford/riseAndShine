import { useEffect, useRef, useState } from 'react';

import clsx from 'clsx';

import {
    CalculateOffset,
    CalculateCurrentAngleDelta,
    CalculateOrigin
} from './helpers/Helpers';

import styles from './TravelingIcon.module.scss';

const ANIMATION_TIME = 86400000; // 86400000 = 24 hours in milliseconds

let AnimationWorker = new Worker(new URL('./workers/Animation.js', import.meta.url));

const TravelingIcon = ({
    guideDimensions,
    radius,
    visibility,
    weatherData
}) => {
    const TravelingIconRef = useRef(null);

    useEffect(() => {
        if (weatherData && radius && guideDimensions) {
            resetAnimationWorker();
            initTravelingIcon(weatherData, radius, guideDimensions, visibility);
        }
    }, [guideDimensions, radius, weatherData, visibility]);

    const initTravelingIcon = (data, radius, dimensions, visibility) => {
        const iconDimensions = TravelingIconRef.current.getBoundingClientRect();

        const offSet = CalculateOffset(data);
        const origin = CalculateOrigin(dimensions, iconDimensions);

        const sunPath = configureSunPath(data, radius, offSet);

        AnimationWorker.postMessage({ sunPath, origin, radius });
        AnimationWorker.onmessage = ({ data: { position } }) => {
            TravelingIconRef.current.style.left = position.left;
            TravelingIconRef.current.style.top = position.top;

            TravelingIconRef.current.style.visibility = visibility;
        };
    };

    const resetAnimationWorker = () => {
        AnimationWorker.terminate();
        AnimationWorker = new Worker(new URL('./workers/Animation.js', import.meta.url));

        TravelingIconRef.current.style.top = 0;
        TravelingIconRef.current.style.left = 0;
    }

    const configureSunPath = (data, radius, offset = 0) => {
        const angle = CalculateCurrentAngleDelta(data, radius);

        let pathData = {};

        pathData.startAngle = Math.PI + offset;
        pathData.endAngle = 0 + angle;
        pathData.animationTime = ANIMATION_TIME;
        pathData.vector = (pathData.startAngle - pathData.endAngle) / pathData.animationTime;
        pathData.start = false;
        pathData.curAngle = pathData.startAngle;

        return pathData;
    };

    const getWeatherIcon = () => {
        const { main, id } = weatherData.weather[0];

        switch (main.toLowerCase()) {
            case 'clear':
                return styles.Clear;
            case 'clouds':
                return styles.Clouds;
            case 'thunderstorm':
                return styles.Thunderstorm;
            case 'tornado':
                return styles.Tornado;
            case 'drizzle':
            case 'mist':
                return styles.Drizzle;
            case 'rain':
                return styles.Rain;
            case 'snow':
                if (id === 600) return styles.LightSnow
                return styles.Snow;
            case 'fog':
                return styles.Fog;
            case 'windy':
                return styles.Windy;
            default:
                return styles.Default;
        }
    };

    return (
      <div
        className={clsx(styles.BaseIcon, getWeatherIcon())}
        ref={TravelingIconRef}
      >
        <span>{Math.round(weatherData.main.temp)}&deg;F</span>
      </div>
    )
};

export default TravelingIcon;