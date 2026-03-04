import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { OpenAPI } from "@/api/generated";
import { env } from "@/utils/env";

OpenAPI.BASE = env.apiBaseUrl;

createRoot(document.getElementById("root")!).render(<App />);
