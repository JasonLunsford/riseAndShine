import { GetCurrentTime } from '../helpers/Helpers';

onmessage = (event) => {
    setInterval(() => {
        postMessage(GetCurrentTime());
    }, 1000);
};