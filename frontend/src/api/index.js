import axios from "axios";
import { useMemo } from "react";

const useAxios = () => {
  const token = localStorage.getItem("token");
  const localApiPort = process.env.REACT_APP_API_PORT || "5000";
  const localApiUrl = `${window.location.protocol}//${window.location.hostname}:${localApiPort}/api`;
  const baseURL = process.env.NODE_ENV === "development"
    ? localApiUrl
    : process.env.REACT_APP_URL;

  const Axios = useMemo(() => {
    const instance = axios.create({
      baseURL,
      headers: { "x-access-token": token },
    });

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        if (status === 401) {
          localStorage.clear();
          window.location = "/";
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [baseURL, token]);

  return Axios;
};

export default useAxios;
