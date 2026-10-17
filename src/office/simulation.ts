/**
 * A scripted, endlessly looping office for the hero: one session, one room, a
 * busy team doing everyday engineering: ETL pipelines, APIs, tests and CI.
 * Modelled on
 * observe-agents-do-things' demo source (`packages/core/src/sources/demo.ts`),
 * but denser, so the room always has workers at their desks, raising a hand
 * for approval, taking a break on the couch and coming through the door.
 *
 * Time is virtual: the simulation only advances while the hero is drawing, so
 * a paused, hidden or off-screen hero does not pile up events.
 */
import {
  applyEvent,
  createWorld,
  type EventDraft,
  type FileChange,
  type FileRef,
  type ObserverEvent,
  type ToolCategory,
  type WorldState,
} from "./vendor/protocol/index.js";
import { claudeChanges } from "./vendor/diff";

type Body = EventDraft extends infer T
  ? T extends unknown
    ? Omit<T, "ts" | "harness" | "sessionId" | "agentId">
    : never
  : never;

let counter = 0;
const uid = (p: string) =>
  `${p}_${Date.now().toString(36)}${(counter++).toString(36)}`;
const pick = <T>(list: readonly T[]) =>
  list[Math.floor(Math.random() * list.length)]!;
const between = (a: number, b: number) => a + Math.random() * (b - a);

/** Timers that resolve against virtual time, advanced by the render loop. */
class Clock {
  now = 0;
  private timers: Array<{ at: number; done: () => void }> = [];
  sleep(ms: number): Promise<void> {
    const at = this.now + ms * (0.8 + Math.random() * 0.4);
    return new Promise((done) => this.timers.push({ at, done }));
  }
  advance(ms: number): void {
    this.now += ms;
    const due = this.timers.filter((t) => t.at <= this.now);
    if (!due.length) return;
    this.timers = this.timers.filter((t) => t.at > this.now);
    for (const t of due) t.done();
  }
}

type Emit = (draft: EventDraft) => void;

class Actor {
  private emit: Emit;
  private clock: Clock;
  readonly harness: string;
  readonly sessionId: string;
  readonly agentId: string;
  private model: string;
  private ctx: [number, number];
  constructor(
    emit: Emit,
    clock: Clock,
    harness: string,
    sessionId: string,
    agentId: string,
    model: string,
    ctx: [number, number] = [30_000, 90_000],
  ) {
    this.emit = emit;
    this.clock = clock;
    this.harness = harness;
    this.sessionId = sessionId;
    this.agentId = agentId;
    this.model = model;
    this.ctx = ctx;
  }

  send(body: Body): void {
    this.emit({
      ts: Date.now(),
      harness: this.harness,
      sessionId: this.sessionId,
      agentId: this.agentId,
      ...body,
    } as EventDraft);
  }

  sleep(ms: number) {
    return this.clock.sleep(ms);
  }

  async think(ms = 1600, text?: string) {
    this.send({ kind: "thinking", text });
    await this.sleep(ms);
  }

  async say(text: string, ms = 900) {
    this.send({ kind: "message", role: "assistant", text });
    this.tokens(between(300, 1100));
    await this.sleep(ms);
  }

  tokens(out: number): void {
    const ctx = between(this.ctx[0], this.ctx[1]);
    this.send({
      kind: "usage",
      model: this.model,
      delta: {
        input: Math.round(between(200, 1600)),
        output: Math.round(out),
        cacheRead: Math.round(ctx * 0.8),
        cacheWrite: Math.round(between(0, 3000)),
        reasoning: Math.round(out * 0.3),
      },
      contextTokens: Math.round(ctx),
      contextWindow: 200_000,
    });
  }

  start(
    tool: string,
    category: ToolCategory,
    title: string,
    files: FileRef[] = [],
    input?: unknown,
    changes?: FileChange[],
  ): string {
    const callId = uid("call");
    this.send({
      kind: "tool.started",
      callId,
      tool,
      category,
      title,
      files,
      input,
      changes,
    });
    return callId;
  }

  finish(callId: string, ok = true, output?: string): void {
    this.send({ kind: "tool.finished", callId, ok, output });
  }

  async tool(
    tool: string,
    category: ToolCategory,
    title: string,
    opts: {
      files?: FileRef[];
      ms?: number;
      ok?: boolean;
      output?: string;
      changes?: FileChange[];
    } = {},
  ) {
    const id = this.start(
      tool,
      category,
      title,
      opts.files,
      undefined,
      opts.changes,
    );
    await this.sleep(opts.ms ?? 1200);
    this.finish(
      id,
      opts.ok ?? true,
      opts.output ?? (opts.ok === false ? "Error: command failed" : "ok"),
    );
    this.tokens(between(80, 280));
  }

  child(agentId: string): Actor {
    return new Actor(
      this.emit,
      this.clock,
      this.harness,
      this.sessionId,
      agentId,
      this.model,
    );
  }
}

// ─── What the room works on ──────────────────────────────────────────────

interface Edit {
  path: string;
  old: string;
  next: string;
}
interface Write {
  path: string;
  content: string;
}
interface Project {
  key: string;
  title: string;
  project: string;
  harness: "claude-code" | "codex";
  model: string;
  prompts: string[];
  reads: string[];
  searches: string[];
  edits: Edit[];
  writes: Write[];
  commands: Array<{ cmd: string; ok: string; fail: string }>;
  web: string[];
  /** Commands a worker has to get approved. */
  gated: string[];
  tasks: Array<{ name: string; role: string }>;
  summaries: string[];
}

/** The one session on stage: everyday engineering on a data platform. */
export const PLATFORM: Project = {
  key: "platform",
  title: "Data platform · pipelines & APIs",
  project: "data-platform",
  harness: "claude-code",
  model: "claude-opus",
  prompts: [
    "Build an ETL job that loads the daily orders export into Postgres.",
    "The nightly pipeline takes three hours. Profile it and parallelise the transforms.",
    "Add pagination and caching to the reports API.",
    "Run the tests and migrations in CI on every pull request.",
  ],
  reads: [
    "etl/extract.py",
    "etl/transform.py",
    "etl/load.py",
    "api/routes/reports.ts",
    "services/cache.ts",
    "db/migrations/0012_orders.sql",
  ],
  searches: [
    'Grep "def transform" in etl',
    "Glob api/routes/**/*.ts",
    'Grep "SELECT \\*" in api',
    "Glob .github/workflows/*.yml",
  ],
  edits: [
    {
      path: "etl/transform.py",
      old: "for row in rows:\n    out.append(clean(row))",
      next: "with ProcessPoolExecutor() as pool:\n    out = list(pool.map(clean, rows, chunksize=5_000))",
    },
    {
      path: "etl/load.py",
      old: "for row in rows:\n    cur.execute(INSERT, row)",
      next: "with cur.copy(COPY_ORDERS) as copy:\n    for row in rows:\n        copy.write_row(row)",
    },
    {
      path: "api/routes/reports.ts",
      old: "const rows = await db.reports.findAll()",
      next: "const { cursor, limit = 50 } = req.query\nconst rows = await cache.wrap(`reports:${cursor}`, () =>\n  db.reports.page({ cursor, limit }),\n)",
    },
    {
      path: "db/migrations/0012_orders.sql",
      old: "create table orders (",
      next: "create table if not exists orders (",
    },
  ],
  writes: [
    {
      path: "tests/test_transform.py",
      content:
        "def test_clean_drops_duplicates():\n    rows = [order(id=1), order(id=1), order(id=2)]\n    assert [r.id for r in transform(rows)] == [1, 2]",
    },
    {
      path: ".github/workflows/ci.yml",
      content:
        "on: [pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: make migrate test",
    },
  ],
  commands: [
    {
      cmd: "pytest -q",
      ok: "64 passed in 6.2s",
      fail: "FAILED tests/test_transform.py::test_clean_drops_duplicates",
    },
    {
      cmd: "python -m etl.run --date 2026-10-14",
      ok: "loaded 1,284,302 rows in 4m 12s",
      fail: "psycopg.errors.UniqueViolation: duplicate key",
    },
    {
      cmd: "npm test",
      ok: "38 passing",
      fail: "expected 50 rows, received 2,000",
    },
    {
      cmd: "docker compose up -d db redis",
      ok: "Started db, redis",
      fail: "port 5432 is already allocated",
    },
  ],
  web: [
    'WebSearch "postgres COPY vs batched insert"',
    'WebSearch "cursor pagination best practices"',
    'WebSearch "github actions service containers postgres"',
  ],
  gated: ["$ make migrate ENV=staging", "$ git push origin feat/etl-orders"],
  tasks: [
    { name: "Map the pipeline", role: "Explore" },
    { name: "Plan the backfill", role: "Plan" },
    { name: "Review the API changes", role: "code-reviewer" },
    { name: "Write the ETL tests", role: "test-writer" },
    { name: "Profile the transforms", role: "general-purpose" },
    { name: "Check the migrations", role: "Explore" },
    { name: "Update the runbook", role: "docs-writer" },
  ],
  summaries: [
    "Orders now load nightly with COPY: 1.28M rows in about four minutes.",
    "Transforms run across worker processes; the pipeline finishes in 38 minutes.",
    "Reports are cursor-paginated and cached in Redis for five minutes.",
    "CI runs migrations and both test suites on every pull request.",
  ],
};

// ─── Scripts ─────────────────────────────────────────────────────────────

const read = (path: string): FileRef[] => [{ path, op: "read" }];
const touched = (path: string, op: "edit" | "write"): FileRef[] => [
  { path, op },
];

/** One worker's errand: a handful of tool calls drawn from the project, then a report. */
async function errand(
  sub: Actor,
  p: Project,
  root: string,
  gate: { open: number },
): Promise<void> {
  const steps = 4 + Math.floor(Math.random() * 4);
  for (let i = 0; i < steps; i++) {
    const roll = Math.random();
    if (roll < 0.2) {
      const f = pick(p.reads);
      await sub.tool("Read", "read", `Read ${f}`, {
        files: read(`${root}/${f}`),
        ms: between(900, 1800),
      });
    } else if (roll < 0.32) {
      await sub.tool("Grep", "search", pick(p.searches), {
        ms: between(800, 1500),
      });
    } else if (roll < 0.5) {
      const e = pick(p.edits);
      await sub.tool("Edit", "edit", `Edit ${e.path}`, {
        files: touched(`${root}/${e.path}`, "edit"),
        ms: between(1800, 2800),
        changes: claudeChanges("Edit", {
          file_path: `${root}/${e.path}`,
          old_string: e.old,
          new_string: e.next,
        }),
      });
    } else if (roll < 0.58) {
      const w = pick(p.writes);
      await sub.tool("Write", "write", `Write ${w.path}`, {
        files: touched(`${root}/${w.path}`, "write"),
        ms: between(2000, 3000),
        changes: claudeChanges("Write", {
          file_path: `${root}/${w.path}`,
          content: w.content,
        }),
      });
    } else if (roll < 0.74) {
      const c = pick(p.commands);
      const ok = Math.random() > 0.3;
      await sub.tool("Bash", "shell", `$ ${c.cmd}`, {
        ms: between(2400, 4200),
        ok,
        output: ok ? c.ok : c.fail,
      });
      if (!ok) await sub.think(between(1400, 2200));
    } else if (roll < 0.84) {
      await sub.tool("WebFetch", "web", pick(p.web), {
        ms: between(2600, 4000),
      });
    } else if (roll < 0.92 && gate.open < 2) {
      // Needs approval: the worker raises a hand.
      gate.open++;
      const cmd = pick(p.gated);
      const id = sub.start("Bash", "shell", cmd);
      await sub.sleep(500);
      sub.send({
        kind: "agent.status",
        status: "waiting",
        reason: `${cmd} — awaiting approval`,
      });
      await sub.sleep(between(4500, 7000));
      gate.open--;
      sub.finish(id, true, "approved");
    } else {
      await sub.think(between(1500, 2600));
    }
  }
  await sub.say(pick(p.summaries));
  sub.send({ kind: "turn.ended", outcome: "completed" });
}

async function room(
  p: Project,
  clock: Clock,
  emit: Emit,
  delay: number,
): Promise<void> {
  const sessionId = uid(`office-${p.key}`);
  const root = `/home/sitong/${p.project}`;
  const main = new Actor(
    emit,
    clock,
    p.harness,
    sessionId,
    sessionId,
    p.model,
    [60_000, 150_000],
  );
  main.send({
    kind: "session.started",
    meta: {
      cwd: root,
      project: p.project,
      gitBranch: "main",
      model: p.model,
      demo: true,
      title: p.title,
      titleSource: "custom",
    },
  });
  const gate = { open: 0 };
  await clock.sleep(delay);
  for (let round = 0; ; round++) {
    main.send({ kind: "turn.started", turnId: uid("turn") });
    main.send({
      kind: "message",
      role: "user",
      text: p.prompts[round % p.prompts.length]!,
    });
    await main.sleep(1200);
    await main.think(1800);
    await main.tool("TodoWrite", "plan", "Todos 0/4 · Split the work", {
      ms: 500,
    });

    // A rolling team: six desks, and whenever a worker finishes, another is
    // brought in, so the room stays full for the whole (long) turn.
    const turnEnds = clock.now + between(70_000, 90_000);
    const seat = async (first: number): Promise<void> => {
      await main.sleep(first);
      while (clock.now < turnEnds) {
        const task = pick(p.tasks);
        const call = main.start(
          "Agent",
          "agent",
          `${task.role}: ${task.name}`,
          [],
          { subagent_type: task.role },
        );
        const sub = main.child(uid("agent"));
        sub.send({
          kind: "agent.spawned",
          parentToolCallId: call,
          name: task.name,
          role: task.role,
          task: task.name,
        });
        sub.send({ kind: "message", role: "agent", text: task.name });
        await errand(sub, p, root, gate);
        main.finish(call, true, "done");
        await main.sleep(between(1500, 4000));
      }
    };
    const errands = Array.from({ length: 6 }, (_, i) =>
      seat(i * between(700, 1600)),
    );

    // The lead keeps working while the team is busy.
    const own = (async () => {
      for (let i = 0; clock.now < turnEnds; i++) {
        await main.sleep(between(2500, 5000));
        const e = pick(p.edits);
        if (i % 2) {
          await main.tool("Read", "read", `Read ${pick(p.reads)}`, {
            ms: between(800, 1400),
          });
        } else {
          await main.tool("Edit", "edit", `Edit ${e.path}`, {
            files: touched(`${root}/${e.path}`, "edit"),
            ms: between(1500, 2400),
            changes: claudeChanges("Edit", {
              file_path: `${root}/${e.path}`,
              old_string: e.old,
              new_string: e.next,
            }),
          });
        }
      }
    })();

    await Promise.all([...errands, own]);
    await main.tool("TodoWrite", "plan", "Todos 4/4", { ms: 400 });
    const c = pick(p.commands);
    await main.tool("Bash", "shell", `$ ${c.cmd}`, { ms: 3000, output: c.ok });
    await main.say(p.summaries[round % p.summaries.length]!);
    main.send({ kind: "turn.ended", outcome: "completed" });
    await main.sleep(between(2500, 3500));
  }
}

// ─── The store ───────────────────────────────────────────────────────────

export class OfficeSimulation {
  readonly world: WorldState = createWorld();
  sessionId = "";
  private clock = new Clock();
  private seq = 0;
  private pending: ObserverEvent[] = [];

  constructor() {
    const emit: Emit = (draft) => {
      const event = { ...draft, seq: ++this.seq } as ObserverEvent;
      applyEvent(this.world, event);
      this.pending.push(event);
      if (event.kind === "session.started") this.sessionId = event.sessionId;
    };
    void room(PLATFORM, this.clock, emit, 0);
  }

  /** Run the first stretch quickly, so the room already has a full delegation when it appears. */
  async warm(ms = 22_000): Promise<void> {
    // Each step yields a macrotask so the scripts' awaits run between steps.
    // MessageChannel, unlike setTimeout, is not clamped or throttled in background tabs.
    const channel = new MessageChannel();
    const tick = () =>
      new Promise<void>((r) => {
        channel.port1.onmessage = () => r();
        channel.port2.postMessage(0);
      });
    for (let t = 0; t < ms; t += 250) {
      this.clock.advance(250);
      await tick();
    }
    channel.port1.close();
  }

  /** Advance virtual time (ms). */
  advance(ms: number): void {
    this.clock.advance(Math.min(ms, 250));
  }

  /** Events since the last call. */
  drain(): ObserverEvent[] {
    return this.pending.splice(0);
  }
}
