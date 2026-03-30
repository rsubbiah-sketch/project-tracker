export interface User {
  id: string;
  name: string;
  role: string;
  av: string;
}

export interface Milestone {
  name: string;
  date: string;
  status: "pending" | "done";
  owner?: string;
  keyIssue?: string;
}

export interface Program {
  id: string;
  name: string;
  type: "HW" | "SW" | "Customer" | "NPI";
  subType: string;
  currentPhase: "New" | "Active" | "Waiting" | "Blocked" | "Complete";
  owner: User;
  assignedBy: User;
  assignedDate: string;
  lastUpdate: string;
  deliveryAsk: string;
  deliveryCommit: string;
  desc: string;
  progress: number;
  team: number;
  budget: string;
  budgetUsed: number;
  mode: "active" | "planning";
  spark: number[];
  milestones: Milestone[];
  /* health metrics (traffic signal model) */
  health?: ProgramHealth;
  issues?: KeyIssue[];
  /* legacy fields kept for backward compat */
  status?: string;
  phase?: string;
  start?: string;
  target?: string;
}

export interface Comment {
  id: string;
  eId: string;
  author: User;
  body: string;
  ts: string;
  resolved: boolean;
  likes: string[];
}

export interface Reply {
  id: string;
  cId: string;
  author: User;
  body: string;
  ts: string;
  likes: string[];
}

export interface Notification {
  id: string;
  type?: string;
  from: User;
  text: string;
  ts: string;
  read: boolean;
}

export interface Task {
  id: string;
  title: string;
  prgId: string;
  assignee: User;
  reporter: User;
  priority: string;
  status: string;
  due: string;
  desc: string;
}

export interface Doc {
  id: string;
  prgId: string;
  name: string;
  type: "sheet" | "doc" | "slides" | "pdf" | "link";
  url: string;
  addedBy: User;
  addedAt: string;
  category: string;
}

export interface GatePhase {
  ph: string;
  items: string[];
}

export interface ImplTask {
  id: string;
  t: string;
  o: string;
  s: string;
}

export interface ImplPhase {
  id: string;
  name: string;
  wk: string;
  items: ImplTask[];
  gc: string[];
}

/* ─── Health Metrics (Traffic Signal Model) ─── */
export type Sig = 'G' | 'A' | 'R';

export interface HealthSub {
  l: string;     // label (e.g. "Design Maturity")
  s: Sig;        // signal
  n?: string;    // context note (optional, 1 line)
}

export interface ProgramHealth {
  t: Sig;            // Technical overall
  e: Sig;            // Execution overall
  m: Sig;            // Time-to-market overall
  ts?: HealthSub[];  // Technical sub-metrics
  es?: HealthSub[];  // Execution sub-metrics
  ms?: HealthSub[];  // Time-to-market sub-metrics
}

export interface KeyIssue {
  id: string;
  text: string;       // Brief, actionable text
  sev: 'C'|'H'|'M';  // Critical / High / Medium
  by: string;         // editor initials or user id
  dt: string;         // date added
  res?: boolean;      // resolved flag
}

export interface HealthOverride {
  label: string;
  note: string;
  by: string;
  at: string;
}
