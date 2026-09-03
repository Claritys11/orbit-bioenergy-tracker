---
name: qa-demo-recording
description: Automated QA video recording and visual demo generation skill for Web applications using browser subagent execution, WebP video capture, and ffmpeg format conversion.
---

# QA Demo Recording Skill

This skill provides standard operating procedures and helper scripts for capturing, producing, and embedding high-quality QA video walkthroughs and WebP animations for feature validation.

## 🎯 Primary Use Cases

1. **End-to-End QA Walkthroughs**: Record complete user interactions (e.g. Canteen Batch Registration $\rightarrow$ Operator Pickup $\rightarrow$ Facility Inspection $\rightarrow$ Energy Allocation).
2. **Regression & Visual Verification**: Capture visual evidence of UI components, modals, responsive layouts, and state transitions.
3. **Competition Demo Video Generation**: Create clean visual walkthroughs for competition showcase reports and documentation (`walkthrough.md`).

---

## 🛠️ Step-by-Step QA Video Recording Procedure

### Step 1: Ensure Target Application Server is Running
Before triggering the recording, verify that the local application server is active on the designated port (e.g. `http://localhost:3116`).

### Step 2: Invoke `browser_subagent` with Recording Parameter
Always provide a descriptive `RecordingName` (lowercase with underscores, e.g. `orbit_e2e_qa_demo` or `canteen_qr_scan_flow`).

Example Task Prompt:
```json
{
  "RecordingName": "orbit_qr_traceability_qa",
  "TaskName": "QA Demo — Reusable QR Container Supply Chain Flow",
  "TaskSummary": "Record step-by-step QA demo of QR container trace, batch creation, and transparency dashboard.",
  "Task": "Navigate to http://localhost:3116, click on 'Explore Live Impact', inspect the metrics, navigate to http://localhost:3116/c/CNT-TELKOM-001-01, demonstrate the container card and active batch status, then visit http://localhost:3116/methodology. Confirm smooth interaction."
}
```

### Step 3: Video Artifact Processing & Conversion
Upon completion, the system automatically saves a WebP video animation to:
`<appDataDir>/brain/<conversation-id>/<RecordingName>.webp`

Optional MP4 conversion using helper script:
```bash
.agents/skills/qa-demo-recording/scripts/convert-video.sh <path-to-webp> [output.mp4]
```

### Step 4: Embed Video in Artifacts & Reports
Embed the recorded video into markdown reports or `walkthrough.md` using standard markdown media syntax:
```markdown
![QA Video Demo: Reusable QR Container Traceability](file:///path/to/recording.webp)
```

---

## 📋 Quality Assurance Checklist

- [ ] Target dev server is healthy and responding.
- [ ] `RecordingName` is unique and formatted in `lowercase_snake_case`.
- [ ] Task instructions include smooth user interactions (clicks, scrolls, form entries).
- [ ] Video artifact is verified and embedded into `walkthrough.md` or presented to the user.
