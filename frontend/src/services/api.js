import axios from "axios";

if (!axios.defaults) {
  axios.defaults = {};
}

axios.defaults.baseURL = "http://localhost:5000/api";

export default axios;
