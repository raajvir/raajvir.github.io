import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ResearchList } from "./components/ResearchList";
import { sections } from "./data/site";
import "./index.css";

const researchSection = sections.find((s) => s.id === "research")!;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <main>
      <ResearchList section={researchSection} />
    </main>
  </StrictMode>
);
