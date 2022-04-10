const FixTime = value => {
    if (value < 10) {
        return '0' + value;
    }

    return value;
};

const GetCurrentTime = () => {
    const now = new Date();

    const rawHours = now.getHours();
    const rawMinutes = now.getMinutes();
    let hours = FixTime(rawHours), minutes = FixTime(rawMinutes);

    return `${hours}:${minutes}`;
};

export {
    FixTime,
    GetCurrentTime
}