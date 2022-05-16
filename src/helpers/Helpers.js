import axios from 'axios';

const _calculateArcDelta = (curRadius, shiftRatio) => {
    return ((2 * Math.PI * curRadius) * shiftRatio) / 2;
}

const _calculateDaylightHours = data => {
    const sunrise = new Date(data.sys.sunrise * 1000);
    const sunset = new Date(data.sys.sunset * 1000);

    return Math.abs((sunset - sunrise) / (1000 * 60 * 60));
};

const _calculateDeltaAngle = (curRadius, arcDelta) => {
    return arcDelta / curRadius;
}

const _calculateShiftRatio = daylightHours => {
    return (daylightHours - 12) / 24;
}

const _calculateSpentHours = data => {
    const sunrise = new Date(data.sys.sunrise * 1000);
    const now = new Date();

    return Math.abs((now - sunrise) / (1000 * 60 * 60));
}

const _calculateCurrentAngleDelta = (data, curRadius) => {
    const daylightHours = _calculateDaylightHours(data);

    // percent change of daylight from the base state of 12 hr / day.
    const shiftRatio = _calculateShiftRatio(daylightHours);

    // Arc change in pixels, divided by 2 to represent both sides of the
    // circle
    const arcDelta = _calculateArcDelta(curRadius, shiftRatio);

    // return calculated angle in radians
    return _calculateDeltaAngle(curRadius, arcDelta);
};

const _instance = axios.create({
  baseURL: 'http://api.openweathermap.org/'
});

const _fixTime = value => {
    if (value < 10) {
        return '0' + value;
    }

    return value;
};

const GetTime = timestamp => {
    let time;

    if (timestamp) {
        time = new Date(timestamp * 1000);
    } else {
        time = new Date();
    }

    const rawHours = time.getHours();
    const rawMinutes = time.getMinutes();
    let hours = _fixTime(rawHours), minutes = _fixTime(rawMinutes);

    return `${hours}:${minutes}`;
};

const GetGeoData = async () => {
    const { data } = await _instance.get(`geo/1.0/zip?zip=15044,US&appid=${process.env.REACT_APP_OPENWEATHER_KEY}`);

    return data;
};

const GetWeatherData = async geoData => {
    const { data } = await _instance.get(`data/2.5/weather?lat=${geoData.lat}&lon=${geoData.lon}&units=imperial&appid=${process.env.REACT_APP_OPENWEATHER_KEY}`);

    return data;
};

const ConditionMap = (id = 0, styles) => {
    return ({
        'clear': styles.Clear,
        'clouds': styles.Clouds,
        'thunderstorm': styles.Thunderstorm,
        'tornado': styles.Tornado,
        'drizzle': styles.Drizzle,
        'mist': styles.Drizzle,
        'rain': styles.Rain,
        'snow': (id === 600) ? styles.LightSnow : styles.Snow,
        'fog': styles.Fog,
        'windy': styles.Windy,
        'default': styles.Default
    });
}

const CalculateNearestHour = () => {
    const now = new Date();
    const next = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    next.setHours(currentHour + Math.round(currentMinutes / 60));
    next.setMinutes(0, 0, 0);

    return Math.abs(next - now);
}

const CalculateOffset = data => {
    const daylightHours = _calculateDaylightHours(data);
    const spentDaylightHours = _calculateSpentHours(data);

    if (spentDaylightHours <= 0 || spentDaylightHours > daylightHours) {
        return 0;
    }

    return Math.PI * (spentDaylightHours / daylightHours);
};

const CalculateOrigin = (guideDimensions, iconDimensions) => {
    const adjustedX = (guideDimensions.left + guideDimensions.width / 2) - (iconDimensions.left + iconDimensions.right / 2);
    const adjustedY = (guideDimensions.top + guideDimensions.height / 2) - (iconDimensions.top + iconDimensions.bottom / 2);

    return {
        'x': adjustedX,
        'y': adjustedY
    };
};

const CalculateRadius = () => {
    return window.innerWidth * .3;
};

const CalculateYShift = (data, curRadius) => {
    const angle = _calculateCurrentAngleDelta(data, curRadius);

    // Calculate length of line crossing the circle at two points
    return 2 * curRadius * Math.sin(angle / 2);
};

const CalculateCurrentAngle = radius => {
    const d = new Date(), e = new Date(d);
    const msSinceMidnight = e - d.setHours(0,0,0,0);
    const ratio = msSinceMidnight / 86400000;

    // Full circle's worth of radius * clock ratio, shifted down to
    // "bottom" of the circle (where midnight is).
    return ((Math.PI * 2) * ratio) + (Math.PI / 2);
}

const CalculateOneHourAheadAngle = radius => {
    const d = new Date(), e = new Date(d);
    const msSinceMidnight = (e - d.setHours(0,0,0,0)) + 3600000;
    const ratio = msSinceMidnight / 86400000;

    return ((Math.PI * 2) * ratio) + (Math.PI / 2);
}

export {
    CalculateOneHourAheadAngle,
    CalculateCurrentAngle,
    CalculateNearestHour,
    CalculateOffset,
    CalculateOrigin,
    CalculateRadius,
    CalculateYShift,
    ConditionMap,
    GetTime,
    GetGeoData,
    GetWeatherData
}