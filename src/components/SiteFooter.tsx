import { SectionRule } from "./ui/SectionRule";
import { footer } from "../data/site";
import "./SiteFooter.css";

/** Closing band of the page: hairline, copyright, and a link back to the top. */
export function SiteFooter() {
  return (
    <footer className="ftr">
      <div className="container">
        <SectionRule />
        <div className="ftr-row">
          <p className="ftr-copy">{footer.copy}</p>
          <a href="#main" className="ftr-link">
            {footer.linkLabel}
          </a>
        </div>
      </div>
    </footer>
  );
}
