import { useEffect, useRef } from 'react';

import {
    CalculateYShift
} from './helpers/Helpers';

import styles from './Guide.module.scss';

const Guide = ({
    onGuideInit,
    radius, 
    visibility,
    weatherData
}) => {
    const GuideRef = useRef(null);

    useEffect(() => {
        if (weatherData && radius) {
            initializeGuide(weatherData, radius);
        }

        GuideRef.current.style.visibility = visibility;
    }, [radius, visibility, weatherData]);

    const initializeGuide = (data, radius) => {
        const seasonShift = CalculateYShift(data, radius);
        const adjustedRadius = radius + seasonShift;

        GuideRef.current.style.top = 'calc(100% - ' + adjustedRadius + 'px)';
        GuideRef.current.style.left = 'calc(50% - ' + radius + 'px)';
        GuideRef.current.style.width = radius * 2 +'px';
        GuideRef.current.style.height = radius * 2 +'px';

        if (onGuideInit) {
            onGuideInit(GuideRef.current);
        }
    };

    return (
        <div className={styles.Guide} ref={GuideRef} />
    );
};

export default Guide;