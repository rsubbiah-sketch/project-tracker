/* Light theme color tokens */
export const n = { 950:"#FFFFFF",900:"#05192F",800:"#F7F8FA",700:"#F0F2F5",600:"#E2E6EC",500:"#CBD3DC",400:"#94A3B4",300:"#64748B",200:"#475569",100:"#334155" };
export const g = { 900:"#94A3B8",800:"#64748B",700:"#475569",600:"#334155",500:"#C9952B",400:"#0F2D4F",300:"#0A2240",200:"#05192F",100:"#FFF1D0",sh:"#B8860B",sl:"#D4A843" };
export const u = { ok:"#34D399",okD:"rgba(52,211,153,.12)",w:"#FBBF24",wD:"rgba(251,191,36,.12)",err:"#F87171",errD:"rgba(248,113,113,.12)",inf:"#60A5FA",infD:"rgba(96,165,250,.12)",pur:"#A78BFA",purD:"rgba(167,139,250,.12)" };
/** Accent blue for selected/active button states */
export const accent = "#93C5FD";
/** Blue-600 for selected button label text */
export const accentText = "#2563EB";

/* Status styles (legacy — used by Dashboard charts) */
export const ST: Record<string, { c: string; bg: string }> = {"On Track":{c:u.ok,bg:u.okD},"At Risk":{c:u.w,bg:u.wD},"Delayed":{c:u.err,bg:u.errD},"Completed":{c:u.inf,bg:u.infD},"Planning":{c:u.pur,bg:u.purD},"Not Started":{c:g[600],bg:"rgba(201,149,43,.08)"}};

/* Program types */
export const PROGRAM_TYPES = ["HW", "SW", "Customer", "NPI"] as const;
export const SUBTYPES: Record<string, string[]> = {
  HW: ["CRD", "MRD", "PRD", "DOC", "Project"],
  SW: ["CRD", "MRD", "PRD", "DOC", "Project"],
  Customer: ["CRD", "MRD", "PRD", "DOC", "Project"],
  NPI: [],
};

/* Program phases */
export const PROGRAM_PHASES = ["New", "Active", "Waiting", "Blocked", "Complete"] as const;
export const PHASE_COLOR: Record<string, string> = {
  New: "#60A5FA",
  Active: "#3B82F6",
  Waiting: "#FBBF24",
  Blocked: "#F87171",
  Complete: "#34D399",
};
export const PROGRESS_COLOR: Record<string, string> = {
  Active: "#3B82F6",
  New: "#3B82F6",
  Waiting: "#F87171",
  Blocked: "#F87171",
  Complete: "#34D399",
};

/* Health signal styles (Traffic Signal Model) */
export const SIG: Record<string,{c:string;bg:string;l:string}> = {
  G:{c:u.ok,bg:u.okD,l:"On Track"},
  A:{c:u.w,bg:u.wD,l:"At Risk"},
  R:{c:u.err,bg:u.errD,l:"Off Track"},
};

/* Issue severity styles */
export const ISEV: Record<string,{c:string;bg:string;l:string}> = {
  C:{c:u.err,bg:u.errD,l:"Critical"},
  H:{c:u.w,bg:u.wD,l:"High"},
  M:{c:u.inf,bg:u.infD,l:"Medium"},
};

/* Health pillar definitions */
export const PILLARS = [
  {key:"t",label:"Technical",icon:"T",desc:"Engineering soundness",subKey:"ts"},
  {key:"e",label:"Execution",icon:"E",desc:"Team delivery",subKey:"es"},
  {key:"m",label:"Time to Market",icon:"M",desc:"Schedule & window",subKey:"ms"},
] as const;

/* Default sub-metric labels per pillar */
export const DEFAULT_SUBS: Record<string,string[]> = {
  ts:["Design Maturity","Verification","Integration","Quality"],
  es:["Resources","Budget","Gate Compliance","Dependencies"],
  ms:["Schedule","Milestones","Critical Path","Market Window"],
};

/* Gate phase lists (legacy — used by Gate Reviews) */
export const PHASE_LISTS: Record<string, string[]> = {
  ASIC:["Spec","RTL","Verification","Tapeout","Bring-up","Characterization","Production"],
  Hardware:["Schematic","Layout","Fabrication","Assembly","Bring-up","Validation","Production"],
  Software:["Planning","Development","Integration","Testing","Staging","Release"],
  HW:["Schematic","Layout","Fabrication","Assembly","Bring-up","Validation","Production"],
  SW:["Planning","Development","Integration","Testing","Staging","Release"],
};
