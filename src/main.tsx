import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// The Baity theme: lavender, the app's default.
document.documentElement.classList.add("theme-lavender");

createRoot(document.getElementById("root")!).render(<App />);
