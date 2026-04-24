import environment from "../environment/envs.js";

const Paths = {
  test: environment.API_URL + "/test",
} as const;

export default Paths;