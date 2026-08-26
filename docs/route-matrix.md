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
| `/dashboard` | Auth | Role-specific | Prioritise role tasks | Open next action | Prisma | Metrics skeleton | Empty role state | Safe message | Task cards |
| `/batches` | Auth | Staff/operator/admin | Batch register | Open batch | Prisma | Table skeleton | Create batch | Safe message | Cards/table |
| `/batches/new` | Auth | Canteen | Register batch | Create QR batch | Prisma/action | Pending | No sources | Inline errors | Form |
| `/batches/[id]` | Auth | Staff/operator/admin | Private batch detail | Print QR | Prisma | Detail skeleton | Not found | Safe message | Stacked |
| `/scan` | Auth | Student/staff | Scan trace | Start camera | Browser scanner | Camera state | Manual fallback | Camera fallback | Full width |
| `/operations/*` | Auth | Operator | Operate pickup/inspection/conversion/allocation | Mutate workflow | Prisma/actions | Panel skeleton | Work queue empty | Safe message | Task panels |
| `/reports/*` | Auth | Partners | Private reports | Review data | Prisma | Chart skeleton | No data | Safe message | Cards |
| `/admin/*` | Auth | Admin/operator | Manage system | Review records | Prisma | Table skeleton | No records | Safe message | Stacked |
| `/profile` | Auth | All | Session context | Logout | Auth session | Static | N/A | Safe message | Cards |
