import { GetTime } from '../helpers/Helpers';

onmessage = () => {
    setInterval(() => {
        postMessage(GetTime());
    }, 1000);
};