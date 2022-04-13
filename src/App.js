import { useEffect, useRef, useState } from 'react';

import clsx from 'clsx';

import {
  GetTime,
  GetGeoData,
  GetWeatherData
} from './helpers/Helpers';

import styles from './App.module.scss';

const ClockWorker = new Worker(new URL('./workers/Clock.js', import.meta.url));
const WeatherWorker = new Worker(new URL('./workers/Weather.js', import.meta.url));
let AnimationWorker = new Worker(new URL('./workers/Animation.js', import.meta.url));

const App = () => {
  const SunRef = useRef(null);
  const GuideRef = useRef(null);

  const [radius, setRadius] = useState();
  const [origin, setOrigin] = useState();
  const [sunPath, setSunPath] = useState();

  const [geoData, setGeoData] = useState();
  const [weatherData, setWeatherData] = useState();

  const [time, setTime] = useState(GetTime());

  useEffect(() => {
    GetGeoData().then(data => setGeoData(data));
    calculateRadius();

    window.addEventListener('resize', reload, false);

    ClockWorker.postMessage({ start: true });
    ClockWorker.onmessage = ({ data }) => {
      setTime(data);
    };

    return () => {
      window.removeEventListener('resize', reload);
    };
  }, []);

  useEffect(() => {
    if (geoData && !weatherData) {
      GetWeatherData(geoData).then(data => setWeatherData(data));

      WeatherWorker.postMessage({ geoData });
      WeatherWorker.onmessage = ({ data: { weatherWorkerData } }) => {
        setWeatherData(weatherWorkerData);
      };
    }
  }, [geoData, weatherData]);

  useEffect(() => {
    if (radius && weatherData) {
      GuideRef.current.style.display = 'flex';
      SunRef.current.style.display = 'flex';
      
      const offset = calculateOffset();

      configureGuide();
      calculateOrigin();
      configureSunPath(offset);
    }
  }, [radius, weatherData]);

  useEffect(() => {
    if (sunPath) {
      AnimationWorker.postMessage({ sunPath, origin, radius });
      AnimationWorker.onmessage = ({ data: { position } }) => {
        SunRef.current.style.left = position.left;
        SunRef.current.style.top = position.top;
      };
    }
  }, [sunPath]);

  const calculateOffset = () => {
    const sunrise = new Date(weatherData.sys.sunrise * 1000);
    const sunset = new Date(weatherData.sys.sunset * 1000);
    const now = new Date();

    const daylightHours = Math.abs((sunset - sunrise) / (1000 * 60 * 60));
    const spentDaylightHours = Math.abs((now - sunrise) / (1000 * 60 * 60));

    return Math.PI * (spentDaylightHours / daylightHours);
  };

  // Simple technique to detect "end" of resizing event, allows repainting
  // once user has finished resizing
  const reload = () => {
    SunRef.current.style.display = 'none';
    GuideRef.current.style.display = 'none';

    clearTimeout(window.resizedFinished);
    window.resizedFinished = setTimeout(() => {
      AnimationWorker.postMessage({ closeInstance: true });
      AnimationWorker = new Worker(new URL('./workers/Animation.js', import.meta.url));

      SunRef.current.style.top = 0;
      SunRef.current.style.left = 0;

      calculateRadius();
    }, 500);
  };

  const calculateRadius = () => {
    setRadius(window.innerWidth * .3);
  };

  const configureGuide = () => {
    GuideRef.current.style.top = 'calc(100% - ' + radius + 'px)';
    GuideRef.current.style.left = 'calc(50% - ' + radius + 'px)';
    GuideRef.current.style.width = radius * 2 +'px';
    GuideRef.current.style.height = radius * 2 +'px';
  };

  const calculateOrigin = () => {
    const originBox = GuideRef.current.getBoundingClientRect();
    const sunBox = SunRef.current.getBoundingClientRect();

    const adjustedX = (originBox.left + originBox.width / 2) - (sunBox.left + sunBox.right / 2);
    const adjustedY = (originBox.top + originBox.height / 2) - (sunBox.top + sunBox.bottom / 2);

    setOrigin({
      'x': adjustedX,
      'y': adjustedY
    });
  };

  const configureSunPath = (offset = 0) => {
    let pathData = {};

    pathData.startAngle = Math.PI + offset; 
    pathData.endAngle = 0;
    pathData.animationTime = 86400000; // 86400000 = 24 hours in milliseconds
    pathData.vector = (pathData.startAngle - pathData.endAngle) / pathData.animationTime;
    pathData.start = false;
    pathData.curAngle = pathData.startAngle;

    setSunPath(pathData);
  };

  const getWeatherIcon = () => {
    const condition = weatherData.weather[0].main;

    switch (condition) {
      case 'Clear':
        return styles.Clear;
      case 'Clouds':
        return styles.Clouds;
      case 'Thunderstorm':
      case 'Drizzle':
      case 'Rain':
      case 'Snow':
      case 'Fog':
      default:
        return styles.Default;
    }
  }

  if (!weatherData) return null;

  return (
    <div className={styles.App}>
      <div
        className={clsx(styles.BaseIcon, getWeatherIcon())}
        ref={SunRef}
      >
        <span>{Math.round(weatherData.main.temp)}&deg;F</span>
      </div>
      <div className={styles.Guide} ref={GuideRef}>
        <div className={styles.TimeBox}>
          <div className={styles.MainTime}>{time}</div>
          <div>
            {GetTime(weatherData.sys.sunrise)} | {GetTime(weatherData.sys.sunset)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
