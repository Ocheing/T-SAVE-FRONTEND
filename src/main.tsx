import { createRoot } from "react-dom/client";
import "./lib/fontawesome"; // Register FA icons before anything renders
import App from "./App.tsx";
import "./index.css";
import "./i18n";

createRoot(document.getElementById("root")!).render(<App />);
