/**
 * Draws one room of the Agent Office on a canvas and keeps it alive. Loaded on
 * demand by `OfficeHero`; everything here stays out of the first bundle.
 */
import { OfficeSimulation } from "./simulation";
import { CABINET, Office, ROOM_D, ROOM_W } from "./vendor/office/model";
import {
  attachEffects,
  renderOffice,
  seatZ,
  setOfficeTheme,
  setTimeMode,
  type Camera,
} from "./vendor/office/render";
import { iso } from "./vendor/office/iso";

export interface OfficeHandle {
  /** Draw and advance only while running. */
  setRunning(running: boolean): void;
  destroy(): void;
}

const MAX_DPR = 2;

export async function mountOffice(
  canvas: HTMLCanvasElement,
): Promise<OfficeHandle> {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  const sim = new OfficeSimulation();
  await sim.warm();

  setOfficeTheme("dark");
  // Day and night follow the visitor's clock; `?office=day` or `?office=night` pins it (for screenshots).
  const pinned = new URLSearchParams(location.search).get("office");
  setTimeMode(pinned === "day" || pinned === "night" ? pinned : "auto");
  const model = new Office();
  const cam: Camera = { x: 0, y: 0, zoom: 1 };
  let shown = "";
  let running = false;
  let frame = 0;
  let last = 0;
  let snap = true;
  let hovered: string | undefined;
  let dirty = true;
  let lastSync = 0;
  let alive = true;
  let drawn = false;

  function fit(dt: number, w: number, h: number) {
    const room = model.rooms.get(shown);
    if (!room) return;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    // The room and its walls (as in the office's own fit).
    for (const [x, y, z] of [
      [-0.3, -0.3, 3.4],
      [ROOM_W, -0.3, 3.4],
      [-0.3, ROOM_D, 3.4],
      [ROOM_W, ROOM_D, -0.4],
      [-0.3, ROOM_D, -0.4],
    ] as const) {
      const p = iso(room.ox + x, room.oy + y, z);
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    const zoom = Math.max(
      0.3,
      Math.min(
        2.2,
        Math.min((w - 16) / (maxX - minX), (h - 16) / (maxY - minY)),
      ),
    );
    const k = snap ? 1 : Math.min(1, dt * 3);
    snap = false;
    cam.zoom += (zoom - cam.zoom) * k;
    cam.x += ((minX + maxX) / 2 - cam.x) * k;
    cam.y += ((minY + maxY) / 2 - cam.y) * k;
  }

  function pick(clientX: number, clientY: number): string | undefined {
    const r = canvas.getBoundingClientRect();
    const mx = clientX - r.left,
      my = clientY - r.top;
    let best: { id: string; d: number } | undefined;
    for (const room of model.rooms.values())
      for (const c of room.chars.values()) {
        const p = iso(room.ox + c.x, room.oy + c.y, seatZ(c.mode));
        const sx = (p.x - cam.x) * cam.zoom + r.width / 2;
        const sy = (p.y - cam.y) * cam.zoom + r.height / 2 - 24 * cam.zoom;
        const d = Math.hypot(mx - sx, my - sy);
        if (d < 27 * cam.zoom && (!best || d < best.d)) best = { id: c.id, d };
      }
    return best?.id;
  }
  const onMove = (e: PointerEvent) => {
    hovered = pick(e.clientX, e.clientY);
    canvas.style.cursor = hovered ? "pointer" : "";
  };
  const onLeave = () => {
    hovered = undefined;
  };
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", onLeave);

  function draw(t: number) {
    frame = 0;
    // When paused, still draw the first frame so the room is visible.
    if (!alive || (!running && drawn)) return;
    const dt = last ? Math.min(0.1, (t - last) / 1000) : 0;
    last = t;
    sim.advance(dt * 1000);
    const now = Date.now();
    const world = sim.world;
    const id = sim.sessionId;
    if (id && id !== shown) {
      // The room is simply there, without the pop-in animation.
      model.layout([id], world, false, now - 1000);
      shown = id;
      snap = true;
      dirty = true;
    }
    const events = sim.drain();
    if (events.length || dirty || t - lastSync > 500) {
      model.sync(world, events, now);
      dirty = false;
      lastSync = t;
    }
    model.step(dt, now);
    attachEffects(model);

    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    if (!w || !h) {
      if (running) frame = requestAnimationFrame(draw);
      return;
    }
    if (
      canvas.width !== Math.round(w * dpr) ||
      canvas.height !== Math.round(h * dpr)
    ) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    fit(dt, w, h);
    const room = model.rooms.get(shown);
    // Filed diffs fly to the filing cabinet.
    const fileTarget = room
      ? iso(
          room.ox + CABINET.x + CABINET.w / 2,
          room.oy + CABINET.y + CABINET.d / 2,
          CABINET.h,
        )
      : undefined;
    renderOffice(ctx!, model, world, cam, w, h, dpr, now, {
      hovered,
      labels: true,
      fileTarget,
      transparent: true,
    });
    drawn = true;
    if (running) frame = requestAnimationFrame(draw);
  }
  frame = requestAnimationFrame(draw);

  return {
    setRunning(next) {
      if (next === running) return;
      running = next;
      last = 0;
      if (running && !frame) frame = requestAnimationFrame(draw);
    },
    destroy() {
      alive = false;
      cancelAnimationFrame(frame);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    },
  };
}
