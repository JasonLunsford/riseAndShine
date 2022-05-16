import { useEffect, useRef } from 'react';

import clsx from 'clsx';

import {
    CalculateOneHourAheadAngle,
    CalculateCurrentAngle,
    CalculateOffset,
    CalculateOrigin,
    ConditionMap
} from './helpers/Helpers';

import styles from './TravelingIcon.module.scss';

const ANIMATION_TIME = 3600000; // 43200000 = 12 hours in milliseconds

let AnimationWorker = new Worker(new URL('./workers/Animation.js', import.meta.url));

const TravelingIcon = ({
    guideDimensions,
    radius,
    weatherData
}) => {
    const TravelingIconRef = useRef(null);

    useEffect(() => {
        if (weatherData && radius && guideDimensions) {
            TravelingIconRef.current.style.visibility = 'hidden';

            resetAnimationWorker();
            initTravelingIcon(weatherData, radius, guideDimensions);
        }
    }, [guideDimensions, radius, weatherData]);

    const initTravelingIcon = (data, radius, dimensions) => {
        const iconDimensions = TravelingIconRef.current.getBoundingClientRect();

        const offSet = CalculateOffset(data);
        const origin = CalculateOrigin(dimensions, iconDimensions);

        const sunPath = configureSunPath(data, radius, offSet);

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

    const configureSunPath = (data, radius, offset = 0) => {
        const currentPos = CalculateCurrentAngle(radius);
        const futurePos = CalculateOneHourAheadAngle(radius);

        let pathData = {};

        pathData.startAngle = currentPos;
        pathData.endAngle = futurePos;
        pathData.animationTime = ANIMATION_TIME;
        pathData.vector = (pathData.startAngle - pathData.endAngle) / pathData.animationTime;
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