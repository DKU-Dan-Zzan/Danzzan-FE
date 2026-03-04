import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { OpenAPI } from "@/ticketing/api/generated";
import { env } from "@/ticketing/utils/env";

OpenAPI.BASE = env.apiBaseUrl;

createRoot(document.getElementById("root")!).render(<App />);
