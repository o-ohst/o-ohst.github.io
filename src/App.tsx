import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import {
  ArrowDown,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Copy,
  Github,
  Linkedin,
  Menu,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import {
  EDUCATION,
  PROFILE,
  PROJECTS,
  SKILL_GROUPS as SKILLS,
  SOCIALS,
  WORK,
  type Project,
} from "./data/content";
import Landscape from "./components/Landscape";
import IconGlobe from "./components/IconGlobe";
import OfficeHero from "./components/OfficeHero";
import { TechIcon } from "./components/TechIcon";

const NAV = [
  ["work", "Experience"],
  ["about", "About"],
  ["projects", "Projects"],
] as const;
const FEATURED = [
  "Convosense",
  "MCP Charts",
];
const ORDERED = [...PROJECTS].sort(
  (a, b) =>
    (FEATURED.indexOf(a.title) < 0 ? 99 : FEATURED.indexOf(a.title)) -
    (FEATURED.indexOf(b.title) < 0 ? 99 : FEATURED.indexOf(b.title)),
);
const LABELS = {
  Proprietary: "Product",
  Personal: "Experiment",
  "Open Source": "Open source",
};

function useMotionPreference() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

function LocalTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Singapore",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date()),
      );
    tick();
    const timer = setInterval(tick, 30000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span>
      SG {time} <span className="time-zone">/ UTC+8</span>
    </span>
  );
}

function SectionLabel({ number }: { number: string }) {
  return (
    <div className="section-label" aria-hidden="true">
      <span className="crosshair" aria-hidden="true" />
      <span>{number}</span>
    </div>
  );
}

function Navigation() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("top");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-15% 0px -65% 0px", threshold: 0 },
    );
    document
      .querySelectorAll("main > section[id]")
      .forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        document.getElementById("menu-toggle")?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  return (
    <header className="site-header">
      <a className="wordmark" href="#top" onClick={() => setOpen(false)}>
        <span>
          SITONG HAO<span className="wordmark-sub">SOFTWARE ENGINEER</span>
        </span>
      </a>
      <nav className="desktop-nav" aria-label="Main navigation">
        {NAV.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={active === id ? "location" : undefined}
          >
            {label}
          </a>
        ))}
      </nav>
      <a className="header-contact" href="#contact">
        Contact <ArrowUpRight size={15} />
      </a>
      <button
        id="menu-toggle"
        className="menu-toggle icon-button"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      {open && (
        <nav
          id="mobile-nav"
          className="mobile-nav"
          aria-label="Mobile navigation"
        >
          {[...NAV, ["contact", "Contact"]].map(([id, label], i) => (
            <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>
              <span>0{i + 1}</span>
              {label}
              <ArrowUpRight size={22} />
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

function Hero({ reduced }: { reduced: boolean }) {
  return (
    <section id="top" className="hero">
      <div className="hero-atmosphere" aria-hidden="true" />
      <div className="hero-topline">
        <span>
          <span className="status-dot" /> Singapore
        </span>
        <LocalTime />
      </div>
      <div className="hero-copy">
        <p className="eyebrow hero-eyebrow">
          Software engineer · Full-stack &amp; distributed systems
        </p>
        <h1>
          Sitong <em>Hao.</em>
        </h1>
        <p className="hero-description">
          AI-powered products, the backends behind them, and the apps on top.
        </p>
        <a className="pill-button light-button" href="#projects">
          View projects <ArrowDownRight size={20} />
        </a>
        <div className="hero-role">
          <img
            className="hero-company-logo"
            src="/qanvast-horizontal.svg"
            alt=""
            width="80"
            height="40"
          />
          <span>
            <strong>Software Engineer</strong>
            <br />
            at{" "}
            <a href="https://qanvast.com" target="_blank" rel="noreferrer">
              Qanvast <ArrowUpRight size={12} />
            </a>
          </span>
        </div>
      </div>
      <OfficeHero reduced={reduced} />
      <div className="hero-bottom">
        <a href="#work">
          Experience <ArrowDown size={14} />
        </a>
      </div>
    </section>
  );
}

function ProjectDialog({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!project || !dialog) return;
    const focused = document.activeElement as HTMLElement | null;
    dialog.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previous;
      focused?.focus({ preventScroll: true });
    };
  }, [project]);
  return (
    <dialog
      ref={ref}
      className="project-dialog"
      aria-labelledby="project-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {project && (
        <div className="dialog-inner">
          <div className="dialog-topline">
            <span className="eyebrow">{LABELS[project.category]}</span>
            <button
              className="icon-button"
              autoFocus
              aria-label="Close project details"
              onClick={onClose}
            >
              <X size={22} />
            </button>
          </div>
          <img
            src={project.image}
            srcSet={`${project.image?.replace(".jpg", "-640.webp")} 640w, ${project.image?.replace(".jpg", "-1100.webp")} 1100w`}
            sizes="(max-width: 850px) 95vw, 850px"
            alt={`${project.title} interface`}
            width="1440"
            height="900"
          />
          <div className="dialog-content">
            <h2 id="project-title">{project.title}</h2>
            <p className="dialog-description">{project.description}</p>
            <div className="tech-tags">
              {project.tech.map((tech) => (
                <span key={tech}>
                  <TechIcon name={tech} />
                  {tech}
                </span>
              ))}
            </div>
            <div className="dialog-links">
              {project.links.length ? (
                project.links.map((link) => (
                  <a
                    className="pill-button dark-button"
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {link.label === "GitHub"
                      ? "View on GitHub"
                      : "Visit project"}
                    <ArrowUpRight size={18} />
                  </a>
                ))
              ) : (
                <span className="private-note">
                  Personal research project · No public demo
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

function ProjectCard({
  project,
  wide,
  onOpen,
}: {
  project: Project;
  /** Grid widths (4, 3 or 2 columns) at which this card spans two columns. */
  wide: number[];
  onOpen: () => void;
}) {
  // A soft light follows the pointer across the plate.
  const follow = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    event.currentTarget.style.setProperty("--mx", `${x * 100}%`);
    event.currentTarget.style.setProperty("--my", `${y * 100}%`);
  };
  return (
    <article
      className={["work-card", ...wide.map((cols) => `wide-${cols}`)].join(" ")}
      style={{ "--project-accent": project.accent } as CSSProperties}
      onPointerMove={follow}
    >
      <img
        className="work-plate"
        src={project.image}
        alt=""
        srcSet={`${project.image?.replace(".jpg", "-640.webp")} 640w, ${project.image?.replace(".jpg", "-1100.webp")} 1100w`}
        sizes="(max-width: 560px) 92vw, (max-width: 900px) 46vw, (max-width: 1200px) 31vw, 23vw"
        width="1440"
        height="900"
        loading="lazy"
        decoding="async"
      />
      <span className="work-kind">{LABELS[project.category]}</span>
      <div className="work-body">
        <h3>
          <button className="work-open" onClick={onOpen}>
            {project.title}
          </button>
        </h3>
        <p className="work-tagline">{project.tagline}</p>
        <p className="work-description">{project.description}</p>
        <div className="work-meta" aria-hidden="true">
          <span className="work-tech">
            {project.tech.slice(0, 3).map((tech) => (
              <TechIcon key={tech} name={tech} />
            ))}
            <span>{project.tech.slice(0, 2).join(" · ")}</span>
          </span>
          <ArrowUpRight className="work-arrow" size={18} />
        </div>
      </div>
    </article>
  );
}

function Projects() {
  const [filter, setFilter] = useState("All work");
  const [selected, setSelected] = useState<Project | null>(null);
  const filters = ["All work", "Products", "Experiments", "Open source"];
  const list = ORDERED.filter((project) =>
    filter === "All work"
      ? true
      : LABELS[project.category] ===
        (
          {
            Products: "Product",
            Experiments: "Experiment",
            "Open source": "Open source",
          } as Record<string, string>
        )[filter],
  );
  return (
    <section className="projects section-pad" id="projects">
      <div className="section-heading">
        <div>
          <SectionLabel number="03" />
          <h2>Projects</h2>
        </div>
      </div>
      <div className="project-filter" role="group" aria-label="Filter projects">
        <select
          className="mobile-project-select"
          aria-label="Project collection"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          {filters.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
        {filters.map((label) => (
          <button
            key={label}
            aria-pressed={filter === label}
            onClick={() => setFilter(label)}
          >
            {label}
            {label === "All work" && <sup>{PROJECTS.length}</sup>}
          </button>
        ))}
        <span className="filter-count" aria-live="polite">
          {String(list.length).padStart(2, "0")} PROJECTS
        </span>
      </div>
      <div className="work-grid">
        {list.map((project, index) => (
          <ProjectCard
            key={project.title}
            project={project}
            // Widen the first cards just enough that every row is full.
            wide={[4, 3, 2].filter(
              (cols) => index < (cols - (list.length % cols)) % cols,
            )}
            onOpen={() => setSelected(project)}
          />
        ))}
      </div>
      <ProjectDialog project={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

function About({ reduced }: { reduced: boolean }) {
  return (
    <section id="about" className="about section-pad" aria-label="About Sitong">
      <div className="about-grid">
        <div className="portrait-composition">
          <IconGlobe reduced={reduced} />
        </div>
        <div className="milestones">
          <div>
            <img
              className="milestone-logo"
              src="/qanvast.png"
              alt="Qanvast"
              width="48"
              height="48"
              loading="lazy"
            />
            <h2>
              Architected an <em>AI-powered</em> ERP platform.
            </h2>
            <p>
              Leading the leads and finance modules at Qanvast,
              <br />
              with multimodal AI tools built into the workflow.
            </p>
          </div>
          <div>
            <img
              className="milestone-logo"
              src="/nus.jpg"
              alt="National University of Singapore"
              width="48"
              height="48"
              loading="lazy"
            />
            <h2>
              Computer Science, <em>distributed systems.</em>
            </h2>
            <p>
              NUS Bachelor of Computing (Honours).
              <br />
              Specialisation in Networking &amp; Distributed Systems.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Experience() {
  return (
    <section id="work" className="experience section-pad">
      <div className="experience-intro">
        <SectionLabel number="01" />
        <h2>Experience</h2>
      </div>
      <div className="experience-list">
        {WORK.map((job) => (
          <details
            key={job.company}
            className={`job ${job.current ? "current-job" : ""}`}
          >
            <summary>
              <span className="job-period">
                {job.start} — {job.end}
                {job.current && (
                  <span className="current-label">
                    <span className="status-dot" /> CURRENTLY
                  </span>
                )}
              </span>
              <span className="job-heading">
                <img
                  className="company-logo"
                  src={job.logoUrl}
                  alt=""
                  width="56"
                  height="56"
                  loading="lazy"
                />
                <span>
                  <span className="job-company">{job.company}</span>
                  <span className="job-title">{job.title}</span>
                </span>
              </span>
              <span className="job-toggle">
                <Plus size={20} />
                <Minus size={20} />
              </span>
            </summary>
            <div className="job-detail">
              {job.highlights.length > 0 && (
                <ul>
                  {job.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              <div className="tech-tags">
                {job.tags.map((tag) => (
                  <span key={tag}>
                    <TechIcon name={tag} />
                    {tag}
                  </span>
                ))}
              </div>
              <a
                href={job.href}
                target="_blank"
                rel="noreferrer"
                className="job-link"
              >
                {job.company} <ArrowUpRight size={13} />
              </a>
            </div>
          </details>
        ))}
        {EDUCATION.map((item) => (
          <div className="education" key={item.school}>
            <span className="eyebrow">
              {item.start} — {item.end}
            </span>
            <div className="education-heading">
              <img
                className="company-logo"
                src={item.logoUrl}
                alt=""
                width="56"
                height="56"
                loading="lazy"
              />
              <h3>
                <a href={item.href} target="_blank" rel="noreferrer">
                  {item.school}
                </a>
              </h3>
            </div>
            <p>{item.degree}</p>
            {item.highlights.map((line) => (
              <p className="education-detail" key={line}>
                {line}
              </p>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function Stack() {
  return (
    <section id="stack" className="stack section-pad">
      <div className="stack-heading">
        <SectionLabel number="04" />
        <h2>Technologies</h2>
      </div>
      <div className="stack-list">
        {SKILLS.map((group, index) => (
          <div className="stack-group" key={group.label}>
            <span className="stack-number">0{index + 1}</span>
            <h3>{group.label}</h3>
            <ul className="stack-items">
              {group.items.map((item) => (
                <li key={item}>
                  <TechIcon name={item} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Contact({
  reduced,
  paused,
  onPause,
}: {
  reduced: boolean;
  paused: boolean;
  onPause: () => void;
}) {
  const [mode, setMode] = useState(0);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [copyError, setCopyError] = useState(false);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      setCopied(true);
      setCopyError(false);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyError(true);
    }
  }
  return (
    <section id="contact" className="contact section-pad">
      <div className="contact-main">
        <SectionLabel number="05" />
        <div className="contact-heading">
          <h2>Contact</h2>
          <a
            href={`mailto:${PROFILE.email}`}
            className="contact-arrow"
            aria-label="Email Sitong Hao"
          >
            <ArrowUpRight strokeWidth={1} />
          </a>
        </div>
        <p className="contact-place">
          <span className="status-dot" />
          Based in <em>Singapore</em>
          <span className="contact-place-rule" aria-hidden="true" />
          <LocalTime />
        </p>
        <div className="contact-bottom">
          <div>
            <div className="email-row">
              <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
              <button
                className="icon-button"
                onClick={copyEmail}
                aria-label={copied ? "Email copied" : "Copy email address"}
              >
                {copied ? <Check size={17} /> : <Copy size={17} />}
              </button>
            </div>
            <span role="status" className="copy-status">
              {copied
                ? "Email copied."
                : copyError
                  ? "Copy unavailable. You can select the email address above."
                  : ""}
            </span>
          </div>
          <div className="social-links">
            {SOCIALS.filter((item) => item.name !== "Email").map((item) => (
              <a
                href={item.url}
                key={item.name}
                target="_blank"
                rel="noreferrer"
              >
                <span>
                  {item.name === "GitHub" ? (
                    <Github size={17} />
                  ) : (
                    <Linkedin size={17} />
                  )}
                  {item.name}
                </span>
                <ArrowUpRight size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="landscape-wrap contact-landscape">
        <div className="landscape-ring" aria-hidden="true" />
        <span className="landscape-north" aria-hidden="true">
          N
        </span>
        <Landscape paused={paused || reduced} mode={mode} reduced={reduced} />
        <div className="landscape-controls" aria-label="Landscape controls">
          <button
            onClick={() => setMode((mode + 1) % 3)}
            aria-label={`Change landscape: ${["Archipelago", "Highlands", "Dunes"][mode]}`}
          >
            <RotateCcw size={14} />
            <span>{["Archipelago", "Highlands", "Dunes"][mode]}</span>
          </button>
          {!reduced && (
            <button
              onClick={onPause}
              aria-label={paused ? "Resume animation" : "Pause animation"}
              aria-pressed={paused}
            >
              {paused ? <Play size={14} /> : <Pause size={14} />}
            </button>
          )}
        </div>
        <span className="landscape-coordinate" aria-hidden="true">
          01°17′ N &nbsp; 103°51′ E
        </span>
      </div>
      <footer>
        <a href="#top" className="footer-signature">
          Sitong Hao
        </a>
        <span>© {new Date().getFullYear()}</span>
        <a href="#top" className="back-to-top">
          Back to top <ArrowUpRight size={14} />
        </a>
      </footer>
    </section>
  );
}

export default function App() {
  const reduced = useMotionPreference();
  const [paused, setPaused] = useState(false);
  return (
    <div
      className="portfolio"
      data-motion={paused || reduced ? "paused" : "active"}
    >
      <a className="skip-link" href="#projects">
        Skip to projects
      </a>
      <div className="painting-backdrop" aria-hidden="true" />
      <Navigation />
      <main>
        <Hero reduced={reduced} />
        <Experience />
        <About reduced={reduced} />
        <Projects />
        <Stack />
        <Contact
          reduced={reduced}
          paused={paused}
          onPause={() => setPaused(!paused)}
        />
      </main>
      <div className="page-grain" aria-hidden="true" />
    </div>
  );
}
