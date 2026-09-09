import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { SkewHeading } from "./ui/SkewHeading";
import "./Contact.css";
import { contact } from "../data/site";
import { Reveal } from "./ui/Reveal";
import { SectionRule } from "./ui/SectionRule";
import { Icon, type IconName } from "./ui/Icon";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

/** True on devices with an accurate pointer (mouse/trackpad), false on touch. */
function useFinePointer(): boolean {
  const [fine, setFine] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const onChange = () => setFine(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return fine;
}

type CopyableProps = {
  value: string;
  copyText: string;
  href: string;
  onCopied: (message: string) => void;
  reducedMotion: boolean;
};

/**
 * "PIT RADIO" — a phone/email value that copies itself to the clipboard on
 * click for desktop pointers, while touch devices just follow the tel:/
 * mailto: link as normal.
 */
function CopyableLink({ value, copyText, href, onCopied, reducedMotion }: CopyableProps) {
  const isFinePointer = useFinePointer();
  const [copied, setCopied] = useState(false);
  const hideTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!isFinePointer) return;
    event.preventDefault();
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      onCopied(`${value} copied to clipboard`);
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.location.href = href;
    }
  }

  return (
    <span className="contact-copyable">
      <a href={href} className="contact-value contact-value-link" onClick={handleClick}>
        {value}
      </a>
      <span
        className={`contact-copied-badge${copied ? (reducedMotion ? " is-static" : " is-visible") : ""}`}
        aria-hidden="true"
      >
        Copied
      </span>
    </span>
  );
}

type ClockReading = { chicago: string; bangalore: string };

function readClock(): ClockReading | null {
  try {
    const format = (timeZone: string) =>
      new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date());
    return { chicago: format("America/Chicago"), bangalore: format("Asia/Kolkata") };
  } catch {
    return null;
  }
}

/** "PADDOCK CLOCK" — live local time for Chicago (school) and Bangalore (home). */
function PaddockClock({ reducedMotion }: { reducedMotion: boolean }) {
  const [reading, setReading] = useState<ClockReading | null>(() => readClock());

  useEffect(() => {
    const id = window.setInterval(() => setReading(readClock()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!reading) return null;

  return (
    <div
      className="contact-clock"
      aria-label={`Local time — Chicago ${reading.chicago}, Bangalore ${reading.bangalore}`}
    >
      <span className="contact-clock-rule" aria-hidden="true" />
      <div className="contact-clock-col">
        <div className="contact-clock-row">
          <span className="contact-clock-label">Chicago</span>
          <span
            className={`contact-clock-time${reducedMotion ? "" : " contact-clock-time--pulse"}`}
            aria-hidden="true"
          >
            {reading.chicago}
          </span>
        </div>
        <div className="contact-clock-row">
          <span className="contact-clock-label">Bangalore</span>
          <span
            className={`contact-clock-time${reducedMotion ? "" : " contact-clock-time--pulse"}`}
            aria-hidden="true"
          >
            {reading.bangalore}
          </span>
        </div>
      </div>
    </div>
  );
}

export function Contact() {
  const reducedMotion = usePrefersReducedMotion();
  const [liveMessage, setLiveMessage] = useState("");
  const liveResetTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(liveResetTimer.current), []);

  function announce(message: string) {
    // Clear then re-set so repeated copies of the same value still announce.
    setLiveMessage("");
    window.clearTimeout(liveResetTimer.current);
    liveResetTimer.current = window.setTimeout(() => setLiveMessage(message), 50);
  }

  return (
    <section id="contact" className="contact" aria-labelledby="contact-heading">
      <div className="container">
        <SectionRule />
        <SkewHeading id="contact-heading" className="section-label contact-label">
          {contact.label}
        </SkewHeading>

        <div className="contact-grid">
          <div className="contact-column">
            <Reveal index={0}>
              <div className="contact-block">
                <h3 className="contact-heading">Phone</h3>
                <div className="contact-values">
                  <CopyableLink
                    value={contact.phone}
                    copyText={contact.phone.replace(/\s+/g, "")}
                    href={contact.phoneHref}
                    onCopied={announce}
                    reducedMotion={reducedMotion}
                  />
                </div>
              </div>
            </Reveal>

            <Reveal index={1} className="contact-block contact-block-email">
              <h3 className="contact-heading">Email</h3>
              <div className="contact-values">
                <CopyableLink
                  value={contact.email}
                  copyText={contact.email}
                  href={`mailto:${contact.email}`}
                  onCopied={announce}
                  reducedMotion={reducedMotion}
                />
              </div>
            </Reveal>

            <Reveal index={2} className="contact-block contact-block-location">
              <h3 className="contact-heading">Location</h3>
              <div className="contact-values">
                <span className="contact-value">{contact.location}</span>
              </div>
            </Reveal>

            <Reveal index={3} as="div" className="contact-socials-wrap">
              <ul className="contact-socials" aria-label="Social media">
                {contact.socials.map((social) => (
                  <li key={social.id}>
                    <a
                      className="contact-social-link"
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                    >
                      <span className="contact-social-ring" aria-hidden="true" />
                      <Icon name={social.id as IconName} size={25} />
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <PaddockClock reducedMotion={reducedMotion} />
        </div>

        <div aria-live="polite" className="sr-only">
          {liveMessage}
        </div>
      </div>
    </section>
  );
}
