import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { OpenAPI } from "@/api/ticketing/generated";
import { env } from "@/utils/ticketing/env";

OpenAPI.BASE = env.apiBaseUrl;

createRoot(document.getElementById("root")!).render(<App />);
