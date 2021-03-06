import { useEffect, useRef } from 'react';

import clsx from 'clsx';

import {
    CalculateOneHourAheadAngle,
    CalculateCurrentAngle,
    CalculateNearestHour,
    CalculateOrigin,
    ConditionMap
} from './helpers/Helpers';

import styles from './TravelingIcon.module.scss';

const ANIMATION_TIME = CalculateNearestHour();

let AnimationWorker = new Worker(new URL('./workers/Animation.js', import.meta.url));

const TravelingIcon = ({
    geoData,
    guideDimensions,
    radius,
    weatherData
}) => {
    const TravelingIconRef = useRef(null);

    useEffect(() => {
        if (weatherData && radius && guideDimensions && geoData) {
            TravelingIconRef.current.style.visibility = 'hidden';

            resetAnimationWorker();
            initTravelingIcon(weatherData, radius, guideDimensions, geoData);
        }
    }, [guideDimensions, radius, weatherData, geoData]);

    const initTravelingIcon = (data, radius, dimensions, gData) => {
        const iconDimensions = TravelingIconRef.current.getBoundingClientRect();

        const origin = CalculateOrigin(dimensions, iconDimensions);

        const sunPath = configureSunPath(gData);

        AnimationWorker.postMessage({ sunPath, origin, radius });
        AnimationWorker.onmessage = ({ data: { position } }) => {
            TravelingIconRef.current.style.left = position.left;
            TravelingIconRef.current.style.top = position.top;

            TravelingIconRef.current.style.visibility = 'visible';
        };
    };

    const resetAnimationWorker = () => {
        AnimationWorker.terminate();
        AnimationWorker = new Worker(new URL('./workers/Animation.js', import.meta.url));

        TravelingIconRef.current.style.top = 0;
        TravelingIconRef.current.style.left = 0;
    }

    const configureSunPath = gData => {
        const currentPos = CalculateCurrentAngle(gData);
        const futurePos = CalculateOneHourAheadAngle(gData);

        let pathData = {};

        pathData.startAngle = currentPos;
        pathData.endAngle = futurePos;
        pathData.animationTime = ANIMATION_TIME;
        pathData.vector = (pathData.endAngle - pathData.startAngle) / pathData.animationTime;
        pathData.start = false;
        pathData.curAngle = pathData.startAngle;

        return pathData;
    };

    const getWeatherIcon = () => {
        const { id, main } = weatherData.weather[0];

        const fixMain = main.toLowerCase();
        const map = ConditionMap(id, styles);

        if (Object.keys(map).includes(fixMain)) return map[fixMain];

        return map['default'];
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