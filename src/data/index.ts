import type { User, Program, Comment, Reply, Notification, Task, ImplPhase, Doc, ProgramHealth, KeyIssue, Team } from '../types';

/* ═══ QA ENVIRONMENT: empty data when VITE_SEED_DATA=false ═══ */
const SEED = (import.meta as any).env?.VITE_SEED_DATA !== 'false';

export const USERS: User[] = [
  /* ── Editors (u1-u8) ── */
  {id:"u1",name:"Abhay Anabathula",role:"editor",av:"AA"},
  {id:"u2",name:"Julissa Benavente",role:"editor",av:"JB"},
  {id:"u3",name:"Ganesh Raman",role:"admin",av:"GR"},
  {id:"u4",name:"Mayuresh Gangal",role:"editor",av:"MG"},
  {id:"u5",name:"Varun Vij",role:"editor",av:"VV"},
  {id:"u6",name:"Mark Nguyen",role:"editor",av:"MN"},
  {id:"u7",name:"Arnav Bhalla",role:"editor",av:"AB"},
  {id:"u8",name:"Shahriar Illislamloo",role:"editor",av:"SI"},
  /* ── Commenters (u9-u36) ── */
  {id:"u9",name:"Adolpho Gonzalez",role:"commenter",av:"AG"},
  {id:"u10",name:"RK Anabathula",role:"commenter",av:"RA"},
  {id:"u11",name:"Victor Freitas",role:"commenter",av:"VF"},
  {id:"u12",name:"Xin Guo",role:"commenter",av:"XG"},
  {id:"u13",name:"Subbu Veerabagu",role:"commenter",av:"SV"},
  {id:"u14",name:"Chris Blair",role:"commenter",av:"CB"},
  {id:"u15",name:"Santhosh Thodupunoori",role:"commenter",av:"ST"},
  {id:"u16",name:"Farzam Roknaldin",role:"commenter",av:"FR"},
  {id:"u17",name:"Madhu Ganugapati",role:"commenter",av:"MG"},
  {id:"u18",name:"Uma Ramanathan",role:"commenter",av:"UR"},
  {id:"u19",name:"Ramanan Natarajan",role:"commenter",av:"RN"},
  {id:"u20",name:"Mani Amoozadeh",role:"commenter",av:"MA"},
  {id:"u21",name:"Raymond Fan",role:"commenter",av:"RF"},
  {id:"u22",name:"ND Ramesh",role:"commenter",av:"NR"},
  {id:"u23",name:"Matthew Kim",role:"commenter",av:"MK"},
  {id:"u24",name:"Minbo Fan",role:"commenter",av:"MF"},
  {id:"u25",name:"Shweta Naik",role:"commenter",av:"SN"},
  {id:"u26",name:"Sruthi Kesa",role:"commenter",av:"SK"},
  {id:"u27",name:"KK Verma",role:"commenter",av:"KV"},
  {id:"u28",name:"Deepti Chandra",role:"commenter",av:"DC"},
  {id:"u29",name:"John Cheung",role:"commenter",av:"JC"},
  {id:"u30",name:"Hank Li",role:"commenter",av:"HL"},
  {id:"u31",name:"Subrata Banerjee",role:"commenter",av:"SB"},
  {id:"u32",name:"Darshan Shah",role:"commenter",av:"DS"},
  {id:"u33",name:"Brian Ray",role:"commenter",av:"BR"},
  {id:"u34",name:"Boaz Khan",role:"commenter",av:"BK"},
  {id:"u35",name:"Madhu Reddy",role:"commenter",av:"MR"},
  {id:"u36",name:"Gobi Krishnamoorthy",role:"commenter",av:"GK"},
  /* ── Viewers (u37-u40) ── */
  {id:"u37",name:"Aravind Srikumar",role:"viewer",av:"AS"},
  {id:"u38",name:"Barun Kar",role:"viewer",av:"BK"},
  {id:"u39",name:"Rajiv Khemani",role:"viewer",av:"RK"},
  {id:"u40",name:"Puneet Agarwal",role:"viewer",av:"PA"},
];

export const ME = USERS[1]; // Julissa Benavente (editor/PM)

/* ═══ PREDEFINED TEAMS ═══ */
export const TEAMS: Team[] = [
  { id: 'team-marketing', name: 'Marketing', memberIds: ['u37', 'u28', 'u2', 'u3', 'u5', 'u4', 'u1'] },
  // Aravind Srikumar, Deepti Chandra, Julissa Benavente, Ganesh Raman, Varun Vij, Mayuresh Gangal, Abhay Anabathula
  { id: 'team-hw', name: 'Hardware Engineering', memberIds: ['u1', 'u10', 'u11', 'u34', 'u22'] },
  // Abhay Anabathula, RK Anabathula, Victor Freitas, Boaz Khan, ND Ramesh
  { id: 'team-sw', name: 'Software Engineering', memberIds: ['u15', 'u12', 'u16', 'u20', 'u19'] },
  // Santhosh Thodupunoori, Xin Guo, Farzam Roknaldin, Mani Amoozadeh, Ramanan Natarajan
  { id: 'team-leadership', name: 'Leadership', memberIds: ['u39', 'u40', 'u3', 'u6', 'u2'] },
  // Rajiv Khemani, Puneet Agarwal, Ganesh Raman, Mark Nguyen, Julissa Benavente
  { id: 'team-qa', name: 'Quality Assurance', memberIds: ['u25', 'u26', 'u27', 'u23'] },
  // Shweta Naik, Sruthi Kesa, KK Verma, Matthew Kim
];

const _PROGRAMS: Program[] = [
  {id:"PRG-001",name:"SkyHammer ASIC v1",type:"HW",subType:"PRD",currentPhase:"Active",owner:USERS[0],assignedBy:USERS[5],assignedDate:"2025-08-15",lastUpdate:"2026-03-18T09:30:00",deliveryAsk:"2026-08-15",deliveryCommit:"2026-09-01",desc:"Next-gen scale-up networking ASIC. 51.2Tb/s bandwidth, UALink SerDes, deterministic flow control for trillion-parameter AI clusters.",progress:62,team:34,budget:"$48.2M",budgetUsed:58,mode:"active",spark:[20,35,42,48,55,58,62],milestones:[{name:"RTL-Freeze",date:"2026-04-15",status:"pending",owner:"Anabathula",keyIssue:"Routing density / power closure",category:"product"},{name:"Tapeout",date:"2026-06-01",status:"pending",owner:"Anabathula",keyIssue:"Foundry handoff / critical path",category:"product"},{name:"First-Silicon",date:"2026-08-15",status:"pending",owner:"Anabathula",keyIssue:"Validation plan on track",category:"execution"}],health:{t:"A",e:"G",m:"A",ts:[{l:"Design Maturity",s:"G",n:"RTL 95% complete"},{l:"Verification",s:"A",n:"DV coverage 87% — need 95%"},{l:"Integration",s:"G",n:"SerDes IP validated"},{l:"Quality",s:"G",n:"0 critical bugs"}],es:[{l:"Resources",s:"G",n:"34/34 staffed"},{l:"Budget",s:"G",n:"58% spent at 62% progress"},{l:"Gate Compliance",s:"G",n:"All gates on track"},{l:"Dependencies",s:"G",n:"No external blockers"}],ms:[{l:"Schedule",s:"A",n:"Commit 2wk after ASK"},{l:"Milestones",s:"A",n:"RTL-Freeze tight"},{l:"Critical Path",s:"G",n:"Tapeout on schedule"},{l:"Market Window",s:"G",n:"Q3 target holds"}]},issues:[{id:"i1",text:"DV coverage at 82% on SerDes — 3 blocks below 90% target",sev:"H",by:"AA",dt:"2026-03-17"},{id:"i2",text:"CDC analysis pending on 2 clock domain crossings",sev:"M",by:"AA",dt:"2026-03-18"}]},
  {id:"PRG-002",name:"Spectrum-X Switch Tray",type:"HW",subType:"Project",currentPhase:"Active",owner:USERS[1],assignedBy:USERS[5],assignedDate:"2025-11-01",lastUpdate:"2026-03-16T16:30:00",deliveryAsk:"2026-06-30",deliveryCommit:"2026-07-15",desc:"OCP-compliant 2U switch tray on NVIDIA Spectrum-X silicon. Liquid cooling, 128×400G ports, rack-scale architecture.",progress:45,team:22,budget:"$12.8M",budgetUsed:71,mode:"active",spark:[10,18,25,30,38,42,45],milestones:[{name:"EVT",date:"2026-04-01",status:"done",owner:"Benavente",keyIssue:"Thermal redesign completed",category:"execution"},{name:"DVT",date:"2026-05-15",status:"pending",owner:"Benavente",keyIssue:"Heat sink vendor delivery",category:"execution"},{name:"PVT",date:"2026-06-30",status:"pending",owner:"Benavente",keyIssue:"Line qualification readiness",category:"ttm"}],health:{t:"A",e:"R",m:"A",ts:[{l:"Design Maturity",s:"G",n:"Schematic Rev C done"},{l:"Verification",s:"A",n:"3 thermal hotspots"},{l:"Integration",s:"G",n:"128-port validated"},{l:"Quality",s:"A",n:"PI analysis needed"}],es:[{l:"Resources",s:"G",n:"22/22 staffed"},{l:"Budget",s:"R",n:"71% spent at 45% progress"},{l:"Gate Compliance",s:"G",n:"EVT passed"},{l:"Dependencies",s:"R",n:"Heat sink vendor delayed"}],ms:[{l:"Schedule",s:"A",n:"Commit 2wk after ASK"},{l:"Milestones",s:"A",n:"DVT at risk"},{l:"Critical Path",s:"A",n:"Assembly depends on vendor"},{l:"Market Window",s:"G",n:"Q2 holds with buffer"}]},issues:[{id:"i3",text:"Heat sink vendor delivery slipped — parallel-pathing Vendor C",sev:"C",by:"JB",dt:"2026-03-16"},{id:"i4",text:"Budget overrun: 71% spent at 45% progress — assembly costs higher",sev:"H",by:"MG",dt:"2026-03-15"}]},
  {id:"PRG-003",name:"SONiC NOS v4.0",type:"SW",subType:"PRD",currentPhase:"Active",owner:USERS[2],assignedBy:USERS[5],assignedDate:"2026-01-05",lastUpdate:"2026-03-18T08:00:00",deliveryAsk:"2026-07-31",deliveryCommit:"2026-07-31",desc:"Enterprise SONiC with enhanced SAI, ASIC-native telemetry, zero-touch provisioning, and multi-vendor NOS support.",progress:38,team:18,budget:"$6.4M",budgetUsed:32,mode:"active",spark:[5,10,15,22,28,33,38],milestones:[{name:"Alpha",date:"2026-04-30",status:"pending",owner:"Raman",keyIssue:"SAI 1.15 integration",category:"product"},{name:"Beta",date:"2026-06-15",status:"pending",owner:"Raman",keyIssue:"Telemetry perf benchmarks",category:"execution"},{name:"GA",date:"2026-07-31",status:"pending",owner:"Raman",keyIssue:"Multi-vendor compat testing",category:"ttm"}],health:{t:"G",e:"G",m:"G",ts:[{l:"Design Maturity",s:"G",n:"Architecture finalized"},{l:"Verification",s:"G",n:"CI green, 78% coverage"},{l:"Integration",s:"G",n:"SAI 1.15 integrated"},{l:"Quality",s:"G",n:"No P0 bugs"}],es:[{l:"Resources",s:"G",n:"18/18 staffed"},{l:"Budget",s:"G",n:"32% spent at 38% progress"},{l:"Gate Compliance",s:"G",n:"On track"},{l:"Dependencies",s:"G",n:"No blockers"}],ms:[{l:"Schedule",s:"G",n:"ASK = Commit"},{l:"Milestones",s:"G",n:"Alpha on track"},{l:"Critical Path",s:"G",n:"Telemetry module pacing"},{l:"Market Window",s:"G",n:"Q3 GA target holds"}]},issues:[]},
  {id:"PRG-004",name:"UALink Scale-Up Fabric",type:"HW",subType:"CRD",currentPhase:"New",owner:USERS[0],assignedBy:USERS[5],assignedDate:"2026-02-20",lastUpdate:"2026-03-15T11:00:00",deliveryAsk:"2027-01-15",deliveryCommit:"",desc:"Custom scale-up interconnect silicon for UALink standard. Memory-semantic load/store networking at nanosecond latency.",progress:12,team:8,budget:"$28M",budgetUsed:5,mode:"planning",spark:[0,2,5,7,9,10,12],milestones:[{name:"Spec-Review",date:"2026-03-30",status:"pending",owner:"Anabathula",keyIssue:"Architecture locked",category:"product"}],health:{t:"G",e:"G",m:"G",ts:[{l:"Design Maturity",s:"G",n:"Spec in review"},{l:"Verification",s:"G",n:"N/A — pre-RTL"},{l:"Integration",s:"G",n:"N/A — planning"},{l:"Quality",s:"G",n:"N/A — planning"}],es:[{l:"Resources",s:"G",n:"8/8 staffed"},{l:"Budget",s:"G",n:"5% spent — on plan"},{l:"Gate Compliance",s:"G",n:"Spec review pending"},{l:"Dependencies",s:"G",n:"UALink spec v0.9 available"}],ms:[{l:"Schedule",s:"G",n:"Long horizon — Jan 2027"},{l:"Milestones",s:"G",n:"Spec-Review on track"},{l:"Critical Path",s:"G",n:"Spec review gates all"},{l:"Market Window",s:"G",n:"2027 target comfortable"}]},issues:[]},
  {id:"PRG-005",name:"400G Optics Qual",type:"Customer",subType:"Project",currentPhase:"Blocked",owner:USERS[4],assignedBy:USERS[3],assignedDate:"2025-09-15",lastUpdate:"2026-03-14T15:30:00",deliveryAsk:"2026-04-30",deliveryCommit:"2026-05-30",desc:"Multi-vendor 400G QSFP-DD optics qualification for switch tray production compatibility.",progress:55,team:6,budget:"$1.2M",budgetUsed:82,mode:"active",spark:[15,25,35,40,48,52,55],milestones:[{name:"Thermal-Test",date:"2026-03-20",status:"done",owner:"Vij",keyIssue:"All vendors passed",category:"product"},{name:"SI-Test",date:"2026-04-10",status:"pending",owner:"Vij",keyIssue:"Vendor C eye diagram marginal",category:"execution"},{name:"Qual-Report",date:"2026-04-30",status:"pending",owner:"Vij",keyIssue:"Customer approval pending",category:"ttm"}],health:{t:"R",e:"A",m:"R",ts:[{l:"Design Maturity",s:"G",n:"Test plan complete"},{l:"Verification",s:"R",n:"3/5 vendors failed thermal"},{l:"Integration",s:"A",n:"2 vendors pass — need 3"},{l:"Quality",s:"R",n:"Thermal failures critical"}],es:[{l:"Resources",s:"G",n:"6/6 staffed"},{l:"Budget",s:"A",n:"82% spent at 55% progress"},{l:"Gate Compliance",s:"G",n:"Thermal test gate done"},{l:"Dependencies",s:"R",n:"Blocked on vendor modules"}],ms:[{l:"Schedule",s:"R",n:"Commit 1mo after ASK"},{l:"Milestones",s:"R",n:"SI-Test at risk"},{l:"Critical Path",s:"R",n:"Vendor qual on critical path"},{l:"Market Window",s:"A",n:"Production slot Q2"}]},issues:[{id:"i5",text:"3/5 vendor modules failed thermal cycling — Vendor B & D",sev:"C",by:"VV",dt:"2026-03-14"},{id:"i6",text:"Procurement escalation needed for replacement modules",sev:"C",by:"VV",dt:"2026-03-14"},{id:"i7",text:"Budget at 82% with retest cycles likely",sev:"H",by:"MG",dt:"2026-03-15"}]},
  {id:"PRG-006",name:"AI Fabric Orchestrator",type:"SW",subType:"MRD",currentPhase:"Active",owner:USERS[2],assignedBy:USERS[3],assignedDate:"2025-07-20",lastUpdate:"2026-03-17T10:00:00",deliveryAsk:"2026-05-15",deliveryCommit:"2026-05-15",desc:"Centralized orchestration platform for heterogeneous AI cluster fabric management and topology optimization.",progress:70,team:14,budget:"$4.8M",budgetUsed:65,mode:"active",spark:[20,30,40,50,58,65,70],milestones:[{name:"API-Freeze",date:"2026-03-30",status:"done",owner:"Raman",keyIssue:"API stable, docs complete",category:"product"},{name:"Integration",date:"2026-04-15",status:"pending",owner:"Raman",keyIssue:"E2E testing with SkyHammer",category:"execution"},{name:"Release",date:"2026-05-15",status:"pending",owner:"Raman",keyIssue:"Perf benchmarks on target",category:"ttm"}],health:{t:"G",e:"A",m:"G",ts:[{l:"Design Maturity",s:"G",n:"API frozen, arch stable"},{l:"Verification",s:"G",n:"85% test coverage"},{l:"Integration",s:"G",n:"Multi-vendor tested"},{l:"Quality",s:"G",n:"0 P0, 2 P1 open"}],es:[{l:"Resources",s:"G",n:"14/14 staffed"},{l:"Budget",s:"A",n:"65% spent at 70% progress"},{l:"Gate Compliance",s:"G",n:"API-Freeze gate passed"},{l:"Dependencies",s:"G",n:"No blockers"}],ms:[{l:"Schedule",s:"G",n:"ASK = Commit"},{l:"Milestones",s:"G",n:"Integration on track"},{l:"Critical Path",s:"G",n:"Topology optimizer done"},{l:"Market Window",s:"G",n:"Q2 release holds"}]},issues:[{id:"i8",text:"Budget tracking slightly ahead — monitor integration testing costs",sev:"M",by:"MG",dt:"2026-03-17"}]},
  {id:"PRG-007",name:"Vega 8 Scale-Out NPI",type:"NPI",subType:"",currentPhase:"Active",owner:USERS[0],assignedBy:USERS[5],assignedDate:"2026-01-15",lastUpdate:"2026-03-27T10:00:00",deliveryAsk:"2026-12-01",deliveryCommit:"2027-01-15",desc:"Vega 8 S4 51.2T Scale-Out Spine/Leaf NPI program. Full HW + SW timeline from Tape Out through GA with Beta, Pilot, FRS milestones. Business drivers: Neo, ENT.",progress:15,team:28,budget:"$32M",budgetUsed:12,mode:"active",spark:[2,5,8,10,12,14,15],milestones:[{name:"Tape Out",date:"2026-03-15",status:"done",owner:"RK",category:"product",score:95},{name:"P1A PO & Bring-up",date:"2026-04-15",status:"pending",owner:"RK",keyIssue:"Awaiting S4 ASIC shipment confirmation",category:"execution",score:65},{name:"Pwr Opt UT",date:"2026-03-31",status:"done",owner:"Santhosh",category:"product",score:90},{name:"4 UT Complete",date:"2026-04-17",status:"pending",owner:"Santhosh",keyIssue:"ARS, Telemetry, Debug unit tests",category:"product",score:75},{name:"Super SONiC UT",date:"2026-05-30",status:"pending",owner:"Santhosh",keyIssue:"90% code coverage target",category:"product",score:82},{name:"EVT Start",date:"2026-06-01",status:"pending",owner:"RK",keyIssue:"Engineering validation testing",category:"execution",score:75},{name:"Telemetry FT",date:"2026-06-30",status:"pending",owner:"Santhosh",category:"product",score:85},{name:"Beta",date:"2026-07-01",status:"pending",owner:"RK",keyIssue:"Lab Qual Ready — 2-4 units",category:"ttm",score:70},{name:"P2 Build & Test",date:"2026-08-01",status:"pending",owner:"RK",keyIssue:"EVT continues",category:"execution",score:72},{name:"Demo",date:"2026-08-15",status:"pending",owner:"Santhosh",keyIssue:"Architecture DS, SS KPIs, DNN Pwr Ctrl, ARS w/Congestion Control",category:"execution",score:78},{name:"Pilot",date:"2026-10-21",status:"pending",owner:"RK",keyIssue:"Near Prod Grade — LHS Customer Qual — ~30 units",category:"ttm",score:68},{name:"FRS",date:"2026-11-01",status:"pending",owner:"RK",keyIssue:"Prod Grade — Low volume deployment ~40 units",category:"ttm",score:72},{name:"GA",date:"2027-01-15",status:"pending",owner:"RK",keyIssue:"Prod Grade — Ramp Up ~200 units",category:"ttm",score:75}],health:{t:"A",e:"A",m:"A",ts:[{l:"Design Maturity",s:"G",n:"Tape out complete"},{l:"Verification",s:"A",n:"UT 1/8 complete + baselines 3/17"},{l:"Integration",s:"A",n:"S4 ASIC shipment unconfirmed"},{l:"Quality",s:"G",n:"QA on track"}],es:[{l:"Resources",s:"G",n:"28/28 staffed"},{l:"Budget",s:"G",n:"12% spent at 15% progress"},{l:"Gate Compliance",s:"G",n:"Tape out gate passed"},{l:"Dependencies",s:"R",n:"S4 ASIC monthly shipment needed"}],ms:[{l:"Schedule",s:"A",n:"Commit 6wk after ASK"},{l:"Milestones",s:"A",n:"DC-SCM & FPGA schedule risks"},{l:"Critical Path",s:"A",n:"S4 ASIC shipment gates downstream"},{l:"Market Window",s:"A",n:"GA shifted from Dec to Jan"}]},issues:[{id:"i9",text:"Need monthly S4 ASIC shipment for P1B, P2, Pilot, FRS — working with Nvidia",sev:"C",by:"AA",dt:"2026-03-27"},{id:"i10",text:"DC-SCM shipment ETA = TBD — working with supplier to pull-in schedule",sev:"H",by:"AA",dt:"2026-03-27"},{id:"i11",text:"FPGA schedule risk — need new hire (TBH)",sev:"H",by:"AA",dt:"2026-03-27"},{id:"i12",text:"Skyworks clock generator for switch board — expediting",sev:"M",by:"AA",dt:"2026-03-27"}]},
];

const _COMMENTS: Comment[] = [
  {id:"c1",eId:"PRG-001",author:USERS[0],body:"RTL freeze target solid. DV coverage at 87% — need 95% before tapeout gate.",ts:"2026-03-17T09:30:00",resolved:false,likes:["u4","u6"]},
  {id:"c2",eId:"PRG-001",author:USERS[3],body:"@Vikram DV coverage breakdown by module? Flag blocks below 80%.",ts:"2026-03-17T10:15:00",resolved:false,likes:["u1"]},
  {id:"c3",eId:"PRG-002",author:USERS[1],body:"Thermal sim: 3 hotspots on main board. Redesigning heat sink — pushes assembly ~1 week.",ts:"2026-03-16T14:00:00",resolved:false,likes:[]},
  {id:"c4",eId:"PRG-002",author:USERS[6],body:"@Sarah vendor confirmed revised heat sinks Mar 25. Parallel-path?",ts:"2026-03-16T16:30:00",resolved:false,likes:["u2","u4"]},
  {id:"c5",eId:"PRG-003",author:USERS[2],body:"SAI 1.15 integration complete. Starting telemetry module. CI green.",ts:"2026-03-18T08:00:00",resolved:false,likes:["u4","u6","u5"]},
  {id:"c6",eId:"PRG-004",author:USERS[5],body:"Still in planning. Finalize spec review before March 30.",ts:"2026-03-15T11:00:00",resolved:false,likes:[]},
  {id:"c7",eId:"PRG-005",author:USERS[4],body:"3/5 vendor modules failed thermal cycling. Escalating procurement.",ts:"2026-03-14T13:00:00",resolved:false,likes:["u7"]},
];

const _REPLIES: Reply[] = [
  {id:"r1",cId:"c1",author:USERS[3],body:"Share coverage report from Drive?",ts:"2026-03-17T10:00:00",likes:["u1"]},
  {id:"r2",cId:"c1",author:USERS[0],body:"Uploaded: /SkyHammer/DV/coverage_w11.pdf — 3 blocks < 90%.",ts:"2026-03-17T11:30:00",likes:["u4","u6"]},
  {id:"r3",cId:"c3",author:USERS[3],body:"1-week slip absorbed in buffer. @Sarah update Gantt.",ts:"2026-03-16T15:00:00",likes:["u2"]},
  {id:"r4",cId:"c7",author:USERS[6],body:"Setting up vendor call. @David which modules?",ts:"2026-03-14T14:00:00",likes:[]},
  {id:"r5",cId:"c7",author:USERS[4],body:"Vendor B & D. Reports in /Optics_Qual/thermal/.",ts:"2026-03-14T15:30:00",likes:["u7"]},
];

const _NOTIFICATIONS: Notification[] = [
  {id:"n1",type:"mention",from:USERS[0],text:"mentioned you in SkyHammer ASIC v1",ts:"2026-03-18T11:30:00",read:false},
  {id:"n2",type:"reply",from:USERS[1],text:"replied to your comment on Switch Tray",ts:"2026-03-17T16:00:00",read:false},
  {id:"n3",type:"gate",from:USERS[4],text:"updated gate checklist on 400G Optics Qual",ts:"2026-03-17T10:00:00",read:false},
  {id:"n4",type:"like",from:USERS[5],text:"liked your comment on SkyHammer ASIC v1",ts:"2026-03-16T14:30:00",read:true},
  {id:"n5",type:"status",from:USERS[2],text:"changed SONiC NOS v4.0 to On Track",ts:"2026-03-16T09:00:00",read:true},
];

const _TASKS: Task[] = [
  {id:"TK-001",title:"Complete DV coverage for SerDes block",prgId:"PRG-001",assignee:USERS[0],reporter:USERS[3],priority:"P0",status:"In Progress",due:"2026-04-01",desc:"Close remaining DV coverage gaps on SerDes block — currently at 82%, target 95%."},
  {id:"TK-002",title:"Run CDC analysis on clock domain crossings",prgId:"PRG-001",assignee:USERS[0],reporter:USERS[3],priority:"P0",status:"Todo",due:"2026-04-05",desc:"Full CDC analysis required before RTL freeze sign-off."},
  {id:"TK-003",title:"Review thermal simulation results",prgId:"PRG-002",assignee:USERS[1],reporter:USERS[3],priority:"P1",status:"In Review",due:"2026-03-25",desc:"Analyze 3 hotspot locations and validate redesigned heat sink placement."},
  {id:"TK-004",title:"Qualify alternate heat sink vendor",prgId:"PRG-002",assignee:USERS[6],reporter:USERS[1],priority:"P1",status:"Todo",due:"2026-03-28",desc:"Evaluate Vendor C as backup heat sink supplier if Vendor A delivery slips."},
  {id:"TK-005",title:"Implement ASIC-native telemetry module",prgId:"PRG-003",assignee:USERS[2],reporter:USERS[3],priority:"P0",status:"In Progress",due:"2026-04-15",desc:"SONiC telemetry module integrating with SAI 1.15 for real-time ASIC metrics."},
  {id:"TK-006",title:"Write zero-touch provisioning tests",prgId:"PRG-003",assignee:USERS[4],reporter:USERS[2],priority:"P1",status:"Todo",due:"2026-04-20",desc:"End-to-end tests for ZTP workflow — DHCP discovery, image download, config apply."},
  {id:"TK-007",title:"Draft UALink architecture spec",prgId:"PRG-004",assignee:USERS[0],reporter:USERS[5],priority:"P0",status:"In Progress",due:"2026-03-30",desc:"Define load/store memory semantics, topology options, and bandwidth targets."},
  {id:"TK-008",title:"Escalate Vendor B thermal failures",prgId:"PRG-005",assignee:USERS[4],reporter:USERS[6],priority:"P0",status:"In Progress",due:"2026-03-22",desc:"Schedule vendor call, request root cause analysis, negotiate replacement timeline."},
  {id:"TK-009",title:"Run 72-hour stress test on Vendor A modules",prgId:"PRG-005",assignee:USERS[4],reporter:USERS[3],priority:"P1",status:"Todo",due:"2026-04-01",desc:"Thermal cycling + sustained traffic test on the two passing Vendor A optics modules."},
  {id:"TK-010",title:"Implement topology optimization algorithm",prgId:"PRG-006",assignee:USERS[2],reporter:USERS[3],priority:"P1",status:"In Review",due:"2026-03-28",desc:"Fat-tree topology optimizer for heterogeneous xPU clusters — minimize hop count."},
  {id:"TK-011",title:"Integration test orchestrator API endpoints",prgId:"PRG-006",assignee:USERS[4],reporter:USERS[2],priority:"P1",status:"Todo",due:"2026-04-05",desc:"Full API integration test suite covering cluster create, modify, teardown flows."},
  {id:"TK-012",title:"Power integrity analysis for switch tray",prgId:"PRG-002",assignee:USERS[1],reporter:USERS[3],priority:"P0",status:"Done",due:"2026-03-15",desc:"Verify all voltage rails meet ripple and transient specs under full load."},
];

const _IMPL: ImplPhase[] = [
  {id:"P1",name:"Foundation & Auth",wk:"1–3",items:[{id:"t1",t:"React + TS + Tailwind setup",o:"Frontend",s:"Pending"},{id:"t2",t:"Google Cloud + Workspace APIs",o:"DevOps",s:"Pending"},{id:"t3",t:"OAuth 2.0 SSO",o:"Backend",s:"Pending"},{id:"t4",t:"RBAC middleware",o:"Backend",s:"Pending"},{id:"t5",t:"Firestore schema",o:"Backend",s:"Pending"},{id:"t6",t:"CRUD endpoints",o:"Backend",s:"Pending"},{id:"t7",t:"Nav shell + layout",o:"Frontend",s:"Pending"},{id:"t8",t:"Audit logging",o:"Backend",s:"Pending"},{id:"t9",t:"P1 gate review",o:"PM",s:"Pending"}],gc:["SSO verified","RBAC enforced","CRUD working","Responsive layout","Audit active"]},
  {id:"P2",name:"Plan Mode",wk:"4–6",items:[{id:"t10",t:"Plan Mode toggle",o:"Frontend",s:"Pending"},{id:"t11",t:"Timeline editor",o:"Frontend",s:"Pending"},{id:"t12",t:"Milestone + gates",o:"Full Stack",s:"Pending"},{id:"t13",t:"Dependency mapping",o:"Frontend",s:"Pending"},{id:"t14",t:"Activation + Drive",o:"Backend",s:"Pending"},{id:"t15",t:"Plan-vs-Actual",o:"Frontend",s:"Pending"},{id:"t16",t:"P2 gate review",o:"PM",s:"Pending"}],gc:["Toggle works","Phase CRUD","Milestones","Dependencies","Activation","Plan-vs-Actual"]},
  {id:"P3",name:"Collaboration",wk:"7–9",items:[{id:"t17",t:"Comments",o:"Frontend",s:"Pending"},{id:"t18",t:"Threaded replies",o:"Full Stack",s:"Pending"},{id:"t19",t:"Likes/reactions",o:"Full Stack",s:"Pending"},{id:"t20",t:"@mention",o:"Full Stack",s:"Pending"},{id:"t21",t:"Notifications",o:"Frontend",s:"Pending"},{id:"t22",t:"Activity feed",o:"Frontend",s:"Pending"},{id:"t23",t:"Resolution",o:"Full Stack",s:"Pending"},{id:"t24",t:"P3 gate review",o:"PM",s:"Pending"}],gc:["Comments on entities","Nested replies","Optimistic likes","@mention notifies","Feed correct","Resolve filter"]},
  {id:"P4",name:"Gate Verification",wk:"10–12",items:[{id:"t25",t:"Checklist builder",o:"Frontend",s:"Pending"},{id:"t26",t:"Checklist execution",o:"Full Stack",s:"Pending"},{id:"t27",t:"Scorecard",o:"Frontend",s:"Pending"},{id:"t28",t:"Blocking + waiver",o:"Backend",s:"Pending"},{id:"t29",t:"Gate approval",o:"Full Stack",s:"Pending"},{id:"t30",t:"Review history",o:"Full Stack",s:"Pending"},{id:"t31",t:"P4 gate review",o:"PM",s:"Pending"}],gc:["Items complete","Status updates","Blocking logic","Waiver justification","Approval flow","History view"]},
  {id:"P5",name:"Dashboards & GWS",wk:"13–16",items:[{id:"t32",t:"Exec dashboard",o:"Frontend",s:"Pending"},{id:"t33",t:"Gantt chart",o:"Frontend",s:"Pending"},{id:"t34",t:"Drive integration",o:"Backend",s:"Pending"},{id:"t35",t:"Calendar sync",o:"Backend",s:"Pending"},{id:"t36",t:"Gmail notifs",o:"Backend",s:"Pending"},{id:"t37",t:"Sheets export",o:"Backend",s:"Pending"},{id:"t38",t:"P5 gate review",o:"PM",s:"Pending"}],gc:["< 2s load","Gantt deps","Drive folders","Calendar events","Emails send","Sheets export"]},
  {id:"P6",name:"Launch",wk:"17–20",items:[{id:"t39",t:"Perf optimization",o:"DevOps",s:"Pending"},{id:"t40",t:"Security audit",o:"Security",s:"Pending"},{id:"t41",t:"UAT pilots",o:"PM + QA",s:"Pending"},{id:"t42",t:"Data migration",o:"Backend",s:"Pending"},{id:"t43",t:"Prod deploy",o:"DevOps",s:"Pending"},{id:"t44",t:"Documentation",o:"Writer",s:"Pending"},{id:"t45",t:"Launch approval",o:"PM + VP",s:"Pending"}],gc:["P95 < 200ms","No criticals","3 UAT sign-offs","Migration OK","Monitoring","Docs live"]},
];

const _DOCS: Doc[] = [
  {id:"d1",prgId:"PRG-001",name:"SkyHammer Architecture Spec v3.2",type:"sheet",url:"https://docs.google.com/spreadsheets/d/1abc",addedBy:USERS[0],addedAt:"2026-03-10T09:00:00",category:"Specs"},
  {id:"d2",prgId:"PRG-001",name:"DV Coverage Dashboard",type:"sheet",url:"https://docs.google.com/spreadsheets/d/2def",addedBy:USERS[0],addedAt:"2026-03-15T14:00:00",category:"Verification"},
  {id:"d3",prgId:"PRG-001",name:"SerDes IP Integration Guide",type:"doc",url:"https://docs.google.com/document/d/3ghi",addedBy:USERS[3],addedAt:"2026-02-20T10:00:00",category:"Design"},
  {id:"d4",prgId:"PRG-002",name:"Switch Tray BOM v2.1",type:"sheet",url:"https://docs.google.com/spreadsheets/d/4jkl",addedBy:USERS[1],addedAt:"2026-03-12T11:00:00",category:"BOM"},
  {id:"d5",prgId:"PRG-002",name:"Thermal Simulation Results",type:"sheet",url:"https://docs.google.com/spreadsheets/d/5mno",addedBy:USERS[1],addedAt:"2026-03-16T14:30:00",category:"Thermal"},
  {id:"d6",prgId:"PRG-002",name:"Mechanical Drawing Rev C",type:"link",url:"https://drive.google.com/file/d/6pqr",addedBy:USERS[1],addedAt:"2026-03-01T09:00:00",category:"Design"},
  {id:"d7",prgId:"PRG-003",name:"SONiC SAI 1.15 API Reference",type:"doc",url:"https://docs.google.com/document/d/7stu",addedBy:USERS[2],addedAt:"2026-03-05T08:00:00",category:"API"},
  {id:"d8",prgId:"PRG-003",name:"Telemetry Feature Spec",type:"doc",url:"https://docs.google.com/document/d/8vwx",addedBy:USERS[2],addedAt:"2026-03-18T08:30:00",category:"Specs"},
  {id:"d9",prgId:"PRG-005",name:"Optics Thermal Cycling Results",type:"sheet",url:"https://docs.google.com/spreadsheets/d/9yza",addedBy:USERS[4],addedAt:"2026-03-14T13:00:00",category:"Testing"},
  {id:"d10",prgId:"PRG-006",name:"Orchestrator API Schema",type:"sheet",url:"https://docs.google.com/spreadsheets/d/10bc",addedBy:USERS[2],addedAt:"2026-03-17T10:00:00",category:"API"},
];

/* ═══ SEED-conditional exports ═══ */
export const INITIAL_PROGRAMS: Program[] = SEED ? _PROGRAMS : [];
export const INITIAL_COMMENTS: Comment[] = SEED ? _COMMENTS : [];
export const INITIAL_REPLIES: Reply[] = SEED ? _REPLIES : [];
export const INITIAL_NOTIFICATIONS: Notification[] = SEED ? _NOTIFICATIONS : [];
export const INITIAL_TASKS: Task[] = SEED ? _TASKS : [];
export const INITIAL_IMPL: ImplPhase[] = SEED ? _IMPL : [];
export const INITIAL_DOCS: Doc[] = SEED ? _DOCS : [];
