// 역할: 공통 HTTP 요청 래퍼와 에러 변환 로직을 제공한다.

import axios from "axios";
import { getApiBaseUrl } from "@/api/common/baseUrl";
import { JSON_HEADERS } from "@/api/common/httpConstants";

export const http = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: false,
  headers: { ...JSON_HEADERS },
});
