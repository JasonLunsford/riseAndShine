import { useEffect, useRef, useState } from 'react';

import axios from 'axios';
import clsx from 'clsx';

import styles from './App.module.scss';

const instance = axios.create({
  baseURL: 'http://api.openweathermap.org/'
});

const App = () => {
  const SunRef = useRef(null);
  const GuideRef = useRef(null);

  const [radius, setRadius] = useState();
  const [origin, setOrigin] = useState();
  const [sunPath, setSunPath] = useState();

  const [geoData, setGeoData] = useState();
  const [weatherData, setWeatherData] = useState();

  const [time, setTime] = useState();

  useEffect(() => {
    initApp();
    calculateRadius();

    window.addEventListener('resize', reload, false);

    setTime(getCurrentTime());
    const startClock = setInterval(() => {
      setTime(getCurrentTime());
    }, 1000);

    const startWeatherUpdate = setInterval(() => {
      updateWeather();
    }, 3600000);

    return () => {
      window.removeEventListener('resize', reload);
      clearInterval(startClock);
      clearInterval(startWeatherUpdate);
    };
  }, []);

  useEffect(() => {
    if (radius && weatherData) {
      const offset = calculateOffset();

      configureGuide();
      calculateOrigin();
      configureSunPath(offset);
    }
  }, [radius, weatherData]);

  useEffect(() => {
    if (sunPath) {
      startAnimation();
    }
  }, [sunPath]);

  const initApp = async () => {
    const { data:geoApiData } = await instance.get(`geo/1.0/zip?zip=15044,US&appid=${process.env.REACT_APP_OPENWEATHER_KEY}`);
    const { data:weatherApiData } = await instance.get(`data/2.5/weather?lat=${geoApiData.lat}&lon=${geoApiData.lon}&units=imperial&appid=${process.env.REACT_APP_OPENWEATHER_KEY}`);

    setGeoData(geoApiData);
    setWeatherData(weatherApiData);
  };

  const updateWeather = async () => {
    const { data:weatherApiData } = await instance.get(`data/2.5/weather?lat=${geoData.lat}&lon=${geoData.lon}&units=imperial&appid=${process.env.REACT_APP_OPENWEATHER_KEY}`);

    setWeatherData(weatherApiData);
  }

  const calculateOffset = () => {
    const sunrise = new Date(weatherData.sys.sunrise * 1000);
    const sunset = new Date(weatherData.sys.sunset * 1000);
    const now = new Date();

    const daylightHours = Math.abs((sunset - sunrise) / (1000 * 60 * 60));
    const spentDaylightHours = Math.abs((now - sunrise) / (1000 * 60 * 60));

    return Math.PI * (spentDaylightHours / daylightHours);
  };

  const getCurrentTime = () => {
    const now = new Date();

    const rawHours = now.getHours();
    const rawMinutes = now.getMinutes();
    let hours = rawHours, minutes = rawMinutes;

    if (rawHours < 10) {
      hours = '0' + rawHours;
    }

    if (rawMinutes < 10) {
      minutes = '0' + rawMinutes;
    }

    return `${hours}:${minutes}`;
  }

  const getTime = timestamp => {
    const fixTime = value => {
      if (value < 10) {
        return '0' + value;
      }

      return value;
    }

    const adjusted = new Date(timestamp * 1000);

    const rawHours = adjusted.getHours();
    const rawMinutes = adjusted.getMinutes();
    let hours = fixTime(rawHours), minutes = fixTime(rawMinutes);
    
    return `${hours}:${minutes}`;
  }

  const reload = () => {
    document.location.reload();
    calculateRadius();
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
    pathData.animationTime = 86400000; // 24 hours in milliseconds
    pathData.vector = (pathData.startAngle - pathData.endAngle) / pathData.animationTime;
    pathData.start = false;
    pathData.curAngle = pathData.startAngle;

    setSunPath(pathData);
  };

  const startAnimation = () => {
    if (!sunPath.start) {
      sunPath.start = Date.now();
      sunPath.now = Date.now();
    }

    const elapsed = Date.now() - sunPath.now;
    sunPath.now = Date.now();
    sunPath.curAngle += elapsed * sunPath.vector; 
 
    let x = radius * Math.cos(sunPath.curAngle);
    let y = radius * Math.sin(sunPath.curAngle);

    SunRef.current.style.left = (origin.x + x) + 'px';
    SunRef.current.style.top = (origin.y + y) + 'px';

    requestAnimationFrame(startAnimation);
  };

  const getWeatherIcon = () => {
    const condition = weatherData.weather[0].main;

    switch (condition) {
      case 'Clear':
        return styles.Clear;
      case 'Clouds':
        return styles.Clouds;
      case 'Thunderstorm':
        return styles.Thunderstorm;
      case 'Drizzle':
        return styles.Drizzle;
      case 'Rain':
        return styles.Rain;
      case 'Snow':
        return styles.Snow;
      case 'Fog':
        return styles.Fog;
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
            {getTime(weatherData.sys.sunrise)} | {getTime(weatherData.sys.sunset)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
