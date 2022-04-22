import { useEffect, useState } from 'react';

import { GetTime } from './helpers/Helpers';

import styles from './TimeBoxes.module.scss';

const ClockWorker = new Worker(new URL('./workers/Clock.js', import.meta.url));

const TimeBoxes = ({
    weatherData
}) => {
    const [time, setTime] = useState(GetTime());

    useEffect(() => {
        ClockWorker.postMessage({ start: true });
        ClockWorker.onmessage = ({ data }) => {
            setTime(data);
        };
    }, []);

    return (
        <div className={styles.TimeBoxes}>
            <div className={styles.MainTime}>{time}</div>
            <div>
                {GetTime(weatherData.sys.sunrise)} | {GetTime(weatherData.sys.sunset)}
            </div>
        </div>
    );
};

export default TimeBoxes;