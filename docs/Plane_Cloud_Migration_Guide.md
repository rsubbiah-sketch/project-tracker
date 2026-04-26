# UpscaleAI Project Tracker - Plane Cloud Migration Guide

**Document Version:** 1.0
**Date:** April 6, 2026
**Author:** UpscaleAI Engineering
**Status:** Draft
plane_api_041747cd890841a1bf5f49f10a2eca0a
---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Workspace & Project Structure](#2-workspace--project-structure)
3. [State Mappings](#3-state-mappings)
4. [Priority Mapping](#4-priority-mapping)
5. [Label Taxonomy](#5-label-taxonomy)
6. [Custom Properties](#6-custom-properties)
7. [Modules & Cycles](#7-modules--cycles)
8. [Issue Templates](#8-issue-templates)
9. [Workflow Configuration](#9-workflow-configuration)
10. [Member & Role Mapping](#10-member--role-mapping)
11. [Migration Steps](#11-migration-steps)
12. [Plane API Integration & Automation Scripts](#12-plane-api-integration--automation-scripts)
13. [Feature Gap Analysis & Workarounds](#13-feature-gap-analysis--workarounds)
14. [Appendix: Entity Inventory](#14-appendix-entity-inventory)

---

## 1. Executive Summary

UpscaleAI currently operates a custom-built project tracker (React/TypeScript frontend + Express/Firestore backend) for managing AI networking infrastructure programs including ASICs, switch trays, SONiC NOS, and AI network fabrics. This document provides a comprehensive migration plan to move all project tracking, task management, gate reviews, and issue tracking into **Plane cloud** (plane.so).

### Scope

| Entity Type | Count | Destination |
|---|---|---|
| Programs | 7 | Plane Projects |
| Tasks | 12 | Plane Issues |
| Action Items | TBD (dynamic) | Plane Issues (ACT project) |
| Implementation Phases | 6 (45 tasks) | Plane Cycles |
| Gate Checklists | 20 phases across 3 types | Plane Modules |
| Program Issues | 9 | Plane Issues |
| Users | 7 core + admin | Plane Members |
| Comments / Replies | 7 / 5 | Plane Issue Comments |
| Program Members | 16 role assignments | Plane Project Members |
| Program Metrics | 6 scorecards | Custom Properties |

---

## 2. Workspace & Project Structure

### 2.1 Workspace

Create a single Plane workspace:
- **Name:** UpscaleAI
- **Slug:** `upscaleai`
- **URL:** `https://app.plane.so/upscaleai/`

### 2.2 Projects

Each UpscaleAI "Program" maps to a Plane project. Two additional cross-cutting projects handle entities that are not program-scoped.

| # | Plane Project Name | Identifier | Source Entity | Program Type |
|---|---|---|---|---|
| 1 | SkyHammer ASIC v1 | `SKY` | PRG-001 | HW (ASIC) |
| 2 | Spectrum-X Switch Tray | `SXT` | PRG-002 | HW |
| 3 | SONiC NOS v4.0 | `NOS` | PRG-003 | SW |
| 4 | UALink Scale-Up Fabric | `UAL` | PRG-004 | HW |
| 5 | 400G Optics Qual | `OPT` | PRG-005 | Customer |
| 6 | AI Fabric Orchestrator | `AFO` | PRG-006 | SW |
| 7 | Vega 8 Scale-Out NPI | `VGA` | PRG-007 | NPI |
| 8 | Action Items | `ACT` | Cross-org action items | - |
| 9 | Tracker Implementation | `IMP` | Internal roadmap | - |

### 2.3 Naming Conventions

- **Project identifiers:** 3-letter uppercase codes. Plane auto-generates issue IDs (e.g., `SKY-1`, `SKY-2`).
- **Legacy ID preservation:** Store the original tracker ID (TK-001, AI-001, PRG-001) in a custom text property called `Legacy ID` on every migrated issue.
- **Project descriptions:** Populate from the `desc` / `description` field of each program record.

---

## 3. State Mappings

### 3.1 Task States (Program Projects)

Source: `src/types.ts` Task interface, backend `tasks` route.

| Tracker Status | Plane State | Plane State Group | Color |
|---|---|---|---|
| Todo | Todo | `unstarted` | Grey |
| In Progress | In Progress | `started` | Orange |
| In Review | In Review | `started` | Blue |
| Blocked | Blocked | `started` | Red |
| Done | Done | `completed` | Green |

### 3.2 Action Item States (ACT Project)

Source: `src/types.ts` ActionItem interface.

| Tracker Status | Plane State | Plane State Group |
|---|---|---|
| Open | Open | `unstarted` |
| In Progress | In Progress | `started` |
| In Review | In Review | `started` |
| Done | Done | `completed` |
| Closed | Closed | `cancelled` |

### 3.3 Program Issue States (Program Projects)

Source: `upscale-tracker-backend/src/routes/program-issues.js`.

| Tracker Status | Plane State | Plane State Group |
|---|---|---|
| open | Open | `unstarted` |
| in_progress | In Progress | `started` |
| escalated | Escalated | `started` |
| resolved | Resolved | `completed` |
| closed | Closed | `cancelled` |

### 3.4 Gate Item States

Gate items use a custom `Gate Status` select property (not Plane issue states):
- Pending, Passed, Failed, Waived, In Progress

### 3.5 Implementation Task States (IMP Project)

| Tracker Status | Plane State | Plane State Group |
|---|---|---|
| Pending | Todo | `unstarted` |
| In Progress | In Progress | `started` |
| Done | Done | `completed` |
| Blocked | Blocked | `started` |

### 3.6 Unified State Configuration per Program Project

Since tasks, issues, and gate reviews coexist within program projects, configure the full state list:

1. Backlog (`backlog`) - Plane default
2. Todo (`unstarted`)
3. Open (`unstarted`)
4. In Progress (`started`)
5. In Review (`started`)
6. Blocked (`started`)
7. Escalated (`started`)
8. Done (`completed`)
9. Resolved (`completed`)
10. Closed (`cancelled`)
11. Cancelled (`cancelled`) - Plane default

---

## 4. Priority Mapping

| Tracker Priority | Label | Plane Priority | Plane Icon |
|---|---|---|---|
| P0 | Critical | Urgent | Red double-arrow |
| P1 | High | High | Orange arrow-up |
| P2 | Medium | Medium | Yellow bar |
| P3 | Low | Low | Blue arrow-down |
| (unset) | - | None | Grey dash |

Applies to: Tasks, Action Items, Program Issues.

For Program Issues, the `severity` field (critical/high/medium/low) is stored as a separate custom property since Plane priority already serves the main priority purpose.

---

## 5. Label Taxonomy

### 5.1 Issue Type Labels

| Label | Color (Hex) | Purpose |
|---|---|---|
| `Task` | `#3b82f6` (Blue) | Standard program tasks (TK-xxx) |
| `Action Item` | `#8b5cf6` (Purple) | Cross-org action items |
| `Bug/Issue` | `#ef4444` (Red) | Program issues with severity |
| `Gate Review` | `#f59e0b` (Amber) | Gate checklist parent issues |
| `Gate Criteria` | `#d97706` (Dark Amber) | Individual gate checklist entries |
| `Milestone` | `#06b6d4` (Cyan) | Milestone tracking |
| `Impl Task` | `#6366f1` (Indigo) | Implementation roadmap tasks |

### 5.2 Program Type Labels

| Label | Color (Hex) |
|---|---|
| `Type: HW` | `#3b82f6` |
| `Type: SW` | `#22c55e` |
| `Type: NPI` | `#a855f7` |
| `Type: Customer` | `#f97316` |

### 5.3 Severity Labels (Program Issues)

| Label | Color (Hex) |
|---|---|
| `Sev: Critical` | `#dc2626` |
| `Sev: High` | `#f59e0b` |
| `Sev: Medium` | `#3b82f6` |
| `Sev: Low` | `#6b7280` |

### 5.4 Action Item Tag Labels

Migrate existing `tags` from action items as workspace labels with `Tag:` prefix to avoid conflicts (e.g., `Tag: vendor`, `Tag: thermal`). Create on-demand during migration.

---

## 6. Custom Properties

### 6.1 Workspace-Level Custom Properties

| Property Name | Type | Description | Source Field |
|---|---|---|---|
| `Legacy ID` | Text | Original tracker ID (TK-001, AI-001, etc.) | Various `.id` fields |
| `Program Type` | Select: HW, SW, NPI, Customer | Program classification | `Program.type` |
| `Reporter` | Member | Explicit reporter (person who created) | `Task.reporter`, `ActionItem.reporter` |

### 6.2 Program Project Custom Properties

| Property Name | Type | Values / Description | Source Field |
|---|---|---|---|
| `Program Mode` | Select | `Planning`, `Active` | `Program.mode` |
| `Program Status` | Select | `On Track`, `At Risk`, `Off Track`, `Blocked` | `Program.status` (derived from health) |
| `Current Phase` | Select | `New`, `Active`, `Waiting`, `Blocked`, `Complete` | `Program.currentPhase` |
| `Budget` | Text | e.g., "$48.2M" | `Program.budget` |
| `Budget Used %` | Number (0-100) | Percentage of budget consumed | `Program.budgetUsed` |
| `Progress %` | Number (0-100) | Overall program progress | `Program.progress` |
| `Team Size` | Number | Headcount | `Program.team` |
| `Delivery Ask` | Date | Requested delivery date | `Program.deliveryAsk` |
| `Delivery Commit` | Date | Committed delivery date | `Program.deliveryCommit` |
| `Health: Technical` | Select | `G` (Green), `A` (Amber), `R` (Red) | `Program.health.t` |
| `Health: Execution` | Select | `G`, `A`, `R` | `Program.health.e` |
| `Health: Time-to-Market` | Select | `G`, `A`, `R` | `Program.health.m` |
| `Schedule Score` | Number (0-100) | Schedule health score | `ProgramMetrics.schedule.score` |
| `Budget Score` | Number (0-100) | Budget health score | `ProgramMetrics.budget.score` |
| `Risk Score` | Number (0-100) | Risk health score | `ProgramMetrics.risk.score` |
| `Composite Score` | Number (0-100) | Average of above scores | `ProgramMetrics.composite` |

### 6.3 Gate Review Custom Properties

| Property Name | Type | Values | Source |
|---|---|---|---|
| `Gate Phase` | Select | Phase names from `GATES` constant per type | `GatePhase.ph` |
| `Gate Status` | Select | `Pending`, `Passed`, `Failed`, `Waived`, `In Progress` | `gateStatuses` collection |
| `Gate Approved By` | Member | Approver | `gateReviews` collection |
| `Gate Approval Date` | Date | Approval timestamp | `gateReviews` collection |

### 6.4 Program Issue Custom Properties

| Property Name | Type | Description | Source |
|---|---|---|---|
| `Issue Severity` | Select | `critical`, `high`, `medium`, `low` | `ProgramIssue.severity` |
| `Escalated By` | Member | Who escalated | `ProgramIssue.escalatedById` |
| `Escalation Date` | Date | When escalated | `ProgramIssue.escalatedAt` |
| `Escalation Note` | Text | Reason for escalation | `ProgramIssue.escalationNote` |
| `Resolved By` | Member | Who resolved | `ProgramIssue.resolvedById` |
| `Resolution Date` | Date | When resolved | `ProgramIssue.resolvedAt` |
| `Resolution` | Text | Resolution description | `ProgramIssue.resolution` |

### 6.5 Action Item Custom Properties (ACT Project)

| Property Name | Type | Description | Source |
|---|---|---|---|
| `Team Assignment` | Multi-Member | Supports team-based assignment | `ActionItem.team` / `teamIds` |
| `Visibility` | Select | `All`, `Restricted` | Derived from assignment |

### 6.6 Implementation Task Custom Properties (IMP Project)

| Property Name | Type | Values | Source |
|---|---|---|---|
| `Owner Area` | Select | Frontend, Backend, Full Stack, DevOps, PM, QA, Security, Writer, PM + QA, PM + VP | `ImplTask.o` |
| `Week Range` | Text | e.g., "1-3" | `ImplPhase.wk` |

---

## 7. Modules & Cycles

### 7.1 Gate Phases as Modules (per Program Project)

Modules are persistent, non-time-boxed groupings that match the gate phase concept. Gate definitions come from `src/data/gates.ts`.

#### ASIC Gates (SKY project)

| Module Name | Checklist Items |
|---|---|
| Spec Gate | Architecture spec reviewed, Power budget approved, Foundry selected, Risk register created |
| RTL Gate | RTL complete, Lint clean, CDC passed, Synthesis met |
| Verification Gate | DV plan approved, Coverage > 95%, P0 bugs closed, Formal verification done, Regression green |
| Tapeout Gate | GDS sign-off, DRC/LVS clean, Timing closure, Package finalized, Foundry PO issued |
| Bring-up Gate | First silicon received, Basic I/O functional, PLL lock verified, SerDes link-up |
| Characterization Gate | Full speed, Power in budget, Thermal OK, Interfaces validated |
| Production Gate | Yield targets, Test program ready, Qual report signed, Samples shipped |

#### Hardware Gates (SXT, UAL projects)

| Module Name | Checklist Items |
|---|---|
| Schematic Gate | Schematic review, BOM finalized, Power tree, SI sim |
| Layout Gate | Layout review, DFM passed, Gerbers, Fab PO |
| Fabrication Gate | Boards received, Visual inspection, Impedance test |
| Assembly Gate | SMT complete, X-ray, Power-on test |
| Bring-up Gate | Rails measured, Clock verified, Links up, Thermal OK |
| Validation Gate | Full test, 72hr stress, EMC pre-scan, Eval shipped |
| Production Gate | Line qualified, Yield > 95%, UL/CE |

#### Software Gates (NOS, AFO projects)

| Module Name | Checklist Items |
|---|---|
| Planning Gate | Requirements, Architecture, Sprint plan |
| Development Gate | Core features, Unit test > 80%, Code review |
| Integration Gate | API tested, E2E passing, Perf benchmarks |
| Testing Gate | QA executed, P0/P1 fixed, Regression, Security scan |
| Staging Gate | Deploy OK, UAT sign-off, Rollback doc |
| Release Gate | Prod OK, Monitoring, Release notes |

#### Type Fallback Logic

- **Customer** type (OPT) and **NPI** type (VGA) use **Software** gates as default (per `gate-items.js` fallback: `GATES[program.type] || GATES.Software`).

Within each module, create one issue per checklist item labeled `Gate Criteria`, with the `Gate Status` custom property set to `Pending`.

### 7.2 Implementation Phases as Cycles (IMP Project)

| Cycle Name | Week Range | # Tasks | Gate Criteria |
|---|---|---|---|
| Foundation & Auth | Wk 1-3 | 9 | SSO verified, RBAC enforced, CRUD working, Responsive layout, Audit active |
| Plan Mode | Wk 4-6 | 7 | Toggle works, Phase CRUD, Milestones, Dependencies, Activation, Plan-vs-Actual |
| Collaboration | Wk 7-9 | 8 | Comments on entities, Nested replies, Optimistic likes, @mention notifies, Feed correct, Resolve filter |
| Gate Verification | Wk 10-12 | 7 | Items complete, Status updates, Blocking logic, Waiver justification, Approval flow, History view |
| Dashboards & GWS | Wk 13-16 | 7 | < 2s load, Gantt deps, Drive folders, Calendar events, Emails send, Sheets export |
| Launch | Wk 17-20 | 7 | P95 < 200ms, No criticals, 3 UAT sign-offs, Migration OK, Monitoring, Docs live |

**Total:** 45 implementation tasks + 35 gate criteria items.

### 7.3 Milestones as Issues

Model milestones as issues within each program project, labeled `Milestone`, with:
- Due date = milestone date
- Status: `Done` if `status === "done"`, else `Todo`
- Description captures: `keyIssue`, `owner`, `category`, and `score`

Program milestone counts: PRG-001 (3), PRG-002 (3), PRG-003 (3), PRG-004 (1), PRG-005 (3), PRG-006 (3), PRG-007 (13). **Total: 29 milestones.**

---

## 8. Issue Templates

### 8.1 Program Task Template

```
Title: [Task Title]
Labels: Task, Type: [HW|SW|NPI|Customer]
Priority: [Mapped from P0-P3]
State: Todo
Assignee: [Mapped user]
Due Date: [ISO date]
Custom Properties:
  Legacy ID: TK-XXX
  Reporter: [user]
Description:
  [Task description text]

  ---
  Program: [name] | Original ID: [TK-XXX]
```

### 8.2 Action Item Template

```
Title: [Title]
Labels: Action Item
Priority: [Mapped from P0-P3]
State: Open
Project: ACT
Assignee: [Primary assignee, if any]
Due Date: [ISO date]
Custom Properties:
  Legacy ID: AI-XXX
  Team Assignment: [team members]
  Visibility: Restricted
Description:
  [Description text]

  Tags: [comma-separated tags]
```

### 8.3 Gate Review Template

```
Title: [Phase Name] Gate - [Program Name]
Labels: Gate Review
State: Open
Custom Properties:
  Gate Phase: [Phase]
  Gate Status: Pending
Description:
  ## Gate Checklist
  - [ ] Item 1
  - [ ] Item 2
  - [ ] ...

  ## Approval
  Approver: TBD
  Date: TBD
```

### 8.4 Gate Criteria Item Template

```
Title: [Checklist item text]
Labels: Gate Criteria
State: Todo
Custom Properties:
  Gate Phase: [Phase]
  Gate Status: Pending
Parent Issue: [Gate Review issue]
```

### 8.5 Program Issue Template

```
Title: [Issue Title]
Labels: Bug/Issue, Sev: [Critical|High|Medium|Low]
Priority: [Mapped from severity]
State: Open
Assignee: [Owner]
Custom Properties:
  Legacy ID: iss-XXX
  Issue Severity: [level]
  Reporter: [reportedBy user]
Description:
  [Issue description text]

  ---
  Escalation: [status]
  Resolution: [if resolved]
```

### 8.6 Milestone Template

```
Title: [Milestone name]
Labels: Milestone
State: [Todo or Done]
Due Date: [milestone date]
Description:
  Owner: [owner]
  Category: [product|execution|ttm]
  Key Issue: [keyIssue text]
  Score: [0-100, if available]
```

---

## 9. Workflow Configuration

### 9.1 Task Workflow

```
Backlog --> Todo --> In Progress --> In Review --> Done
                        |
                        v
                     Blocked --> In Progress
Any state --> Cancelled
```

### 9.2 Action Item Workflow

```
Open --> In Progress --> In Review --> Done --> Closed
```

### 9.3 Program Issue Workflow

```
Open --> In Progress --> Resolved --> Closed
              |
              v
          Escalated --> In Progress --> Resolved --> Closed
```

### 9.4 Gate Review Workflow

```
Open (Gate started)
  --> In Progress (Checklist items being reviewed)
  --> Done (All items Passed/Waived, gate approved)
  --> Blocked (Critical items Failed)
```

### 9.5 Automation Notes

| Current Feature | Plane Equivalent |
|---|---|
| Gmail task assignment notifications | Plane built-in email notifications |
| Custom @mention system | Plane native @mention in comments |
| Firestore audit log | Plane activity log + optional webhooks |
| Google Drive auto-provisioning | Manual Drive links or webhook integration |
| Calendar sync (planned) | Plane calendar view (built-in) |

---

## 10. Member & Role Mapping

### 10.1 User Roster

| User ID | Name | Email | Tracker Role | Plane Workspace Role |
|---|---|---|---|---|
| u1 | Abhay Anabathula | aanabathula@upscaleai.com | editor | Member |
| u2 | Julissa Benavente | jbenavente@upscaleai.com | editor | Member |
| u3 | Ganesh Raman | graman@upscaleai.com | admin | Admin |
| u4 | Mayuresh Gangal | mgangal@upscaleai.com | editor | Member |
| u5 | Varun Vij | vvij@upscaleai.com | editor | Member |
| u6 | Mark Nguyen | mnguyen@upscaleai.com | editor | Member |
| u7 | Arnav Bhalla | abhalla@upscaleai.com | editor | Member |

### 10.2 Role Mapping

#### Workspace-Level Roles

| Tracker Global Role | Plane Workspace Role | Capabilities |
|---|---|---|
| admin | Admin | Full workspace management |
| editor | Member | Create/edit in assigned projects |
| commenter | Member | Comment and create action items |
| viewer | Guest | Read-only access |

#### Project-Level Roles

| Tracker Program Role | Plane Project Role | Capabilities |
|---|---|---|
| Program Owner | Admin | Full project control |
| editor | Admin | Edit issues, manage settings |
| commenter | Member | Comment, create issues |
| viewer | Viewer | Read-only |

Role hierarchy from backend: `viewer (0) < commenter (1) < editor (2)`. Global admin bypasses all program-level checks.

### 10.3 Per-Project Member Assignments

| Project | Admins | Members | Viewers |
|---|---|---|---|
| SKY (PRG-001) | u1 (owner), u4 | u5 | - |
| SXT (PRG-002) | u2 (owner), u4 | u7 | - |
| NOS (PRG-003) | u3 (owner), u4 | u5 | - |
| UAL (PRG-004) | u1 (owner) | - | - |
| OPT (PRG-005) | u5 (owner), u4 | u7 | - |
| AFO (PRG-006) | u3 (owner), u4 | u5 | - |
| VGA (PRG-007) | u1 (owner) | - | - |
| ACT | All members | - | - |
| IMP | u3 (admin) | All editors | - |

---

## 11. Migration Steps

### Phase 1: Workspace Setup (Day 1-2)

1. Create `UpscaleAI` workspace on plane.so
2. Configure workspace settings (timezone, default views)
3. Invite 7 users with mapped workspace roles
4. Create all workspace-level labels (Section 5)
5. Create workspace-level custom properties (Section 6.1)

### Phase 2: Project Creation (Day 2-3)

For each of 9 projects:
1. Create project with identifier and description
2. Configure issue states (Section 3.6 for program projects, Section 3.2 for ACT, Section 3.5 for IMP)
3. Add project-level custom properties (Section 6.2-6.6)
4. Set project members with correct roles (Section 10.3)
5. Set project lead to program owner

### Phase 3: Gate Modules (Day 3-4)

For each program project (7 projects):
1. Determine gate type from program type (ASIC/Hardware/Software + fallback)
2. Create one module per gate phase
3. Create one `Gate Criteria` issue per checklist item within each module
4. Apply any existing `gateStatuses` from Firestore to the `Gate Status` custom property
5. Import any custom gate items from Firestore `gateItems` collection

### Phase 4: Program Metadata (Day 4-5)

For each program project:
1. Set project-level custom properties from program data:
   - Mode, Status, Current Phase, Budget, Budget Used %, Progress %, Team Size
   - Delivery Ask/Commit dates
   - Health signals (T/E/M)
2. Import program metrics (schedule/budget/risk scores) from `programMetrics`
3. Create milestone issues from `Program.milestones` array

### Phase 5: Task Migration (Day 5-6)

Migrate 12 tasks (TK-001 through TK-012):

| Task ID | Title | Project | Priority | Status |
|---|---|---|---|---|
| TK-001 | Complete DV coverage for SerDes block | SKY | P0/Urgent | In Progress |
| TK-002 | Run CDC analysis on clock domain crossings | SKY | P0/Urgent | Todo |
| TK-003 | Review thermal simulation results | SXT | P1/High | In Review |
| TK-004 | Qualify alternate heat sink vendor | SXT | P1/High | Todo |
| TK-005 | Implement ASIC-native telemetry module | NOS | P0/Urgent | In Progress |
| TK-006 | Write zero-touch provisioning tests | NOS | P1/High | Todo |
| TK-007 | Draft UALink architecture spec | UAL | P0/Urgent | In Progress |
| TK-008 | Escalate Vendor B thermal failures | OPT | P0/Urgent | In Progress |
| TK-009 | Run 72-hour stress test on Vendor A modules | OPT | P1/High | Todo |
| TK-010 | Implement topology optimization algorithm | AFO | P1/High | In Review |
| TK-011 | Integration test orchestrator API endpoints | AFO | P1/High | Todo |
| TK-012 | Power integrity analysis for switch tray | SXT | P0/Urgent | Done |

### Phase 6: Action Item Migration (Day 6)

Migrate all action items to ACT project:
1. Create issues with `Action Item` label
2. Map status, priority, assignee, team assignment
3. Convert tags to labels with `Tag:` prefix
4. Set `Legacy ID` custom property

### Phase 7: Program Issue Migration (Day 6-7)

Migrate 9 program issues:

| Issue ID | Title | Project | Severity | Status |
|---|---|---|---|---|
| iss-001 | SerDes DV coverage below 90% on 3 blocks | SKY | high | in_progress |
| iss-002 | CDC analysis pending for clock domain crossings | SKY | medium | open |
| iss-003 | Thermal hotspots on main board - 3 locations | SXT | critical | in_progress |
| iss-004 | Vendor A heat sink delivery at risk | SXT | high | escalated |
| iss-005 | Vendor B & D optics modules failed thermal cycling | OPT | critical | escalated |
| iss-006 | Budget overrun due to requalification cycles | OPT | high | open |
| iss-007 | ZTP test environment not provisioned | NOS | medium | open |
| iss-008 | Fat-tree optimizer perf regression on >256 nodes | AFO | medium | in_progress |
| iss-009 | UALink spec dependency on consortium timeline | UAL | low | open |

### Phase 8: Comment Migration (Day 7)

Migrate 7 comments and 5 replies:
1. Create program-level discussion issues (or use Plane Pages) as comment anchors
2. Import comments preserving author, timestamp, resolved status
3. Import replies as threaded responses
4. Migrate like counts as reactions

### Phase 9: Implementation Phases (Day 7-8)

Create 6 cycles in IMP project with 45 tasks:

| Cycle | Tasks |
|---|---|
| Foundation & Auth (Wk 1-3) | t1-t9: React+TS setup, GCP APIs, OAuth SSO, RBAC, Firestore schema, CRUD, Nav shell, Audit, Gate review |
| Plan Mode (Wk 4-6) | t10-t16: Plan toggle, Timeline editor, Milestones, Dependencies, Activation+Drive, Plan-vs-Actual, Gate review |
| Collaboration (Wk 7-9) | t17-t24: Comments, Replies, Likes, @mention, Notifications, Activity feed, Resolution, Gate review |
| Gate Verification (Wk 10-12) | t25-t31: Checklist builder, Execution, Scorecard, Blocking+waiver, Approval, History, Gate review |
| Dashboards & GWS (Wk 13-16) | t32-t38: Exec dashboard, Gantt, Drive, Calendar, Gmail, Sheets, Gate review |
| Launch (Wk 17-20) | t39-t45: Perf, Security audit, UAT, Migration, Deploy, Docs, Launch approval |

### Phase 10: Verification (Day 8-10)

1. **Entity Count Verification:**
   - 7 program projects + 2 cross-cutting = 9 total
   - 12 tasks in correct projects
   - 9 program issues in correct projects
   - 45 implementation tasks across 6 cycles
   - 29 milestones across 7 programs
   - Gate modules match type-specific phase counts

2. **State Verification:**
   - All issue states match source status
   - Custom properties populated correctly
   - Gate statuses preserved

3. **Role Verification:**
   - 7 users with correct workspace roles
   - 16 program member assignments with correct project roles
   - Admin bypasses verified

4. **Notification Test:**
   - Assign a test task and verify email notification
   - @mention in a comment and verify notification

---

## 12. Plane API Integration & Automation Scripts

### 12.1 API Authentication

```
Base URL: https://api.plane.so/api/v1
Header: X-API-Key: <workspace-api-key>
Content-Type: application/json
```

### 12.2 Key API Endpoints

| Operation | Method | Endpoint |
|---|---|---|
| Create project | POST | `/workspaces/{slug}/projects/` |
| Create state | POST | `/workspaces/{slug}/projects/{id}/states/` |
| Create label | POST | `/workspaces/{slug}/labels/` |
| Create issue | POST | `/workspaces/{slug}/projects/{id}/issues/` |
| Update issue | PATCH | `/workspaces/{slug}/projects/{id}/issues/{id}/` |
| Create module | POST | `/workspaces/{slug}/projects/{id}/modules/` |
| Add issue to module | POST | `/workspaces/{slug}/projects/{id}/modules/{mid}/issues/` |
| Create cycle | POST | `/workspaces/{slug}/projects/{id}/cycles/` |
| Add issue to cycle | POST | `/workspaces/{slug}/projects/{id}/cycles/{cid}/cycle-issues/` |
| Add comment | POST | `/workspaces/{slug}/projects/{id}/issues/{iid}/comments/` |
| Invite member | POST | `/workspaces/{slug}/members/` |
| Create custom property | POST | `/workspaces/{slug}/projects/{id}/issue-properties/` |

### 12.3 Migration Script Architecture

```
migration-scripts/
  00-config.js            # Plane API key, workspace slug, Firestore config
  01-export-firestore.js  # Export all Firestore collections to JSON
  02-create-labels.js     # Create workspace labels
  03-create-projects.js   # Create 9 projects with states and properties
  04-invite-members.js    # Invite users, set workspace roles
  05-assign-members.js    # Set per-project member roles
  06-create-modules.js    # Create gate modules per project
  07-create-gate-items.js # Create gate criteria issues within modules
  08-migrate-tasks.js     # Migrate 12 tasks to program projects
  09-migrate-issues.js    # Migrate 9 program issues
  10-migrate-comments.js  # Migrate comments and replies
  11-create-cycles.js     # Create impl phase cycles + 45 tasks
  12-migrate-milestones.js # Create milestone issues
  13-verify.js            # Count and validate all entities
  lib/
    plane-api.js          # Shared Plane API client with rate limiting
    id-map.json           # Old ID -> Plane UUID mapping (auto-generated)
    firestore-export/     # Exported JSON files from Firestore
```

### 12.4 Shared Plane API Helper

```javascript
// lib/plane-api.js
import fetch from 'node-fetch';

const BASE = 'https://api.plane.so/api/v1';
const API_KEY = process.env.PLANE_API_KEY;
const SLUG = process.env.PLANE_WORKSPACE_SLUG || 'upscaleai';
const RATE_LIMIT_MS = 200; // 200ms between requests

let lastRequest = 0;

async function planeApi(method, path, body = null) {
  // Rate limiting
  const now = Date.now();
  const wait = RATE_LIMIT_MS - (now - lastRequest);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequest = Date.now();

  const url = `${BASE}/workspaces/${SLUG}${path}`;
  const opts = {
    method,
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Plane API ${method} ${path}: ${res.status} ${text}`);
  }
  return res.json();
}

export const createProject = (data) => planeApi('POST', '/projects/', data);
export const createState = (projectId, data) => planeApi('POST', `/projects/${projectId}/states/`, data);
export const createLabel = (data) => planeApi('POST', '/labels/', data);
export const createIssue = (projectId, data) => planeApi('POST', `/projects/${projectId}/issues/`, data);
export const updateIssue = (projectId, issueId, data) => planeApi('PATCH', `/projects/${projectId}/issues/${issueId}/`, data);
export const createModule = (projectId, data) => planeApi('POST', `/projects/${projectId}/modules/`, data);
export const addIssueToModule = (projectId, moduleId, data) => planeApi('POST', `/projects/${projectId}/modules/${moduleId}/issues/`, data);
export const createCycle = (projectId, data) => planeApi('POST', `/projects/${projectId}/cycles/`, data);
export const addIssueToCycle = (projectId, cycleId, data) => planeApi('POST', `/projects/${projectId}/cycles/${cycleId}/cycle-issues/`, data);
export const addComment = (projectId, issueId, data) => planeApi('POST', `/projects/${projectId}/issues/${issueId}/comments/`, data);
export const inviteMember = (data) => planeApi('POST', '/members/', data);
```

### 12.5 ID Mapping File

The migration scripts maintain a mapping file (`lib/id-map.json`) that tracks old tracker IDs to new Plane UUIDs:

```json
{
  "projects": {
    "PRG-001": "plane-uuid-1",
    "PRG-002": "plane-uuid-2"
  },
  "issues": {
    "TK-001": "plane-uuid-10",
    "iss-001": "plane-uuid-20"
  },
  "modules": {
    "PRG-001-Spec": "plane-uuid-30"
  },
  "cycles": {
    "P1": "plane-uuid-40"
  },
  "users": {
    "u1": "plane-member-uuid-1"
  },
  "states": {
    "SKY-Todo": "plane-state-uuid-1"
  },
  "labels": {
    "Task": "plane-label-uuid-1"
  }
}
```

### 12.6 Firestore Export Script

```javascript
// 01-export-firestore.js
import { db, collections } from '../src/services/firestore.js';
import fs from 'fs';
import path from 'path';

const EXPORT_DIR = path.join(import.meta.dirname, 'lib', 'firestore-export');

const COLLECTIONS = [
  'users', 'programs', 'tasks', 'comments', 'replies',
  'notifications', 'implPhases', 'programMetrics',
  'programIssues', 'programMembers', 'actionItems',
  'gateItems', 'gateStatuses', 'gateReviews'
];

async function exportAll() {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });

  for (const col of COLLECTIONS) {
    const snapshot = await db.collection(col).get();
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    const outPath = path.join(EXPORT_DIR, `${col}.json`);
    fs.writeFileSync(outPath, JSON.stringify(docs, null, 2));
    console.log(`Exported ${docs.length} docs from ${col}`);
  }
}

exportAll().catch(console.error);
```

### 12.7 Sample: Create Projects Script

```javascript
// 03-create-projects.js
import { createProject, createState } from './lib/plane-api.js';
import { loadIdMap, saveIdMap } from './lib/id-map.js';
import programs from './lib/firestore-export/programs.json' assert { type: 'json' };

const PROJECT_MAP = {
  'PRG-001': { identifier: 'SKY', network: 2 },
  'PRG-002': { identifier: 'SXT', network: 2 },
  'PRG-003': { identifier: 'NOS', network: 2 },
  'PRG-004': { identifier: 'UAL', network: 2 },
  'PRG-005': { identifier: 'OPT', network: 2 },
  'PRG-006': { identifier: 'AFO', network: 2 },
  'PRG-007': { identifier: 'VGA', network: 2 },
};

const STATES = [
  { name: 'Backlog',    group: 'backlog',   color: '#A3A3A3' },
  { name: 'Todo',       group: 'unstarted', color: '#6B7280' },
  { name: 'Open',       group: 'unstarted', color: '#94A3B8' },
  { name: 'In Progress',group: 'started',   color: '#F97316' },
  { name: 'In Review',  group: 'started',   color: '#3B82F6' },
  { name: 'Blocked',    group: 'started',   color: '#EF4444' },
  { name: 'Escalated',  group: 'started',   color: '#DC2626' },
  { name: 'Done',       group: 'completed', color: '#22C55E' },
  { name: 'Resolved',   group: 'completed', color: '#10B981' },
  { name: 'Closed',     group: 'cancelled', color: '#6B7280' },
  { name: 'Cancelled',  group: 'cancelled', color: '#9CA3AF' },
];

async function main() {
  const idMap = loadIdMap();

  for (const prg of programs) {
    const cfg = PROJECT_MAP[prg.id];
    if (!cfg) continue;

    const project = await createProject({
      name: prg.name,
      identifier: cfg.identifier,
      description: prg.description,
      network: cfg.network,
    });

    idMap.projects[prg.id] = project.id;
    console.log(`Created project ${cfg.identifier} -> ${project.id}`);

    // Create states
    for (const state of STATES) {
      const s = await createState(project.id, state);
      idMap.states[`${cfg.identifier}-${state.name}`] = s.id;
    }
  }

  // Create ACT and IMP projects
  const act = await createProject({ name: 'Action Items', identifier: 'ACT', description: 'Cross-org action items' });
  idMap.projects['ACT'] = act.id;

  const imp = await createProject({ name: 'Tracker Implementation', identifier: 'IMP', description: 'Internal product roadmap' });
  idMap.projects['IMP'] = imp.id;

  saveIdMap(idMap);
}

main().catch(console.error);
```

---

## 13. Feature Gap Analysis & Workarounds

| UpscaleAI Feature | Plane Native Support | Workaround |
|---|---|---|
| Traffic-signal health (G/A/R) with sub-metrics | No native traffic-light view | Custom select properties (G/A/R) + Plane Pages for dashboards |
| Budget tracking (string + %) | No native budget field | Custom text + number properties |
| Spark trend (7-point array) | No sparkline | Store in project description or use external dashboards |
| Gate approval workflow | No native gate system | Modules + Gate Criteria issues + manual status transitions |
| Google Drive auto-provisioning | No Drive integration | Manual Drive links in project description or webhook to Drive API |
| Per-issue visibility (Action Items) | No per-issue ACL | Restrict ACT project membership, or accept all-visible within workspace |
| Comprehensive audit trail | Plane activity log (limited) | Plane webhooks to external logger (ELK, Datadog) |
| Gmail notifications (custom templates) | Plane email notifications | Use Plane's built-in notifications (less customizable) |
| Program-scoped health dashboards | No composite scoring | Use Plane Analytics + custom property filtering |
| Escalation workflow with tracking | No native escalation | Custom properties (Escalated By/Date/Note) + state transition |
| Key Issues with severity (C/H/M) | No sub-entity model | Separate issues with `Sev:` labels linked to program |
| Health sub-metrics (e.g., Design Maturity: G) | No nested properties | Plane Pages per program documenting sub-metric details |
| Milestone category scoring | No milestone scoring | Custom `score` number property on milestone issues |

---

## 14. Appendix: Entity Inventory

### Programs (7)

| ID | Name | Type | Phase | Owner | Mode | Progress |
|---|---|---|---|---|---|---|
| PRG-001 | SkyHammer ASIC v1 | HW | Active | Abhay Anabathula | active | 62% |
| PRG-002 | Spectrum-X Switch Tray | HW | Active | Julissa Benavente | active | 45% |
| PRG-003 | SONiC NOS v4.0 | SW | Active | Ganesh Raman | active | 38% |
| PRG-004 | UALink Scale-Up Fabric | HW | New | Abhay Anabathula | planning | 12% |
| PRG-005 | 400G Optics Qual | Customer | Blocked | Varun Vij | active | 55% |
| PRG-006 | AI Fabric Orchestrator | SW | Active | Ganesh Raman | active | 70% |
| PRG-007 | Vega 8 Scale-Out NPI | NPI | Active | Abhay Anabathula | active | 15% |

### Tasks (12)

| ID | Title | Program | Priority | Status | Due |
|---|---|---|---|---|---|
| TK-001 | Complete DV coverage for SerDes block | PRG-001 | P0 | In Progress | 2026-04-01 |
| TK-002 | Run CDC analysis on clock domain crossings | PRG-001 | P0 | Todo | 2026-04-05 |
| TK-003 | Review thermal simulation results | PRG-002 | P1 | In Review | 2026-03-25 |
| TK-004 | Qualify alternate heat sink vendor | PRG-002 | P1 | Todo | 2026-03-28 |
| TK-005 | Implement ASIC-native telemetry module | PRG-003 | P0 | In Progress | 2026-04-15 |
| TK-006 | Write zero-touch provisioning tests | PRG-003 | P1 | Todo | 2026-04-20 |
| TK-007 | Draft UALink architecture spec | PRG-004 | P0 | In Progress | 2026-03-30 |
| TK-008 | Escalate Vendor B thermal failures | PRG-005 | P0 | In Progress | 2026-03-22 |
| TK-009 | Run 72-hour stress test on Vendor A modules | PRG-005 | P1 | Todo | 2026-04-01 |
| TK-010 | Implement topology optimization algorithm | PRG-006 | P1 | In Review | 2026-03-28 |
| TK-011 | Integration test orchestrator API endpoints | PRG-006 | P1 | Todo | 2026-04-05 |
| TK-012 | Power integrity analysis for switch tray | PRG-002 | P0 | Done | 2026-03-15 |

### Program Issues (9)

| ID | Title | Program | Severity | Status |
|---|---|---|---|---|
| iss-001 | SerDes DV coverage below 90% on 3 blocks | PRG-001 | high | in_progress |
| iss-002 | CDC analysis pending for clock domain crossings | PRG-001 | medium | open |
| iss-003 | Thermal hotspots on main board - 3 locations | PRG-002 | critical | in_progress |
| iss-004 | Vendor A heat sink delivery at risk | PRG-002 | high | escalated |
| iss-005 | Vendor B & D optics modules failed thermal cycling | PRG-005 | critical | escalated |
| iss-006 | Budget overrun due to requalification cycles | PRG-005 | high | open |
| iss-007 | ZTP test environment not provisioned | PRG-003 | medium | open |
| iss-008 | Fat-tree optimizer perf regression on >256 nodes | PRG-006 | medium | in_progress |
| iss-009 | UALink spec dependency on consortium timeline | PRG-004 | low | open |

### Implementation Phases (6 phases, 45 tasks)

| Phase | Name | Weeks | Tasks |
|---|---|---|---|
| P1 | Foundation & Auth | 1-3 | 9 tasks (t1-t9) |
| P2 | Plan Mode | 4-6 | 7 tasks (t10-t16) |
| P3 | Collaboration | 7-9 | 8 tasks (t17-t24) |
| P4 | Gate Verification | 10-12 | 7 tasks (t25-t31) |
| P5 | Dashboards & GWS | 13-16 | 7 tasks (t32-t38) |
| P6 | Launch | 17-20 | 7 tasks (t39-t45) |

### Program Metrics (6 scorecards)

| Program | Schedule | Budget | Risk | Composite |
|---|---|---|---|---|
| PRG-001 SkyHammer | 72 | 65 | 58 | 65 |
| PRG-002 Switch Tray | 45 | 38 | 52 | 45 |
| PRG-003 SONiC NOS | 80 | 85 | 75 | 80 |
| PRG-004 UALink | 90 | 95 | 60 | 82 |
| PRG-005 400G Optics | 35 | 30 | 25 | 30 |
| PRG-006 AI Fabric | 78 | 70 | 72 | 73 |

---

*End of Migration Guide*
