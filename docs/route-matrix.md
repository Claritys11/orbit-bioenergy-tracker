# Route Matrix

| Route | Access | Target | Objective | Primary action | Data source | Loading | Empty | Error | Mobile |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Public | Public/judges | Explain product story | Explore Live Impact | Public queries + sources | Static skeleton | N/A | Safe error | Drawer |
| `/transparency` | Public | Public | Monitor public-safe demo data | Filter period | Aggregated Prisma | Metric skeleton | Empty dataset | Safe message | Stacked flow |
| `/impact` | Public | Public | Explain impact categories | Read methodology | Aggregated Prisma | Cards | No data | Safe message | Cards |
| `/methodology` | Public | Public | Explain formulas | Trace batch | Domain docs | Static | N/A | Safe message | Linear |
| `/partners` | Public | Schools/operators | Explain participation | Learn about partnership | Seed orgs + content | Cards | Candidate state | Safe message | Cards |
| `/about` | Public | Judges/public | Challenge story | View sources | Content + sources | Static | N/A | Safe message | Linear |
| `/sources` | Public | Judges | Claim-source table | Open source | Source registry | Table skeleton | No claims | Safe message | Cards |
| `/trace/[token]` | Public | QR verifier | Trace batch safely | Search/scan another | Public batch query | Trace skeleton | Not found | Safe message | Cards |
| `/login` | Public | Partners | Sign in | Login | Auth.js | Pending button | N/A | Generic auth error | Centered |
| `/dashboard` | Auth | Compatibility redirect | Send users to their role dashboard | Redirect | Auth session | Immediate | N/A | Safe message | N/A |
| `/operator/dashboard` | Auth | Operator | Prioritise pickup, inspection, conversion, and fulfilment work | Open operator queue | Prisma | Metrics skeleton | Empty work queue | Safe message | Task cards |
| `/school/dashboard` | Auth | School admin | Review school contribution and reports | Open report | Prisma | Metrics skeleton | Empty school data | Safe message | Task cards |
| `/canteen/dashboard` | Auth | Canteen staff | Register source-separated batches and review feedback | Create batch | Prisma | Metrics skeleton | No pending batches | Safe message | Task cards |
| `/student/dashboard` | Auth | Student | Learn traceability and sorting impact safely | Open QR scanner | Prisma | Metrics skeleton | No learning data | Safe message | Task cards |
| `/community/dashboard` | Auth | Community partner | Review allocation, fulfilment, and local benefit | Open reports | Prisma | Metrics skeleton | No allocation | Safe message | Task cards |
| `/admin/dashboard` | Auth | Super admin | Review system-wide quality, safety, orgs, and audit | Open admin tools | Prisma | Metrics skeleton | No records | Safe message | Task cards |
| `/batches` | Auth | Staff/operator/admin | Batch register | Open batch | Prisma | Table skeleton | Create batch | Safe message | Cards/table |
| `/batches/new` | Auth | Canteen | Register batch | Create QR batch | Prisma/action | Pending | No sources | Inline errors | Form |
| `/batches/[id]` | Auth | Staff/operator/admin | Private batch detail | Print QR | Prisma | Detail skeleton | Not found | Safe message | Stacked |
| `/scan` | Auth | Student/staff | Scan trace | Start camera | Browser scanner | Camera state | Manual fallback | Camera fallback | Full width |
| `/operations/*` | Auth | Operator | Operate pickup/inspection/conversion/allocation | Mutate workflow | Prisma/actions | Panel skeleton | Work queue empty | Safe message | Task panels |
| `/reports/*` | Auth | Partners | Private reports | Review data | Prisma | Chart skeleton | No data | Safe message | Cards |
| `/admin/*` | Auth | Admin/operator | Manage system | Review records | Prisma | Table skeleton | No records | Safe message | Stacked |
| `/profile` | Auth | All | Session context | Logout | Auth session | Static | N/A | Safe message | Cards |
