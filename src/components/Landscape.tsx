import { useEffect, useRef, useState } from "react";
import type { LandscapeController } from "./landscape-engine";

/** The page paints immediately. WebGL is a progressive enhancement of the atlas. */
export default function Landscape({
  paused,
  mode,
  reduced,
}: {
  paused: boolean;
  mode: number;
  reduced: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const engine = useRef<LandscapeController | null>(null);
  const options = useRef({ paused, mode });
  options.current = { paused, mode };
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (reduced) {
      setReady(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      import("./landscape-engine")
        .then(({ createLandscape }) => {
          if (cancelled || !host.current) return;
          try {
            engine.current = createLandscape(
              host.current,
              options.current,
              () => setReady(false),
            );
            setReady(true);
          } catch {
            setReady(false);
          }
        })
        .catch(() => setReady(false));
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      engine.current?.dispose();
      engine.current = null;
    };
  }, [reduced]);
  useEffect(() => {
    engine.current?.setOptions({ paused, mode });
  }, [paused, mode]);
  return (
    <div className={`landscape ${ready ? "is-ready" : ""}`}>
      <div className="landscape-fallback" aria-hidden="true">
        <div className="fallback-sun" />
        <svg viewBox="0 0 800 680" fill="none">
          {Array.from({ length: 38 }, (_, i) => (
            <path
              key={i}
              d={`M ${85 + i * 2} ${440 - i * 2} C ${140 + i} ${420 - i * 2},${206 + i} ${230 - i * 4 + mode * 45},${276 + i * 2} ${395 - i * 3} S ${400 + i} ${130 - i * 2 + mode * 55},${480 + i} ${290 - i * 2 + mode * 30} S ${600 - i} ${390 - i * 2},${718 - i * 2} ${440 - i * 2} Q 430 ${685 - i * 8} ${85 + i * 2} ${440 - i * 2}`}
              stroke={i % 6 === 0 ? "#525df5" : "#8a90a2"}
              strokeOpacity={0.3 + i / 80}
            />
          ))}
        </svg>
      </div>
      <div ref={host} className="landscape-canvas" aria-hidden="true" />
    </div>
  );
}
