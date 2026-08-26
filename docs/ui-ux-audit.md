# UI/UX Audit

## Summary
The first implementation proves the backend workflow but the experience reads as an internal admin shell. Public education, public evidence, source-backed claims, role-specific dashboards, mobile navigation, confidence labels, and stronger visual storytelling need improvement.

## Route Findings
| Route | Intended user | Strengths | Problems | Action | Priority |
| --- | --- | --- | --- | --- | --- |
| `/` | Public, judges | Clear first ORBIT pitch | Too short; weak problem context, no Malang evidence, no tabs, no live impact preview | Rebuild full product story | Critical |
| `/login` | Partners | Simple and secure error | Dashboard failed when DB was down; generic copy only | Fix redirect handling and add clearer demo hint | Critical |
| `/trace/[token]` | Public QR verifier | Opaque token, no private user data | Missing source org, timeline, allocation/fulfilment, confidence labels | Expand public-safe trace | High |
| `/dashboard` | All roles | Reads real data | Generic for many roles; not student/canteen/community specific | Split role-specific dashboard content | Critical |
| `/batches` | Staff/admin/operator | Functional table | Enum-heavy labels, weak filters/mobile states | Add friendlier status and mobile cards later | Medium |
| `/batches/new` | Canteen staff | Creates real QR batch | Needs richer help, pending state, validation summaries | Improve form UX | High |
| `/batches/[id]` | Private operators/staff | Timeline and QR | Needs better status hierarchy and action prompts | Improve detail composition | Medium |
| `/scan` | Students/staff | Camera and manual fallback | Needs safer student guidance and mobile-first layout | Improve copy/layout | Medium |
| `/operations/pickups` | Operator | Real scheduling mutation | Needs clearer queue, route privacy, mobile layout | Improve operational prioritisation | High |
| `/operations/inspections` | Operator | Real contamination calculation | Delivered-only empty state weak | Add empty state and clearer thresholds | High |
| `/operations/conversions` | Operator | Real verified gas record | Dense form; no visual distinction between estimated/verified | Improve grouping | High |
| `/operations/conversions/[id]` | Operator/admin | Allocation simulation | Needs confidence labels and correction model explanation | Improve detail | Medium |
| `/operations/allocations` | Operator/admin | Finalised records | Needs public/private wording and version history | Improve copy/table | Medium |
| `/operations/fulfilment` | Operator | Real fulfilment record | Needs stronger "not delivered yet" language | Improve states | Medium |
| `/reports/impact` | Partners | Measured metrics | Should be public too; needs richer methodology links | Create public `/impact` and keep private report | High |
| `/reports/sustainability` | Partners | Net benefit formula | Needs stronger assumptions display | Improve wording | Medium |
| `/admin/facilities` | Admin | Biodigester status explicit | Needs partner validation status and public/private distinction | Improve | Medium |
| `/admin/users` | Admin | Membership visibility | Exposes emails privately only, OK | Add better grouping later | Low |
| `/admin/safety` | Operator/admin | Safety disclaimer | Needs action workflow | Medium |
| `/admin/audit` | Admin | Append-only audit view | Raw action labels | Improve diff viewer later | Medium |
| `/admin/settings` | Super admin | Config and permissions | No edit form yet | Add versioned config workflow later | Medium |
| `/profile` | All roles | Clear session context | Minimal | Low |
| `/onboarding` | All roles | Checklist | Generic | Role-specific checklist later | Medium |

## Accessibility and Responsive Risks
Mobile shell currently uses horizontal navigation. Public pages need skip links, clear headings, touch targets, focus states, and no wide overflow. Charts need textual summaries.
