# Quality, Testing & Review Workflow

This document defines the standard project lifecycle for the Antigravity Finance Tracker. Tests and affected docs are delivered with the feature they cover.

## Project lifecycle

**Plan → Code + Tests → Verify → Security → Docs → Fresh Review → Pre-commit → Commit → PR → CI → Merge.**

1. **Project setup**: maintain `AGENTS.md`, `docs/`, architecture/API/DB conventions, formatting/lint rules, and test strategy before feature work.
2. **Implementation**: generate clean, consistently formatted code. Each authored source file starts with a 1–3 line purpose/working comment. Inline comments explain why non-obvious choices exist, not obvious operations.
3. **File scope**: prefer focused files around 100–300 lines. Consider splitting around 300–500+ lines when responsibilities are mixed; do not enforce arbitrary limits.
4. **Feature tests**: add unit tests for logic and integration tests for API/database/module interactions alongside implementation.
5. **User flow tests**: after a flow works, add E2E tests for important critical paths rather than every interaction.
6. **Verification**: run formatter → lint → typecheck → unit/integration tests → build → dependency/security audit. Run slower E2E separately, and before release.
7. **Security**: review authentication, authorization, input validation, secrets and sensitive data exposure, dependencies, injection, and access control.
8. **Docs**: update only documentation affected by the change.
9. **Fresh review**: inspect the Git diff for correctness, maintainability, tests, security, docs, and unnecessary complexity.
10. **Pre-commit through merge**: complete the checklist below, commit and push, open a PR, review final PR/CI results, and merge only after required checks pass and the change is approved.

The atomic task and phase gates in [`PROJECT_PLAN.md`](PROJECT_PLAN.md) apply within this sequence.

## Git Workflow

### Branch Strategy

- `main` is the only persistent branch by default.
- Keep `main` stable and production-ready.
- Do not create permanent `frontend`, `backend`, `testing`, or agent-specific branches.
- Create a temporary branch for each meaningful feature, fix, refactor, or documentation task.
- Use clear branch names:
  - `feat/task-filtering`
  - `fix/login-redirect`
  - `refactor/task-service`
  - `docs/api`
  - `test/auth-flow`
- After a PR is merged, delete its temporary branch.
- Add a persistent `develop` branch only if the project later has a genuine staging/integration requirement.

### Agentic / Parallel Development

- One agent modifying code should normally work on one task branch.
- Multiple agents modifying code in parallel should use separate branches and preferably separate Git worktrees.
- Do not allow multiple agents to make overlapping changes to the same files unless explicitly coordinated.
- Read-only review, research, and analysis agents do not require separate branches.

### Commit Strategy

Commit at logical, working checkpoints rather than after every small edit.

Examples:

```text
feat: add task filtering API
test: add task filtering integration tests
feat: add task filtering UI
fix: preserve filters in URL
docs: update task filtering documentation
```

Before committing:

1. Ensure the current change is coherent.
2. Format changed files.
3. Run relevant lint/type checks.
4. Run relevant tests.
5. Run the build when appropriate.
6. Review the Git diff for accidental or unrelated changes.
7. Never commit secrets, `.env` files, generated junk, debug code, or unrelated modifications.

A medium-sized feature may naturally contain several logical commits. Prefer meaningful commits over arbitrary commit frequency.

### Standard Flow

```text
main
  ↓
create task branch
  ↓
plan / implement
  ↓
test + lint + build
  ↓
security/review checks
  ↓
logical commits
  ↓
push
  ↓
PR
  ↓
CI + final review
  ↓
merge into main
  ↓
delete task branch
```

## Test layers and timing

| Layer | Coverage | Timing |
| --- | --- | --- |
| Unit | Pure utilities, Zod schemas, currency conversion/rounding, budget thresholds, isolated service logic | During each subphase; on every pull request |
| Integration | Express routes/services with an isolated test database; auth, authorization, persistence, transactions, balance consistency | As each API subphase is implemented; on every pull request |
| End-to-end | Critical browser journeys across client and API, with external providers mocked or test-configured | Added alongside UI flows; run on pull requests where practical and before release |

Keep unit tests fast and deterministic. Integration tests use a dedicated test database (`MONGODB_TEST_URI`), never production data, and clean up afterward. E2E tests exercise user-visible behavior and avoid dependence on live email, OAuth, OCR, or exchange-rate providers.

**Standard Tooling**: **Prettier** (formatting), **ESLint** (linting), **Vitest** (unit tests in `server/` and `client/`), **Vitest + Supertest** (API integration tests in `server/`), and **Playwright** (E2E tests in `client/` only—never installed in `server/`).

## Automated checks

Add stable root and workspace scripts as tooling is introduced. Intended root commands:

```text
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:e2e
npm run build
npm run audit
```

Run the checks in this order: formatting, lint, typecheck, unit/integration tests, production build, dependency/security audit. Run focused checks during implementation. Each pull request should run formatting, lint, typecheck, unit and integration tests, and production builds. E2E checks may run separately because they are slower; run them before release. Run `npm audit` (or the selected package manager's equivalent) after dependency changes and before release; review findings instead of blindly applying breaking upgrades. If a script is not configured yet, mark it pending rather than reporting it passed.

## Local pre-commit checklist

- [ ] Review the complete diff for accidental, unrelated, generated, or secret-bearing files.
- [ ] Run formatter check, lint, typecheck, and focused tests for the change.
- [ ] Confirm new behavior has suitable unit/integration/E2E coverage, including error and boundary cases.
- [ ] Update `docs/API.md`, `docs/DB.md`, `docs/PROJECT_PLAN.md`, or other relevant docs with the implementation.
- [ ] Run phase checks from `AGENTS.md` when closing a phase; record outcomes and known limitations in the PR.
- [ ] At phase completion, create/update the persistent Phase milestone checkpoint branch (e.g. `phase-N-checkpoint`), commit/tag, and prompt the user for approval to push to remote.
- [ ] Review the final diff freshly for correctness, maintainability, tests, security, docs, and unnecessary complexity.
- [ ] Commit and push the reviewed change and open a PR when authorized for the task; ensure PR CI passes and review its final diff before merge.

## Pull request review

PR description should summarize behavior, link relevant plan items, list checks actually run, and call out configuration or migration needs. Review correctness, clarity, scope, test quality, accessibility where relevant, and synchronized docs. Code review does not replace automated checks.

### Five security checks

1. **Authentication and authorization**: protected routes verify identity, ownership is enforced for each resource, and token/session handling does not leak credentials or permit privilege escalation.
2. **Input validation and injection**: request bodies, query strings, and route parameters use Zod; database queries and output handling resist injection and unsafe rendering.
3. **Secrets and sensitive data**: secrets stay in environment configuration, are never committed/logged, passwords and OTPs are securely hashed/handled, and responses avoid exposing sensitive fields.
4. **Abuse and resource limits**: rate limits cover sensitive endpoints; uploads enforce type and size; expensive operations and pagination have safe bounds; errors do not reveal internals.
5. **Dependencies, transport, and data integrity**: review audit findings; verify CORS/HTTPS assumptions and secure token transport; ensure financial mutations are atomic and cannot leave account balances inconsistent.

Resolve findings before merge or explicitly document accepted risk and rationale. Push, PR creation, and merge follow the authorization for the active task; do not merge before required CI checks and final review pass.
