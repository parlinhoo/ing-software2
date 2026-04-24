import axios from 'axios';
import Paths from './paths/paths.js';

const req = async () => {
    console.log("enviando request");
    const response = await axios.get(Paths.test);
    console.log(`recibido: ${response.data}`);
    return response.data;
}

req();
req();
req();