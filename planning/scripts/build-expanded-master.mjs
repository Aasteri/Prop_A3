import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const planning = path.join(dir, '..');
const read = (p) => fs.readFileSync(path.join(planning, p), 'utf8');

function splitExtractions(text) {
  const chunks = {};
  const re = /^## ((?:Document|Sheet|Infographic) \d+):[^\n]*/gm;
  const indices = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    indices.push({ key: m[1], start: m.index });
  }
  for (let i = 0; i < indices.length; i++) {
    const start = indices[i].start;
    const end = indices[i + 1]?.start ?? text.length;
    chunks[indices[i].key] = text.slice(start, end).trim();
  }
  return chunks;
}

const fullExtraction = read('extractions/ABRAHAM_FULL_EXTRACTION.md');
const extractionBody = fullExtraction.replace(
  /^# Abraham — Complete Extraction[\s\S]*?# Part 1: Google Docs\n\n/,
  ''
);
const docs = splitExtractions('# Part 1: Google Docs\n\n' + extractionBody.split('# Part 2: Google Sheets')[0]);
const sheetsPart = extractionBody.split('# Part 2: Google Sheets')[1]?.split('# Part 3: Infographics')[0] ?? '';
const sheets = splitExtractions('# Part 2: Google Sheets\n\n' + sheetsPart);
const infoPart = extractionBody.split('# Part 3: Infographics')[1] ?? '';
const infographics = splitExtractions('# Part 3: Infographics\n\n' + infoPart);

const partA = read('ABRAHAM_MASTER_BUILD_DOCUMENT.md')
  .split('# Part B: Verbal Process (Full Workflow)')[0]
  .trim();

const operationalForms = read('OPERATIONAL_FORMS.md').replace(
  /^# Propa3 — Operational Forms[\s\S]*?---\n\n/,
  ''
);
const teamCharter = read('TEAM_CHARTER.md').replace(
  /^# Triple Realty Projects Limited — Team Charter[\s\S]*?---\n\n/,
  ''
);

function step(id, title, phase, actors, stories, contains, inputs, outputs, gate, automations, embed) {
  return `
### ${id} ${title}

| Attribute | Detail |
|-----------|--------|
| **Phase** | ${phase} |
| **Primary actors** | ${actors} |
| **System forms** | ${contains} |
| **Inputs** | ${inputs} |
| **Outputs** | ${outputs} |
| **Approval gate** | ${gate} |
| **Automations** | ${automations} |

**User stories**

${stories}

${embed ? `\n<details open>\n<summary><strong>Embedded source document / table</strong></summary>\n\n${embed}\n\n</details>\n` : ''}
`;
}

const prePourChecklist = `
#### Pre-Concrete Pour Internal Control (verbal — authoritative)

| Category | Check items |
|----------|-------------|
| Drawing | Approved drawings on site; slab thickness; beam sizes/position/level; design changes approved by SE |
| Formwork | Complete, aligned, soffit level, thickness, supported, braced, props, beam support, cleaned, load-safe |
| Reinforcement | Diameter, grade, spacing, main/distribution/top/bottom/beam, lap length, anchorage, tied, spacers, cover |
| MEP | Openings, conduits, plumbing/drainage sleeves, floor drains, unapproved openings closed |
| Site readiness | Clean area; cement/sand/aggregate/water; mixer/vibrator/manpower; weather forecast; media assigned |
| Safety | Safe access; PPE; formwork stability; no unauthorized personnel below |
| Approvals | Dev Control; SE; site manager; all inspections complete; defects corrected; signatures |
`;

const partB = `# Part B: Phase-Based Workflows (Detailed)

> Every step below lists **actors**, **user stories**, **forms**, **gates**, and the **extracted Abraham document/table** embedded at the point it belongs in the process.

---

## B.0 System Organogram & Classification

### B.0.1 Master system organogram

\`\`\`mermaid
flowchart TB
    subgraph external [External]
        CL[Client / Purchaser]
        GOV[Dev Control / FCTA]
        VEND[Vendor / Subcontractor]
    end

    subgraph exec [Executive]
        CEO[CEO / Programme Manager]
    end

    subgraph pm_office [Project Management]
        PM[Project Manager]
        QS[Quantity Surveyor]
        FIN[Finance]
        SALES[Sales]
    end

    subgraph design [Design Team]
        ARCH[Architect]
        SE[Structural Engineer]
        ME[Mechanical Engineer]
        EE[Electrical Engineer]
    end

    subgraph site [Site Operations]
        SUP[Site Supervisor / Foreman]
        ART[Artisans / Labour]
        SURV[Surveyor]
        HSE[HSE]
    end

    subgraph ops [Operations]
        PROC[Procurement]
        LOG[Logistics]
        STORE[Store Manager]
        MEDIA[Media Team]
    end

    CL --> PM
    CL --> SALES
    CEO --> PM
    PM --> ARCH & SE & ME & EE
    PM --> SUP
    SUP --> ART
    PM --> PROC
    PROC --> VEND
    LOG --> STORE
    SUP --> STORE
    PM --> FIN
    GOV --> PM
    VEND --> PROC
    PM --> CL
    MEDIA --> CL
\`\`\`

### B.0.2 Phase classification index

| Phase | Steps | Key Abraham artifacts |
|-------|-------|----------------------|
| **Project Initiation** | B.1.1 – B.1.5 | Initial Proposal, **Project Charter (Doc 1)** |
| **Project Planning** | B.2.1 – B.2.12 | **Kick-off (Doc 2)**, **Work Schedule (Sheet 1)**, **Labour Schedule (Sheet 5)**, **Planning Infographic (Doc 3)**, BOQ*, Soil Test*, Dev Control* |
| **Project Execution** | B.3.1 – B.3.8 | **Daily Log (Sheet 4)**, **Inspection Log (Doc 4)**, **Construction Checklist (Infographic 1)**, Pre-Pour Checklist, **Ethics (Infographic 2)** |
| **Procurement** | B.4.1 – B.4.5 | **Vendor Directory (Sheet 7)**, Material Request*, Stock ledger |
| **Project Monitoring & Controlling** | B.5.1 – B.5.6 | **Change Log (Sheet 6)**, **IVC (Doc 6)**, **Progress Report (Sheet 3)**, **Purchaser Instalment (Sheet 2)**, **Invoice (Doc 5)** |
| **Project Closure** | B.6.1 – B.6.5 | **Closeout (Doc 7)**, **Retrospective (Doc 8)**, UAT*, Fitness Certificate* |

*\\* = verbal/draft schema — no Abraham upload yet*

### B.0.3 Master workflow swimlane

\`\`\`mermaid
flowchart LR
    subgraph INIT [Project Initiation]
        I1[Lead] --> I2[Proposal]
        I2 --> I3[Charter]
        I3 --> I4[Sign-off]
    end

    subgraph PLAN [Project Planning]
        P1[Kick-off] --> P2[Survey/Design]
        P2 --> P3[BOQ/Schedule]
        P3 --> P4[Permits]
    end

    subgraph EXEC [Project Execution]
        E1[Site works] --> E2[Daily logs]
        E2 --> E3[Inspections]
        E3 --> E4[Pre-pour gate]
    end

    subgraph PROC [Procurement]
        PR1[Vendors] --> PR2[Indent]
        PR2 --> PR3[Deliver/Store]
    end

    subgraph MON [Monitoring & Controlling]
        M1[Progress] --> M2[Change log]
        M2 --> M3[IVC/Pay]
    end

    subgraph CLOSE [Project Closure]
        C1[UAT] --> C2[Handover]
        C2 --> C3[Retrospective]
    end

    I4 --> P1
    P4 --> E1
    P3 --> PR1
    PR3 --> E1
    E4 --> M1
    M3 --> C1
\`\`\`

---

# B.1 PROJECT INITIATION

**Phase goal:** Convert client intent into an authorized project with signed charter.  
**Phase owner:** Project Manager (with Sales/CEO for commercial leads)  
**Phase exit gate:** Client + company charter signatures → unlock Planning

\`\`\`mermaid
flowchart TD
    A[Client inquiry] --> B{Has land?}
    B -->|No| C[Property: land search]
    B -->|Yes| D[Site visit]
    C --> D
    D --> E[Initial Proposal]
    E --> F[Project Charter]
    F --> G{Both signatures?}
    G -->|No| F
    G -->|Yes| H[→ Planning phase]
\`\`\`

${step(
  'B.1.1',
  'Client inquiry & CRM lead',
  'Project Initiation',
  'Client, Sales, PM, CEO',
  `- **US-INIT-01:** As **Sales**, I want to capture a lead with location, building type, and land status so that PM can qualify the opportunity.
- **US-INIT-02:** As **PM**, I want to see all open leads with source (WhatsApp, web, referral) so that I can prioritize follow-up.
- **US-INIT-03:** As **Client**, I want to submit my requirements online so that Triple A can respond with guidance.`,
  '`CRM_LEAD`',
  'Client contact, requirement text, optional property link',
  'Qualified lead record; optional site visit scheduled',
  'None',
  'New web/WhatsApp inquiry → CRM notification to Sales'
)}

${step(
  'B.1.2',
  'Land / property assessment',
  'Project Initiation',
  'PM, Sales, Client, Surveyor (optional)',
  `- **US-INIT-04:** As **PM**, I want to link a property/plot record to the lead so that land and project stay connected.
- **US-INIT-05:** As **Sales**, I want to shortlist available plots for a client who needs land so that acquisition can start before charter.
- **US-INIT-06:** As **Client**, I want to know whether my land is suitable for my intended building.`,
  '`PROPERTY` record, site visit photos',
  'Land ownership docs OR purchase in progress; site visit checklist',
  'Property record with GPS, photos, suitability notes',
  'None',
  'If \`needs_land\` → create Property workflow branch'
)}

${step(
  'B.1.3',
  'Initial high-level proposal',
  'Project Initiation',
  'PM, Client, CEO (review if large)',
  `- **US-INIT-07:** As **PM**, I want to document a high-level proposal (rooms, type, cost/duration ranges) so that the client sees our recommendation before charter.
- **US-INIT-08:** As **Client**, I want to accept or reject the proposal so that we only charter agreed scope.`,
  '`FORM_INITIAL_PROPOSAL`',
  'Client requirements, site assessment',
  'Accepted proposal → triggers charter draft',
  'Client acceptance required before charter finalization',
  'Proposal sent → client portal notification'
)}

${step(
  'B.1.4',
  'Project charter creation',
  'Project Initiation',
  'PM (author), CEO (review), Client (sign), Sponsor',
  `- **US-INIT-09:** As **PM**, I want a one-page charter template with goal, budget range, duration, benefits, risks, scope, team so that I have formal authority to proceed.
- **US-INIT-10:** As **CEO**, I want to review charter before client sign-off on high-value projects.
- **US-INIT-11:** As **Client**, I want to sign the charter digitally so that the project is officially authorized.`,
  '`FORM_PROJECT_CHARTER` — **Document 1 (Jikwoyi example)**',
  'Accepted proposal, client requirements, commercial/personal flag',
  'Signed charter PDF; project record created',
  'Both signatures required',
  'Charter draft complete → notify client to sign'
,
  docs['Document 1'] ?? ''
)}

${step(
  'B.1.5',
  'Charter sign-off gate',
  'Project Initiation',
  'Client, PM/CEO (company signatory), Admin',
  `- **US-INIT-12:** As **Admin**, I want the system to block Planning modules until charter is fully signed so that unauthorized projects cannot start.
- **US-INIT-13:** As **PM**, I want automatic project status → \`charter_approved\` on dual sign-off so that kick-off can be scheduled.`,
  '`FORM_PROJECT_CHARTER` signatures',
  'Complete charter',
  'Project status \`charter_approved\`; kick-off meeting schedulable',
  '**HARD GATE:** No Planning without dual signature',
  'On sign → unlock Planning phase; notify design team'
)}

---

# B.2 PROJECT PLANNING

**Phase goal:** Produce approved designs, BOQ, schedule, permits, and all management plans.  
**Phase owner:** Project Manager  
**Phase exit gate:** Dev Control approval + BOQ approved + published WBS → unlock Execution

\`\`\`mermaid
flowchart TD
    K[Kick-off meeting] --> S[Site survey]
    S --> D[Design package]
    D --> ST[Soil test]
    ST --> B[BOQ]
    B --> DC[Dev Control submission]
    DC --> W[WBS / Gantt]
    W --> HR[HR + Equipment plans]
    HR --> PL[9 management plans]
    PL --> X{Permits + BOQ + Schedule OK?}
    X -->|Yes| EXEC[→ Execution]
\`\`\`

${step(
  'B.2.1',
  'Project kick-off meeting',
  'Project Planning',
  'PM, Site Supervisor, Architect, Structural/MEP Engineers, QS, Procurement, Client (optional)',
  `- **US-PLAN-01:** As **PM**, I want a kick-off agenda with attendees, site condition notes, and action items so that the team aligns on scope and dates.
- **US-PLAN-02:** As **Site Supervisor**, I want my responsibilities and start date recorded so that I know when to mobilize.
- **US-PLAN-03:** As **team member**, I want action items assigned to me with due dates so that nothing is lost after the meeting.`,
  '`FORM_KICKOFF_MEETING` — **Document 2**',
  'Signed charter, project record',
  'Kick-off minutes; action items synced to task list',
  'PM publishes minutes within 48h',
  'Overdue kick-off actions → PM alert',
  docs['Document 2'] ?? ''
)}

${step(
  'B.2.2',
  'Site survey & requirements harvest',
  'Project Planning',
  'PM, Site Supervisor, Architect, Surveyor, Client',
  `- **US-PLAN-04:** As **PM**, I want to record land size, floors, quality tier, and aesthetics so that design brief is complete.
- **US-PLAN-05:** As **Architect**, I want structured client requirements so that I can start drawings.`,
  '`FORM_SITE_SURVEY`',
  'Site visit, client interviews',
  'Requirements document linked to project',
  'PM approval',
  'Requirements complete → notify Architect'
)}

${step(
  'B.2.3',
  'Design package (Architectural + Structural + MEP)',
  'Project Planning',
  'Architect, Structural Engineer, M/E Engineers, PM, Client',
  `- **US-PLAN-06:** As **Architect**, I want to upload drawing versions and track approvals so that site always uses approved docs.
- **US-PLAN-07:** As **Structural Engineer**, I want to certify feasibility before Dev Control submission.
- **US-PLAN-08:** As **PM**, I want MEP (water, AC, electric, waste) included in design phase—not added later.`,
  '`FORM_DESIGN_PACKAGE`',
  'Site survey requirements',
  'Approved drawing set with version history',
  'Lead Architect + SE sign-off before Dev Control',
  'New drawing upload → notify PM and site'
)}

${step(
  'B.2.4',
  'Soil investigation',
  'Project Planning',
  'PM, Structural Engineer, QS',
  `- **US-PLAN-09:** As **SE**, I want soil bearing capacity recorded so that foundation design is correct for multi-storey loads.`,
  '`FORM_SOIL_TEST`',
  'Site location, building load class',
  'Soil test report document',
  'SE approval; **gate for foundation tasks on multi-storey**',
  'Soil test overdue → block foundation WBS tasks'
)}

${step(
  'B.2.5',
  'Bill of Quantities (BOQ)',
  'Project Planning',
  'QS, PM, Finance, Procurement',
  `- **US-PLAN-10:** As **QS**, I want BOQ line items with materials, labour, units, and rates so that budget and procurement are driven from one source.
- **US-PLAN-11:** As **PM**, I want BOQ total as estimated budget (not final) so that monitoring has a baseline.`,
  '`FORM_BOQ` *(draft — awaiting Abraham template)*',
  'Approved designs',
  'BOQ v1 approved → project budget baseline',
  'CEO/PM approval on BOQ',
  'BOQ approved → enable material planning'
)}

${step(
  'B.2.6',
  'Development Control / FCDA submission',
  'Project Planning',
  'PM, Architect, Client, Dev Control (external)',
  `- **US-PLAN-12:** As **PM**, I want to track permit submission and approval reference so that construction is legally gated.
- **US-PLAN-13:** As **System**, I want to block Execution until Dev Control approval is uploaded.`,
  '`FORM_DEV_CONTROL_SUBMISSION`',
  'Drawing package, BOQ, soil test',
  'Permit approval document',
  '**HARD GATE:** No Execution without approval',
  'Permit expiry approaching → PM alert'
)}

${step(
  'B.2.7',
  'WBS, schedule & Gantt',
  'Project Planning',
  'PM, Site Supervisor, Task Owners (Surveyor, Bldr, MEP, Engr)',
  `- **US-PLAN-14:** As **PM**, I want WBS with task owner, dates, duration, and % done so that every activity has accountability.
- **US-PLAN-15:** As **Task Owner**, I want to see my assigned tasks and due dates so that I can plan daily/weekly work.
- **US-PLAN-16:** As **PM**, I want PMT flags on payment milestone tasks so that IVC links to schedule.`,
  '`FORM_WORK_SCHEDULE` — **Sheet 1 (Guzape — 101 tasks)**',
  'BOQ sections, design phases',
  'Published project schedule; Gantt view',
  'PM publishes schedule',
  'Task overdue → notify owner + PM',
  sheets['Sheet 1'] ?? ''
)}

${step(
  'B.2.8',
  'Labour schedule & personnel plan',
  'Project Planning',
  'PM, Site Supervisor, HR',
  `- **US-PLAN-17:** As **PM**, I want gang-level labour planning (trade, gang leader, dates, cost) so that manpower is budgeted.
- **US-PLAN-18:** As **Supervisor**, I want a personnel log to track who was on site each day *(verbal — draft form)*.`,
  '`FORM_LABOUR_SCHEDULE` — **Sheet 5**; `FORM_PERSONNEL_LOG`',
  'WBS labour requirements',
  'Labour schedule sheet; personnel log enabled',
  'PM approval',
  'None',
  sheets['Sheet 5'] ?? ''
)}

${step(
  'B.2.9',
  'Stakeholder register & communication plan',
  'Project Planning',
  'PM, Client, Admin',
  `- **US-PLAN-19:** As **PM**, I want every stakeholder with comms frequency (client weekly/monthly) so that progress reports auto-route correctly.
- **US-PLAN-20:** As **Client**, I want progress photos in the portal instead of WhatsApp so that updates are structured and archived.`,
  '`FORM_STAKEHOLDER_REGISTER`',
  'Charter stakeholders, team roster',
  'Stakeholder register; client portal access provisioned',
  'PM publishes comms plan',
  'Report due date → auto-remind PM'
)}

${step(
  'B.2.10',
  'Management plans bundle (9–10 plans)',
  'Project Planning',
  'PM, HSE, Procurement, QS, Site Supervisor',
  `- **US-PLAN-21:** As **PM**, I want quality, procurement, safety, and communication plans linked to the project so that Execution follows one playbook.`,
  'Quality Plan, Procurement Plan, Safety Plan, Comms Plan',
  'BOQ, charter risks, vendor directory',
  'Published management plans checklist',
  'PM sign-off on all plans',
  'Missing plan → warn before Execution start'
)}

${step(
  'B.2.11',
  'Daily / weekly / monthly planning rhythm',
  'Project Planning → Execution (ongoing)',
  'Site Supervisor, PM, CEO (monthly)',
  `- **US-PLAN-22:** As **Supervisor**, I want daily planning checklist (TBT, materials, targets) so that site execution stays disciplined.
- **US-PLAN-23:** As **PM**, I want weekly lookahead (2–6 weeks) and monthly budget/cash-flow review built into the system.`,
  'Planning Infographic — **Document 3**',
  'Published schedule, site constraints',
  'Daily/weekly/monthly plan records',
  'Supervisor completes daily plan before site work',
  'Monday → weekly plan prompt; 1st of month → monthly review prompt',
  docs['Document 3'] ?? ''
)}

${step(
  'B.2.12',
  'Professional ethics acknowledgement',
  'Project Planning (onboarding) → Execution',
  'All site roles: Supervisor, Engineers, Artisans',
  `- **US-PLAN-24:** As **Supervisor**, I must acknowledge the 10 ethics principles before I am assigned to a site so that Triple A standards are enforced.`,
  'Ethics Infographic — **Infographic 2**',
  'User account, site assignment',
  'Signed ethics acknowledgement on file',
  '**Gate:** No site assignment without acknowledgement',
  'First site assignment → force ethics modal',
  infographics['Infographic 2'] ?? ''
)}

---

# B.3 PROJECT EXECUTION

**Phase goal:** Physical construction with daily reporting, inspections, and gated concrete pours.  
**Phase owner:** Site Supervisor (under PM)  
**Phase exit gate:** All WBS tasks complete → Commissioning

\`\`\`mermaid
flowchart TD
    SC[Site clearance] --> SO[Setting out]
    SO --> EX[Excavation]
    EX --> BL[Blinding]
    BL --> FO[Footings/columns]
    FO --> DPC[DPC/slab cycle]
    DPC --> UP[Upper floors loop]
    UP --> FIN[Finishing]
    FIN --> COM[→ Commissioning]
\`\`\`

${step(
  'B.3.1',
  'Mobilization & site clearance',
  'Project Execution',
  'Site Supervisor, PM, Logistics, Equipment operators',
  `- **US-EXEC-01:** As **Supervisor**, I want to log site clearance with machinery used so that daily reports capture mobilization.`,
  'WBS Phase 1 tasks, Daily Log §4 Machinery',
  'Approved schedule, permits',
  'WBS tasks 1.01–1.02 updated; daily log started',
  'Permit check',
  'First daily log reminder 06:00'
)}

${step(
  'B.3.2',
  'Setting out & excavation',
  'Project Execution',
  'Surveyor, Site Supervisor, Structural Engineer, Builders',
  `- **US-EXEC-02:** As **Surveyor**, I want setting-out recorded against approved drawings so that wall positions match design.
- **US-EXEC-03:** As **Supervisor**, I want excavation depth verified before blinding.`,
  'WBS 1.03–1.13; Inspection §2 Excavation',
  'Approved structural drawings',
  'Excavation checklist complete',
  'Supervisor + Surveyor verification',
  'None',
  ''
)}

${step(
  'B.3.3',
  'Foundation → DPC slab cycle',
  'Project Execution',
  'Builder, Iron bender, Carpenter, MEP, Structural Engineer, Supervisor',
  `- **US-EXEC-04:** As **Builder**, I want blinding, footings, blockwork, MEP sleeves, and DPC pour tracked in WBS so that sequence is auditable.
- **US-EXEC-05:** As **MEP**, I want sleeve installation recorded before each slab pour.`,
  'WBS 1.07–1.24, 2.x; Inspection §3–6',
  'Structural drawings, soil test',
  'DPC level achieved; curing logged',
  'Pre-pour checklist before each slab pour',
  'Slab pour event → notify media team'
)}

${step(
  'B.3.4',
  'Upper floor construction loop',
  'Project Execution',
  'Builder, MEP, Structural Engineer, Supervisor, Subcontractors',
  `- **US-EXEC-06:** As **PM**, I want each floor cycle (blockwork → beams → slab → MEP) repeated per WBS phases 2–5 so that multi-storey progress rolls up.`,
  'WBS Phases 2–5 (Sheet 1)',
  'Lower floor complete',
  'Floor-by-floor % complete',
  'Pre-pour gate each slab',
  'Milestone % → client portal'
)}

${step(
  'B.3.5',
  'Daily site reporting',
  'Project Execution',
  'Site Supervisor (create), PM (approve), Store Manager (read materials), Client (photos via portal)',
  `- **US-EXEC-07:** As **Supervisor**, I want the 10-section daily log offline on mobile so that I can submit before leaving site.
- **US-EXEC-08:** As **PM**, I want to approve logs within 24h so that data feeds milestones and client updates.
- **US-EXEC-09:** As **Store Manager**, I want material received/consumed balances so that stock stays accurate.`,
  '`FORM_DAILY_SITE_LOG` — **Sheet 4**',
  'Daily activities, manpower, materials on site',
  'Approved daily log; ref code AAA/GZP/…; photos',
  'Supervisor signature required; PM approval locks record',
  '18:00 missing log → alert; incident flag → HSE draft',
  sheets['Sheet 4'] ?? ''
)}

${step(
  'B.3.6',
  'Pre-concrete pour approval',
  'Project Execution',
  'Site Supervisor, Structural Engineer, Site Manager, MEP, Dev Control (inform)',
  `- **US-EXEC-10:** As **Supervisor**, I want a pre-pour checklist I cannot skip so that bad pours are prevented.
- **US-EXEC-11:** As **SE**, I want digital sign-off on reinforcement/formwork/MEP before pour.`,
  '`FORM_PRE_POUR_CHECKLIST`',
  'Formwork, reinforcement, MEP complete',
  'Signed pre-pour approval; pour event logged',
  '**HARD GATE:** No pour without pass + signatures',
  'Fail item → block pour + notify SE',
  prePourChecklist
)}

${step(
  'B.3.7',
  'Phase inspection log (20 categories)',
  'Project Execution',
  'Site Supervisor, PM, Dev Control Rep, Engineers',
  `- **US-EXEC-12:** As **Supervisor**, I want phase checklists (foundation, slab, MEP, etc.) with Yes/No and remarks so that QC is traceable.
- **US-EXEC-13:** As **PM**, I want inspection sign-off before next phase unlocks.`,
  '`FORM_PHASE_INSPECTION` — **Document 4**',
  'Completed phase work',
  'Signed inspection sections; general approval row',
  'Dev Control / PM / Supervisor signatures per section',
  'Failed item → NCR draft',
  docs['Document 4'] ?? ''
)}

${step(
  'B.3.8',
  'Construction checklist reference (107 items)',
  'Project Execution / QC',
  'Site Supervisor, PM, QC Team',
  `- **US-EXEC-14:** As **QC**, I want the full 107-item checklist available by phase so that inspections align with Triple A standards.`,
  'Construction Checklist — **Infographic 1**',
  'Active construction phase',
  'Phase-appropriate checklist instance',
  'Supervisor completes per phase',
  'None',
  infographics['Infographic 1'] ?? ''
)}

---

# B.4 PROCUREMENT

**Phase goal:** Source, deliver, store, and issue materials with vetted vendors.  
**Phase owner:** Procurement Officer + Store Manager (Logistics supports)  
**Runs:** Planned in Planning; active throughout Execution

\`\`\`mermaid
flowchart LR
    BOQ[BOQ line] --> IND[Material indent]
    IND --> PM_A[PM approve]
    PM_A --> PO[Purchase order]
    PO --> DEL[Delivery]
    DEL --> REC[Store receipt]
    REC --> ISS[Issue to site]
    ISS --> DLOG[Daily log materials]
\`\`\`

${step(
  'B.4.1',
  'Vendor directory & quality records',
  'Procurement',
  'Procurement, PM, Store Manager, QS',
  `- **US-PROC-01:** As **Procurement**, I want trusted vendors with reliability ratings so that quality sourcing is repeatable.
- **US-PROC-02:** As **PM**, I want block/steel/cement vendors pre-approved so that site indents use quality suppliers.`,
  '`FORM_VENDOR` — **Sheet 7**',
  'Quality management plan',
  'Vendor master list',
  'Procurement maintains list',
  'None',
  sheets['Sheet 7'] ?? ''
)}

${step(
  'B.4.2',
  'Material requirement planning',
  'Procurement / Planning',
  'PM, QS, Procurement',
  `- **US-PROC-03:** As **PM**, I want material requirements derived from BOQ and schedule lookahead so that orders happen before stock-outs.`,
  'BOQ, Weekly planning (Doc 3)',
  'BOQ, 2–6 week lookahead',
  'Material requirement forecast',
  'PM review',
  'Stock below reorder → indent suggestion'
)}

${step(
  'B.4.3',
  'Material request (indent)',
  'Procurement / Execution',
  'Site Supervisor, PM, Store Manager, Procurement',
  `- **US-PROC-04:** As **Supervisor**, I want to raise a material indent from site so that PM can approve and store can fulfill.
- **US-PROC-05:** As **PM**, I want to approve/reject indents so that spending is controlled.`,
  '`FORM_MATERIAL_REQUEST` *(draft)*',
  'Daily log material needs, BOQ ref',
  'Approved indent → PO or stock issue',
  'PM approval required',
  'Urgent indent → SMS/notify Procurement'
)}

${step(
  'B.4.4',
  'Logistics & delivery',
  'Procurement',
  'Logistics Officer, Vendor, Store Manager',
  `- **US-PROC-06:** As **Logistics**, I want to coordinate vendor → site/stock delivery so that materials arrive on planned days.`,
  'Delivery note *(draft)*',
  'Approved PO',
  'Delivery record with qty, date, condition',
  'Store Manager receipt sign-off',
  'Delivery overdue → alert Logistics + PM'
)}

${step(
  'B.4.5',
  'Storage, stacking & stock ledger',
  'Procurement / Execution',
  'Store Manager, Site Supervisor',
  `- **US-PROC-07:** As **Store Manager**, I want receipt/issue ledger so that daily log consumed qty reconciles.
- **US-PROC-08:** As **Supervisor**, I want storage condition notes so that damaged materials are rejected.`,
  'Stock ledger, Daily Log §5',
  'Deliveries, daily log consumption',
  'Running balance per material per site',
  'Negative balance → alert',
  'Daily log consumed > stock → alert Store'
)}

---

# B.5 PROJECT MONITORING & CONTROLLING

**Phase goal:** Measure progress, control scope/cost/time, pay for performance.  
**Phase owner:** Project Manager + QS + Finance  
**Runs:** Throughout Execution; intensifies at milestones

\`\`\`mermaid
flowchart TD
    DL[Daily logs] --> PR[Progress reports]
    WBS[WBS % done] --> PR
    PR --> CL[Client portal]
    CR[Change requests] --> BOQ[BOQ update]
    WBS --> IVC[IVC]
    IVC --> PAY[Payment]
\`\`\`

${step(
  'B.5.1',
  'Progress reporting (daily / weekly / monthly / milestone)',
  'Project Monitoring & Controlling',
  'PM, Site Supervisor, Client, CEO',
  `- **US-MON-01:** As **PM**, I want to publish progress reports with photos, completed/ongoing/upcoming tasks, and risks so that clients get open-book updates.
- **US-MON-02:** As **Client**, I want milestone reports on my chosen frequency (weekly/monthly) in the portal—not WhatsApp.`,
  '`FORM_PROGRESS_REPORT` — **Sheet 3 (Rockvilla example)**',
  'Daily logs, WBS %, photos',
  'Published stakeholder report',
  'PM publishes; CEO optional review',
  'Report overdue → PM alert',
  sheets['Sheet 3'] ?? ''
)}

${step(
  'B.5.2',
  'Change request log',
  'Project Monitoring & Controlling',
  'PM, Client, CEO, Architect/SE (if structural), Dev Control (if required)',
  `- **US-MON-03:** As **PM**, I want every change logged with justification and cost/time impact so that scope creep is controlled.
- **US-MON-04:** As **Client**, I want to approve major changes before work proceeds.
- **US-MON-05:** As **PM**, I want minor changes approvable by me alone when impact is low.`,
  '`FORM_CHANGE_LOG` — **Sheet 6**',
  'Change event on site or in design',
  'Approved/rejected change; BOQ/schedule/invoice updates',
  'Minor→PM; Major→Client; Structural→Dev Control may be required',
  'Approved change → variation invoice draft',
  sheets['Sheet 6'] ?? ''
)}

${step(
  'B.5.3',
  'Interim Valuation Certificate (IVC)',
  'Project Monitoring & Controlling',
  'PM, Site Supervisor, Subcontractor, Finance, QS',
  `- **US-MON-06:** As **PM**, I want IVC tied to measured % work so that we only pay for performance.
- **US-MON-07:** As **Subcontractor**, I want to see mobilization and milestone payment stages clearly.
- **US-MON-08:** As **Finance**, I want payment history per IVC so that audit trail is complete.`,
  '`FORM_IVC` — **Document 6**',
  'Subcontract scope, WBS % measurement',
  'IVC with recommendation; payment queue',
  'PM/Supervisor recommendation before finance release',
  'IVC submitted → finance notification',
  docs['Document 6'] ?? ''
)}

${step(
  'B.5.4',
  'Client & purchaser finance monitoring',
  'Project Monitoring & Controlling / Property',
  'Finance, Sales, Client/Purchaser, PM',
  `- **US-MON-09:** As **Finance**, I want purchaser instalment tracking against contract price so that sales cash flow is visible.
- **US-MON-10:** As **Purchaser**, I want to see my 6-month schedule and balance in the portal.`,
  '`FORM_PURCHASER_INSTALMENT` — **Sheet 2**; `FORM_INVOICE`',
  'Sales contract, payment proofs',
  'Instalment ledger; outstanding balance',
  'Finance verifies payments',
  'Missed instalment → notify Sales + Client',
  sheets['Sheet 2'] ?? ''
)}

${step(
  'B.5.5',
  'Invoicing & variations',
  'Project Monitoring & Controlling / Finance',
  'Finance, PM, Client',
  `- **US-MON-11:** As **Finance**, I want invoices with variation lines (V-01, V-02) linked to change log so that billing matches scope.`,
  '`FORM_INVOICE` — **Document 5 (Solar hybrid example)**',
  'Contract, approved changes, milestones',
  'Invoice PDF; outstanding balance',
  'PM confirms work; Finance issues',
  'Variation approved → auto-suggest invoice line',
  docs['Document 5'] ?? ''
)}

${step(
  'B.5.6',
  'Performance & corrective action',
  'Project Monitoring & Controlling',
  'PM, CEO, Site Supervisor',
  `- **US-MON-12:** As **PM**, I want monthly progress vs plan with corrective actions so that delays are managed openly.`,
  'Monthly planning (Doc 3), Progress reports',
  'Schedule baseline, actual %',
  'Corrective action log',
  'CEO review on major slippage',
  'Schedule slip > threshold → CEO alert'
)}

---

# B.6 PROJECT CLOSURE

**Phase goal:** Commission, hand over, settle payments, learn lessons.  
**Phase owner:** Project Manager  
**Phase exit gate:** Retrospective complete → project \`closed\`

\`\`\`mermaid
flowchart TD
    UAT[User acceptance test] --> FIT[Fitness certificate]
    FIT --> HO[Handover]
    HO --> FIN[Financial closure]
    FIN --> FB[Client feedback]
    FB --> RET[Retrospective]
    RET --> ARCH[Archive + testimonial]
\`\`\`

${step(
  'B.6.1',
  'User acceptance test (UAT) & commissioning',
  'Project Closure',
  'PM, Client, MEP subcontractors, Site Supervisor',
  `- **US-CLOSE-01:** As **Client**, I want to test every component (doors, lift, solar, AC, pool) with Triple A so that I know the building works.
- **US-CLOSE-02:** As **PM**, I want UAT items recorded pass/fail so that snags are tracked to completion.`,
  '`FORM_UAT` *(draft — derived from verbal + closeout features)*',
  'Practical completion achieved',
  'UAT record; snag list',
  'All critical items pass',
  'UAT fail → snag ticket'
)}

${step(
  'B.6.2',
  'Fitness-for-use certification & handover',
  'Project Closure',
  'PM, Client, CEO',
  `- **US-CLOSE-03:** As **PM**, I want a fitness certificate issued after UAT so that handover is formal.`,
  '`FORM_FITNESS_CERTIFICATE` *(draft)*',
  'UAT pass',
  'Signed fitness certificate',
  'Client + contractor signatures',
  'Certificate issued → client portal download'
)}

${step(
  'B.6.3',
  'Project closeout report',
  'Project Closure',
  'PM, Client, CEO',
  `- **US-CLOSE-04:** As **PM**, I want a closeout narrative with accomplishments by floor/zone and open items so that handover is documented.`,
  '`FORM_CLOSEOUT_REPORT` — **Document 7 (Guzape / Mrs Araba Agbenyenku)**',
  'UAT, as-built docs, photos',
  'Closeout report PDF',
  'Client acknowledges receipt',
  'None',
  docs['Document 7'] ?? ''
)}

${step(
  'B.6.4',
  'Financial closure',
  'Project Closure',
  'Finance, PM, CEO',
  `- **US-CLOSE-05:** As **Finance**, I want all subcontractor, vendor, and worker payments settled before project close so that no liabilities remain.
- **US-CLOSE-06:** As **CEO**, I want financial closure checklist signed off.`,
  'IVC finals, Invoice ledger',
  'Outstanding payment report',
  'Financial closure sign-off',
  '**HARD GATE:** Unpaid subs block \`closed\` status',
  'Outstanding > 0 → block closure wizard'
)}

${step(
  'B.6.5',
  'Retrospective, lessons learned & testimonial',
  'Project Closure',
  'PM, All team, Client, CEO',
  `- **US-CLOSE-07:** As **PM**, I want a retrospective with what worked/didn't/lucky so that future projects improve.
- **US-CLOSE-08:** As **Client**, I want to give feedback/testimonial for Triple A credibility.`,
  '`FORM_RETROSPECTIVE` — **Document 8**; `FORM_CLIENT_SATISFACTION`',
  'Project history, challenges log',
  'Archived lessons; optional testimonial',
  'Retrospective meeting complete',
  'Project closed → add lessons to org knowledge base',
  docs['Document 8'] ?? ''
)}

---

## B.7 User story index (quick reference)

| ID | Role | Summary |
|----|------|---------|
| US-INIT-01–13 | Sales, PM, Client, Admin | Lead → proposal → charter → sign-off |
| US-PLAN-01–24 | PM, design team, Supervisor | Kick-off through plans, schedule, ethics |
| US-EXEC-01–14 | Supervisor, engineers, QC | Build sequence, daily logs, inspections, pour gate |
| US-PROC-01–08 | Procurement, Store, Logistics | Vendors → indent → deliver → stock |
| US-MON-01–12 | PM, Finance, Client, Sub | Progress, changes, IVC, instalments |
| US-CLOSE-01–08 | PM, Client, Finance, CEO | UAT → handover → retrospective |

`;

const partC = `\n\n---\n\n# Part C: Appendix — Full Verbatim Extractions\n\n> Complete copy for search/audit. Primary placement is in **Part B** workflow steps above.\n\n${fullExtraction.replace(/^# Abraham — Complete Extraction[\s\S]*?---\n\n## Table of Contents[\s\S]*?---\n\n/, '')}`;

const partD = `\n\n---\n\n# Part D: Form Field Specs (Operational Forms)\n\n${operationalForms}`;
const partE = `\n\n---\n\n# Part E: Team Roles & Org Structure\n\n${teamCharter}`;
const partF = `\n\n---\n\n# Part F: Gaps — Validation Needed\n\n| Item | Status | Action |\n|------|--------|--------|\n| BOQ template | Verbal only | Abraham to upload |\n| Material Request | Draft | Confirm approval chain |\n| Personnel log | Verbal | Confirm format |\n| Properties module | Incomplete | Resume walkthrough |\n| Procurement PO/GRN | Missing | Upload templates |\n\n---\n\n*End of Abraham / Triple A Master Build Document*\n`;

const newDocMap = `| **B** | [Phase-based workflows — detailed steps, user stories, embedded docs](#part-b-phase-based-workflows-detailed) |
| **C** | [Appendix — full verbatim extractions](#part-c-appendix--full-verbatim-extractions) |
| **D** | [Form field specs](#part-d-form-field-specs-operational-forms) |
| **E** | [Team roles & org structure](#part-e-team-roles--org-structure) |
| **F** | [Gaps — validation needed](#part-f-gaps--validation-needed) |`;

const partAUpdated = partA.replace(
  /\| \*\*B\*\* \|[^\n]+\n\| \*\*C\*\* \|[^\n]+\n\| \*\*D\*\* \|[^\n]+\n\| \*\*E\*\* \|[^\n]+\n\| \*\*F\*\* \|[^\n]+/,
  newDocMap
);

const out = partAUpdated + '\n\n---\n\n' + partB + partC + partD + partE + partF;
const outPath = path.join(planning, 'ABRAHAM_MASTER_BUILD_DOCUMENT.md');
fs.writeFileSync(outPath, out);
console.log('Written:', outPath);
console.log('Lines:', out.split('\n').length);
console.log('KB:', (out.length / 1024).toFixed(1));
console.log('Embedded chunks:', Object.keys(docs).length, 'docs,', Object.keys(sheets).length, 'sheets,', Object.keys(infographics).length, 'infographics');
