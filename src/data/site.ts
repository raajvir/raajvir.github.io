/**
 * All site content, transcribed from Raajvir Vijay's resume.
 *
 * Each section carries a `kind` so the page can render it with a treatment
 * suited to its material rather than one uniform CV list.
 */

export type Stat = {
  /** Numeric portion, animated with a count-up. */
  value: number;
  /** Rendered before the number, e.g. "$". */
  prefix?: string;
  /** Rendered after the number, e.g. "K", "+", "%". */
  suffix?: string;
  label: string;
};

export type Entry = {
  id: string;
  title: string;
  /** Organisation or subtitle line. */
  org?: string;
  role?: string;
  location?: string;
  date: string;
  bullets?: string[];
  /** Plain-language answer to "what is this?", read before the bullets. */
  summary?: string;
  /** Pulled out as an oversized quote — the single best line of the entry. */
  pullQuote?: string;
  /** Count-up tiles rendered above the bullets. */
  stats?: Stat[];
  /** Marks a genuine "P1" result; renders in F1 fastest-lap purple. */
  fastest?: boolean;
  href?: string;
  tags?: string[];
  /** Background art revealed under the cursor spotlight. */
  image?: string;
  /** Company mark shown beside (or instead of) the heading. */
  logo?: string;
  /** Institution behind the work, shown as an icon-only mark. */
  institution?: { name: string; logo?: string };
  /** Further reading beyond the main `href`. */
  extraLinks?: { label: string; href: string }[];
};

export type SectionKind =
  | "timing-tower"   // the classic entry list, F1 timing-tower styling
  | "feature"        // a single headline entry, given a panel of its own
  | "papers"         // research, laid out like a citation list
  | "media"          // podcast + writing, one panel each
  | "grid"           // card grid, filterable
  | "credentials"    // education / super-licence cards
  | "skills"         // marquee chip rows
  | "podium";        // awards, arranged P1/P2/P3

export type Section = {
  id: string;
  label: string;
  kind: SectionKind;
  /** Short framing line under the label. */
  blurb?: string;
  entries: Entry[];
};

export const profile = {
  name: "Raajvir Vijay",
  tagline: "Operations research, applied to motorsport.",
  lede:
    "Second-year Industrial Engineering & Management Sciences student at Northwestern and Operations Lead of Northwestern Formula Racing. I work at the intersection of operations research and motorsport — formalising constrained-resource problems, estimating them honestly, and turning them into decisions.",
  location: "Evanston, IL, USA",
  email: "raajvir@u.northwestern.edu",
  phone: "(773) 942-1063",
  phoneHref: "tel:+17739421063",
  linkedinLabel: "linkedin.com/in/raajvir-vijay",
  linkedinHref: "https://www.linkedin.com/in/raajvir-vijay",
  cv: "/assets/raajvir-vijay-cv.pdf",
  /** Rotating status line in the hero. */
  status: [
    "OPERATIONS LEAD — NORTHWESTERN FORMULA RACING",
    "RUNNING AN EMPIRICAL STUDY OF F1'S AERO TESTING QUOTA",
    "FOUNDER & CEO — SOMNIA",
  ],
};

export const heroSocials = [
  { id: "youtube", label: "YouTube", href: "https://www.youtube.com/@vraajvir" },
  { id: "medium", label: "Medium", href: "https://medium.com/@vijay.raajvir" },
  {
    id: "spotify",
    label: "Spotify",
    href: "https://open.spotify.com/show/5TLr4ppyyc6ubxxLTt861A?si=9a65c4266bc64cf0",
  },
] as const;

export const nav = [
  { label: "Work", href: "#work" },
  { label: "Projects", href: "#projects" },
  { label: "Research", href: "#research" },
  { label: "Journalism", href: "#journalism" },
  { label: "Contact", href: "#contact" },
] as const;

export const sections: Section[] = [
  {
    id: "work",
    label: "COMPANY WORK",
    kind: "timing-tower",
    blurb: "Paid roles, in industry.",
    entries: [
      {
        id: "nfr",
        logo: "/assets/logos/nfr.png",
        summary:
          "Northwestern's student motorsport team — we design, build and race a single-seater car every season. I run the operations side of it.",
        href: "https://www.northwesternformularacing.com/",
        image: "/assets/activities/nfr.jpg",
        title: "Northwestern Formula Racing",
        role: "Operations Lead",
        date: "2026 - Present",
        stats: [
          { value: 120, label: "person build programme" },
          { value: 6, label: "subsystems" },
          { value: 50000, prefix: "$", label: "operating budget" },
        ],
        bullets: [
          "Run the 120-person build programme across 6 subsystems on a $50,000 operating budget.",
          "Restructured project tracking into Jira — milestones, dependencies, visible schedule slip.",
        ],
      },
      {
        id: "kaizen",
        logo: "/assets/logos/kaizen.svg",
        summary:
          "An analytics consultancy. I built the pricing software that decides what a second-hand item should sell for, across a national US thrift chain.",
        href: "https://www.kaizenanalytix.com/",
        image: "/assets/activities/kaizen.jpg",
        title: "Kaizen Analytix",
        role: "Data Science & Consulting Intern",
        location: "Atlanta, Georgia",
        date: "Summer 2026",
        stats: [
          { value: 384, label: "stores clustered" },
          { value: 6, label: "climate zones" },
        ],
        bullets: [
          "Built ThriftIQ, a dynamic pricing algorithm for US thrift retailer Savers'; featured on CNBC.",
          "Seasonality model clustering 384 stores into 6 climate zones for demand-based pricing.",
          "Led enterprise adoption of agentic AI tooling across the Data Science department.",
        ],
      },
      {
        id: "isvaryam",
        logo: "/assets/logos/isvaryam.png",
        summary:
          "A cold-press cooking oil producer. I worked out how to get more oil out of the same seeds by changing the timing of the production run.",
        href: "https://www.isvaryam.com/",
        image: "/assets/activities/isvaryam.jpg",
        title: "Isvaryam Organic Cooking Oils",
        role: "Operations Intern",
        location: "Coimbatore, India",
        date: "Summer 2025",
        stats: [{ value: 16, suffix: "%", label: "seed oil yield gain" }],
        bullets: [
          "Applied a Taguchi design-of-experiments model to optimise production cycle timing.",
          "Presented to leadership; implementation delivered a 16% improvement in seed oil yield.",
        ],
      },
      {
        id: "toyota",
        logo: "/assets/logos/toyota.png",
        summary:
          "A Toyota dealership. I sold new cars to customers on the showroom floor.",
        href: "https://anaamalaistoyota.com/",
        image: "/assets/activities/toyota.jpg",
        title: "Anaamalais Toyota",
        role: "Salesman",
        location: "Coimbatore, India",
        date: "Summer 2024",
        stats: [{ value: 200, suffix: "+", label: "customers served" }],
        bullets: [
          "Supported showroom sales with outreach, test drives and walk-throughs for 200+ customers.",
          "Managed lead pipeline in CRM; followed up on inquiries and improved conversion tracking.",
        ],
      },
      {
        id: "polymarket",
        logo: "/assets/logos/polymarket.svg",
        summary:
          "A prediction market where people bet on real-world events. I researched where new users get stuck and redesigned that flow.",
        href: "https://polymarket.com/",
        image: "/assets/activities/polymarket.jpg",
        title: "Polymarket",
        org: "via Ascend Consulting Group",
        role: "Analyst",
        date: "Summer 2026",
        tags: ["Consulting"],
        bullets: [
          "User research and UX wireframe prototyping; proposed activation-flow improvements.",
        ],
      },
    ],
  },
  {
    id: "startup",
    label: "STARTUP",
    kind: "feature",
    blurb: "Building something people use.",
    entries: [
      {
        id: "somnia",
        summary:
          "A sleep app for people with insomnia. A wristband reads your heartbeat and the app adapts in real time to help you fall asleep.",
        href: "https://projectsomnia.com",
        title: "Somnia",
        org: "Sleep-tech Startup — Northwestern Garage",
        role: "Founder & CEO",
        date: "2023 - Present",
        tags: ["Startup"],
        fastest: true,
        stats: [
          { value: 1000, suffix: "+", label: "downloads" },
          { value: 1200, suffix: "+", label: "youth reached" },
          { value: 2.5, suffix: "x", label: "faster to fall asleep" },
        ],
        bullets: [
          "Sleep-tech app with patent-pending biosensor wristband; $12K pre-seed funding; 1,000+ users.",
          "TEDx speaker on sleep health; led a 14-person team reaching 1,200+ youth across 5 countries.",
        ],
      },
    ],
  },
  {
    id: "projects",
    label: "INDEPENDENT PROJECTS",
    kind: "grid",
    blurb: "Questions I picked up on my own.",
    entries: [
      {
        id: "f1-atr",
        summary:
          "Formula 1 caps how much aerodynamic testing each team is allowed. This study asks whether that cap actually changes who ends up fastest.",
        image: "/assets/activities/f1-atr.svg",
        title: "f1-atr",
        role: "Independent Research — F1 Aerodynamic Testing Restrictions",
        date: "2026",
        stats: [
          { value: 127, label: "qualifying sessions" },
          { value: 61, label: "team-seasons" },
          { value: 45, label: "near-tie pairs" },
        ],
        pullQuote:
          "Found the naive design unidentifiable, and reported the effect as undetectable rather than overstating it.",
        bullets: [
          "Built a reproducible Python pipeline over 127 qualifying sessions and 61 team-seasons.",
          "Validated a lap-time pace metric against championship order at Spearman 0.89-0.98.",
          "Built a near-tie quasi-experiment over 45 adjacent pairs to recover identification.",
        ],
      },
      {
        id: "airline",
        summary:
          "Working out the most profitable way to split a long-haul cabin between business, premium economy and economy seats.",
        image: "/assets/activities/airline.svg",
        title: "Airline Cabin Revenue Optimisation",
        org: "ANA Boeing 787-9, Tokyo-Los Angeles",
        role: "Research Author",
        date: "2024",
        tags: ["Research"],
        pullQuote:
          "The optimum gained INR 258,000 per flight (2.1%) — showing the layout was already near-optimal.",
        bullets: [
          "Modelled optimal seat allocation across business, premium economy and economy using per-class price elasticity of demand and quadratic revenue functions.",
          "Solved by partial differentiation under a fixed-row constraint, then tested integer configurations.",
        ],
      },
],
  },
  {
    id: "research",
    label: "RESEARCH",
    kind: "papers",
    blurb: "Supervised and published work.",
    entries: [
      {
        id: "netflix",
        extraLinks: [
          {
            label: "CCIR Student Spotlight interview",
            href: "https://www.youtube.com/watch?v=Lzez24Y-KZk",
          },
        ],
        institution: { name: "University of Cambridge", logo: "/assets/logos/cambridge.svg" },
        summary:
          "Testing whether Netflix's share price actually moves when it releases new shows, or whether that link is imagined.",
        href: "https://www.researchgate.net/publication/388502227_How_do_Media_Releases_Affect_Netflix's_Stock",
        image: "/assets/activities/netflix.svg",
        title: "Netflix Releases & Stock Price Volatility",
        org: "University of Cambridge",
        role: "Research Author",
        date: "2022 - 2023",
        tags: ["Research", "Published"],
        fastest: true,
        bullets: [
          "Econometric analysis under Prof. Julius Vainora (University of Cambridge), applying OLS regression in Python to test the relationship between content release timing and stock volatility.",
          "25-page paper published in the International Journal of Economics and Management Sciences.",
        ],
      },
      {
        id: "alphabeta",
        institution: { name: "Alpha Beta Investments", logo: "/assets/logos/alphabeta.png" },
        summary:
          "A machine-learning model that estimates how risky an investment portfolio is before you put money into it.",
        image: "/assets/activities/alphabeta.svg",
        title: "Financial Analysis",
        org: "Alpha Beta Investments, New York",
        role: "Student Researcher under Dr Joseph Shamshian through VeritasAI",
        date: "2023",
        tags: ["Research", "Finance"],
        stats: [{ value: 78, suffix: "%", label: "model accuracy" }],
        bullets: [
          "Built an ML investment risk assessment model in an international team of five.",
          "OLS model with efficient frontier, CAPM and Monte Carlo simulation; 78% accuracy.",
        ],
      },
      {
        id: "sura",
        institution: { name: "Northwestern Institute for Policy Research", logo: "/assets/logos/northwestern.svg" },
        summary:
          "A five-year study on how students see themselves and which opportunities they take. I built the data models underneath it.",
        href: "https://adamlab.sesp.northwestern.edu/project-overview/",
        image: "/assets/activities/sura.svg",
        title: "Biology, Identity, & Opportunity Study",
        org: "Northwestern Institute for Policy Research",
        role: "Research Assistant",
        date: "Summer 2026",
        tags: ["Research"],
        stats: [{ value: 6, prefix: "$", suffix: "k", label: "grant" }],
        bullets: [
          "Built Python data models to clean and structure datasets for a five-year behavioural study.",
        ],
      },
          {
        id: "light-sleep",
        href: "https://ijip.in/articles/light-guided-sleep/",
        tags: ["Published"],
        institution: {
          name: "International Journal of Indian Psychology",
          logo: "/assets/logos/ijip.png",
        },
        title: "Optimizing Light-Guided Sleep Aids",
        role: "Author",
        date: "2023-24",
        summary:
          "The research behind Somnia: testing which combinations of light colour, brightness and background sound actually get people to sleep faster.",
        bullets: [
          "Investigated the combined effects of light hue, brightness, and soundscapes on sleep latency and heart rate variability, identifying optimal conditions for relaxation and improved sleep quality.",
        ],
      },
],
  },
  {
    id: "education",
    label: "EDUCATION",
    kind: "credentials",
    entries: [
      {
        id: "northwestern",
        image: "/assets/activities/northwestern.jpg",
        href: "https://www.mccormick.northwestern.edu/",
        title: "Northwestern University",
        org: "McCormick School of Engineering",
        role: "BSc Industrial Engineering & Management Sciences",
        location: "Evanston, IL",
        date: "Expected Class of '29",
        stats: [{ value: 3.8, label: "GPA" }],
        bullets: ["Coursework: Database Management, Probability, Finance for Engineers"],
      },
      {
        id: "tisb",
        image: "/assets/activities/tisb.jpg",
        href: "https://tisb.org/",
        title: "The International School Bangalore",
        role: "International Baccalaureate Diploma",
        location: "Bengaluru, India",
        date: "Class of '25",
        bullets: ["IB Score: 41/45", "IGCSE: 8A* 1A"],
      },
    ],
  },
  {
    id: "journalism",
    label: "JOURNALISM",
    kind: "media",
    blurb: "Talking and writing about the sport.",
    entries: [
      {
        id: "six-cylinders",
        summary:
          "A weekly show where the two of us break down the money and strategy behind Formula 1, rather than just the racing.",
        image: "/assets/activities/six-cylinders.jpg",
        title: "Six Cylinders F1 Podcast",
        role: "Co-Host",
        date: "2024 - Present",
        href: "https://open.spotify.com/show/5TLr4ppyyc6ubxxLTt861A?si=9a65c4266bc64cf0",
        stats: [
          { value: 8, label: "episodes" },
          { value: 100, suffix: "+", label: "viewers per episode" },
        ],
        bullets: [
          "Weekly analysis on Formula 1 economics, commercial strategy and regulation.",
          "8 episodes across the 2024 season.",
        ],
      },
      {
        id: "medium",
        title: "Medium",
        role: "Automotive design writer",
        date: "2023 - Present",
        href: "https://medium.com/@vijay.raajvir",
        summary:
          "Design critiques of cars \u2014 redrawing the ones I think got it wrong, and unpacking liveries like Ferrari\u2019s 2026 challenger.",
        bullets: [
          "Recent pieces: Fixing the G82 M4, The Ferrari F1-26 Livery Story, 2027 BMW 7 Series design review, Fixing the Porsche 911 GT3.",
        ],
      },
    ],
  },
];

export const skills = {
  id: "skills",
  label: "TECHNICAL SKILLS",
  groups: [
    {
      id: "tools",
      label: "Tools",
      items: ["Python", "pandas", "scikit-learn", "statsmodels", "MATLAB", "Power BI", "Excel (VBA)", "Jira"],
    },
    {
      id: "methods",
      label: "Methods",
      items: [
        "OLS & panel regression",
        "Fixed effects",
        "Quasi-experimental design",
        "Power analysis",
        "Multiple-comparison correction",
        "Constrained optimisation",
        "Monte Carlo simulation",
        "Efficient frontier & CAPM",
        "Price elasticity of demand",
        "Design of experiments (Taguchi)",
        "Dynamic pricing",
      ],
    },
    { id: "software", label: "Software", items: ["Swift", "Java", "React Native", "HTML/CSS/JS"] },
    { id: "languages", label: "Languages", items: ["English", "French", "Hindi", "Tamil", "Kannada"] },
  ],
};

export type Award = {
  id: string;
  title: string;
  detail: string;
  date: string;
  /** Finishing position, drives the podium layout. 0 = outside the podium. */
  position: 1 | 2 | 3 | 0;
};

export const awards = {
  id: "awards",
  label: "AWARDS & RECOGNITION",
  entries: [
    {
      id: "iifm",
      title: "IIFM Global Economics Olympiad",
      detail: "Rank 1",
      date: "2024",
      position: 1,
    },
    {
      id: "finance-olympiad",
      title: "International Finance Olympiad",
      detail: "Rank 2",
      date: "2024",
      position: 2,
    },
    {
      id: "blue-ocean",
      title: "Blue Ocean Entrepreneurship Challenge",
      detail: "3rd in Asia + Oceania — Top 10 global",
      date: "2024",
      position: 3,
    },
    {
      id: "uber",
      title: "UBER Global Hackathon",
      detail: "Regional Finalist",
      date: "2022",
      position: 0,
    },
  ] as Award[],
};

export const contact = {
  label: "CONTACT",
  email: "raajvir@u.northwestern.edu",
  phone: "(773) 942-1063",
  phoneHref: "tel:+17739421063",
  location: "Evanston, IL, USA",
  socials: [
    { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/raajvir-vijay" },
    { id: "instagram", label: "Instagram", href: "https://www.instagram.com/raajvir.vijay/" },
  ],
};

/**
 * Referees are named without contact details on purpose — their email
 * addresses are on the CV PDF, which is handed over deliberately, rather
 * than published on a page that scrapers crawl.
 */
export const references = {
  label: "REFERENCES",
  note: "Contact details on request, or on the CV.",
  entries: [
    { id: "puppa", name: "Andreas Puppa", role: "VP, Data Science, Kaizen Analytix", relation: "Former Employer" },
    { id: "gatchell", name: "Prof. David Gatchell", role: "Director, Manufacturing & Design Engineering, Northwestern", relation: "Professor" },
    { id: "vainora", name: "Prof. Julius Vainora", role: "Associate Professor of Economics, University of Cambridge", relation: "Research Supervisor" },
  ],
};

export const footer = {
  copy: "© 2026 Raajvir Vijay. Powered by Mercedes-AMG HPP (jk :D)",
  linkLabel: "Read about me all over again!",
};
