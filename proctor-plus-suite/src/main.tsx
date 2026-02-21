import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@/compiler-theme.css";
import "@/developer-theme.css";

createRoot(document.getElementById("root")!).render(<App />);
