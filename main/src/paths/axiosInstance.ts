import axios from "axios";
import environment from "../constants/envs.js";

const instance = axios.create({
  baseURL: environment.API_URL,
});

export default instance;
