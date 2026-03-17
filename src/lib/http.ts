import axios from "axios";
import { getBaseUrl } from "../api/auth";

export const http = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});