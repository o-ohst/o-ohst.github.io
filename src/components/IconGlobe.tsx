import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { TechIcon } from "./TechIcon";

// Local technology marks (simple-icons), distributed over a sphere.
const TECHNOLOGIES = [
  "TypeScript",
  "Python",
  "Go",
  "Rust",
  "Elixir",
  "Java",
  "C++",
  "C#",
  "Next.js",
  "React",
  "Node.js",
  "Express",
  "PostgreSQL",
  "MongoDB",
  "MySQL",
  "Redis",
  "RabbitMQ",
  "Elasticsearch",
  "FastAPI",
  "Docker",
  "AWS",
  "TensorFlow",
];
const POINTS = TECHNOLOGIES.map((_, index) => {
  const y = 1 - ((index + 0.5) / TECHNOLOGIES.length) * 2;
  const radius = Math.sqrt(1 - y * y);
  const angle = index * Math.PI * (3 - Math.sqrt(5));
  return { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius };
});

export default function IconGlobe({ reduced }: { reduced: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const rotation = useRef(0.35);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const icons = [...element.querySelectorAll<HTMLElement>(".globe-icon")];
    let width = element.clientWidth;
    let visible = false;
    let frame = 0;
    let last = 0;
    let pointer = 0;
    const paint = () => {
      const angle = rotation.current;
      POINTS.forEach((point, index) => {
        const x = point.x * Math.cos(angle) + point.z * Math.sin(angle);
        const z = point.z * Math.cos(angle) - point.x * Math.sin(angle);
        const y = point.y * Math.cos(0.25) - z * Math.sin(0.25);
        const depth = point.y * Math.sin(0.25) + z * Math.cos(0.25);
        const scale = 0.78 + (depth + 1) * 0.19;
        const icon = icons[index];
        icon.style.transform = `translate(-50%, -50%) translate(${x * width * 0.43}px, ${y * width * 0.43}px) scale(${scale})`;
        icon.style.opacity = String(0.45 + (depth + 1) * 0.275);
      });
    };
    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      if (time - last < 1000 / 24) return;
      const elapsed = last ? Math.min(time - last, 80) : 0;
      last = time;
      rotation.current += elapsed * (0.00012 + pointer * 0.00009);
      paint();
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      last = 0;
      if (visible && !document.hidden && !paused && !reduced)
        frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(element);
    const resize = new ResizeObserver(() => {
      width = element.clientWidth;
      paint();
    });
    resize.observe(element);
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointer =
        ((event.clientX - element.getBoundingClientRect().left) / width) * 2 -
        1;
    };
    const leave = () => {
      pointer = 0;
    };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", sync);
    paint();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [paused, reduced]);

  return (
    <div className="portrait-globe" ref={host}>
      <div className="globe-rings" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="globe-icons" aria-hidden="true">
        {TECHNOLOGIES.map((name) => (
          <span className="globe-icon" key={name} title={name}>
            <TechIcon name={name} />
          </span>
        ))}
      </div>
      {!reduced && (
        <button
          className="icon-button globe-pause"
          onClick={() => setPaused(!paused)}
          aria-label={
            paused ? "Resume technology globe" : "Pause technology globe"
          }
          aria-pressed={paused}
        >
          {paused ? <Play size={16} /> : <Pause size={16} />}
        </button>
      )}
    </div>
  );
}
