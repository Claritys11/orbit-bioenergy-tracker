# Implementation Plan

## Phase 1: Stabilise Access
Files: `src/app/actions.ts`, local Docker runtime. Fix login redirect handling, restart Postgres, verify dashboard login.

## Phase 2: Documentation Contract
Files: `docs/*`. Create product brief, route audit, IA, journeys, content strategy, data policy, design system, route matrix, plan, and source map.

## Phase 3: Public Evidence Platform
Files: public components, `/`, `/transparency`, `/impact`, `/methodology`, `/partners`, `/about`, `/sources`, `/trace/[token]`. Add shared public query layer, source registry, confidence labels, system visuals, educational calculator, and public-safe activity.

## Phase 4: Operational Workspace Refinement
Files: app shell and dashboard. Add grouped navigation, mobile drawer, role dashboards, action panels, friendlier labels, and clearer data confidence.

## Phase 5: Validation
Run lint, typecheck, unit tests, Playwright, build, audit, visual browser inspection at 360, 768, 1024, and 1440 widths.

## Risks
Database must be running for auth and public metrics. Public pages must not expose private audit/user/vehicle data. Claims require source-backed wording. Design changes must not break server actions.

## Completion Criteria
Documentation matches implementation, dashboard login works, public routes are accessible, private routes remain protected, role dashboards differ, visual QA passes, and automated checks pass.
