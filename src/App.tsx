import { useState } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { SectionBlock } from "./components/SectionBlock";
import { ProjectGrid } from "./components/ProjectGrid";
import { Credentials } from "./components/Credentials";
import { SkillsMarquee } from "./components/SkillsMarquee";
import { Podium } from "./components/Podium";
import { References } from "./components/References";
import { Contact } from "./components/Contact";
import { SiteFooter } from "./components/SiteFooter";
import { StartLights } from "./components/StartLights";
import { Crosshair } from "./components/ui/Crosshair";
import { ClickSpark } from "./components/ui/ClickSpark";
import { useLitSection } from "./hooks/useLitSection";
import { sections } from "./data/site";
import type { Section } from "./data/site";

/** Each section picks its renderer from the `kind` declared in the data. */
function renderSection(section: Section) {
  switch (section.kind) {
    case "grid":
      return <ProjectGrid key={section.id} section={section} />;
    case "credentials":
      return <Credentials key={section.id} section={section} />;
    default:
      return <SectionBlock key={section.id} section={section} />;
  }
}

export default function App() {
  const [launched, setLaunched] = useState(false);
  useLitSection();

  return (
    <>
      <StartLights onDone={() => setLaunched(true)} />
      <Crosshair />
      <ClickSpark />
      <Header />
      <main id="main">
        <Hero launched={launched} />
        {sections.map(renderSection)}
        <SkillsMarquee />
        <Podium />
        <References />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
