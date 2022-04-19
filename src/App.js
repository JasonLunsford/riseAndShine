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

  const [refresh, setRefresh] = useState(true);

  const [origin, setOrigin] = useState();
  const [sunPath, setSunPath] = useState();

  const [geoData, setGeoData] = useState();
  const [weatherData, setWeatherData] = useState();

  const [time, setTime] = useState(GetTime());

  useEffect(() => {
    GetGeoData().then(gData => {
      setGeoData(gData);

      GetWeatherData(gData).then(wData => setWeatherData(wData));

      WeatherWorker.postMessage({ gData });
      WeatherWorker.onmessage = ({ data: { weatherWorkerData } }) => {
        setWeatherData(weatherWorkerData);
        setRefresh(true);
      };
    });

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
    if (refresh && weatherData) {
      resetAnimationWorker();
            
      const radius = calculateRadius();
      const offset = calculateOffset();

      configureGuide(radius);
      calculateOrigin();
      configureSunPath(offset);

      setRefresh(false);
    }
  }, [refresh, weatherData]);

  useEffect(() => {
    if (sunPath) {
      const radius = calculateRadius();

      AnimationWorker.postMessage({ sunPath, origin, radius });
      AnimationWorker.onmessage = ({ data: { position } }) => {
        SunRef.current.style.left = position.left;
        SunRef.current.style.top = position.top;
        GuideRef.current.style.visibility = 'visible';
        SunRef.current.style.visibility = 'visible';
      };
    }
  }, [sunPath]);

  const calculateDaylightHours = data => {
    const sunrise = new Date(data.sys.sunrise * 1000);
    const sunset = new Date(data.sys.sunset * 1000);

    return Math.abs((sunset - sunrise) / (1000 * 60 * 60));    
  };

  const calculateSpentHours = data => {
    const sunrise = new Date(data.sys.sunrise * 1000);
    const now = new Date();

    return Math.abs((now - sunrise) / (1000 * 60 * 60));
  }

  const calculateYShift = (data, curRadius) => {
    const daylightHours = calculateDaylightHours(data);
    // percent change of daylight from the base state of 12 hr / day.
    const shiftRatio = (daylightHours - 12) / 24;

    // Arc change in pixels, divided by 2 to represent both sides of the
    // circle
    const arcDelta = ((2 * Math.PI * curRadius) * shiftRatio) / 2;

    // Calculate angle in radians
    const angle = arcDelta / curRadius;

    // Calculate length of line crossing the circle at two points
    return 2 * curRadius * Math.sin(angle / 2);
  }

  const calculateOffset = () => {
    const daylightHours = calculateDaylightHours(weatherData);
    const spentDaylightHours = calculateSpentHours(weatherData);

    return Math.PI * (spentDaylightHours / daylightHours);
  };

  const resetAnimationWorker = () => {
      AnimationWorker.terminate();
      AnimationWorker = new Worker(new URL('./workers/Animation.js', import.meta.url));

      SunRef.current.style.top = 0;
      SunRef.current.style.left = 0;
  }

  // Simple technique to detect "end" of resizing event, allows repainting
  // once user has finished resizing
  const reload = () => {
    SunRef.current.style.visibility = 'hidden';
    GuideRef.current.style.visibility = 'hidden';

    clearTimeout(window.resizedFinished);
    window.resizedFinished = setTimeout(() => {
      setRefresh(true);
    }, 500);
  };

  const calculateRadius = () => {
    return window.innerWidth * .3;
  };

  const configureGuide = radius => {
    const seasonShift = calculateYShift(weatherData, radius);
    const adjustedRadius = radius + seasonShift;

    GuideRef.current.style.top = 'calc(100% - ' + adjustedRadius + 'px)';
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
