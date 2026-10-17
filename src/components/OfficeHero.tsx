import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { OfficeHandle } from "../office/engine";

/**
 * The hero: the Agent Office from observe-agents-do-things, showing one busy
 * (simulated) agent session as a room of blob workers. The office code loads
 * just after first paint and is drawn live on a canvas.
 */
export default function OfficeHero({ reduced }: { reduced: boolean }) {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const handle = useRef<OfficeHandle | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(reduced);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(
    () => document.visibilityState !== "hidden",
  );
  const running = ready && !paused && onScreen && tabVisible;

  useEffect(() => setPaused(reduced), [reduced]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      import("../office/engine")
        .then(({ mountOffice }) =>
          canvas.current ? mountOffice(canvas.current) : null,
        )
        .then((h) => {
          if (!h) return;
          if (cancelled) return h.destroy();
          handle.current = h;
          setReady(true);
        })
        .catch(() => setFailed(true));
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      handle.current?.destroy();
      handle.current = null;
    };
  }, []);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry?.isIntersecting ?? true),
      { threshold: 0.05 },
    );
    observer.observe(el);
    const onVisibility = () =>
      setTabVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => handle.current?.setRunning(running), [running, ready]);

  return (
    <div
      ref={stage}
      className={`office-stage ${ready ? "is-ready" : ""} ${failed ? "is-failed" : ""}`}
    >
      <canvas
        ref={canvas}
        className="office-canvas"
        role="img"
        aria-label="An animated isometric office: blob workers at their desks acting out a coding agent's session on data pipelines and APIs."
      />
      <div className="office-ui">
        <button
          className="office-pause"
          disabled={!ready}
          onClick={() => setPaused(!paused)}
          aria-label={paused ? "Play the office" : "Pause the office"}
          aria-pressed={paused}
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
        </button>
      </div>
    </div>
  );
}
