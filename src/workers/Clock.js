import { GetCurrentTime } from '../helpers/Helpers';

onmessage = () => {
    setInterval(() => {
        postMessage(GetCurrentTime());
    }, 1000);
};