import axios from "axios"

export const http = axios.create({
  baseURL: "", // vite proxy 쓰면 상대경로 그대로 사용
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
})