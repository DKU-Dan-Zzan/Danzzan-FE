import axios from "axios";
import { getApiBaseUrl } from "@/api/common/baseUrl";
import { JSON_HEADERS } from "@/api/common/httpConstants";

export const http = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: false,
  headers: { ...JSON_HEADERS },
});
