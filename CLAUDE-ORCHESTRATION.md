# CLAUDE-ORCHESTRATION.md

## Project Orchestration & Agent Coordination

This document defines how Claude Code agents collaborate across the full stack to maintain a healthy, well-documented codebase.

---

## Project Structure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DJOPPIE INVENTORY SYSTEM                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐     ┌─────────────────┐                    │
│  │    FRONTEND     │────▶│     BACKEND     │                    │
│  │   React + TS    │     │  ASP.NET Core   │                    │
│  └────────┬────────┘     └────────┬────────┘                    │
│           │                       │                              │
│           │              ┌────────┴────────┐                    │
│           │              │    DATABASE     │                    │
│           │              │  SQLite / SQL   │                    │
│           │              └────────┬────────┘                    │
│           │                       │                              │
│           └───────────────────────┴──────────────────────┐      │
│                                                          │      │
│                    ┌─────────────────┐                   │      │
│                    │      AZURE      │◀──────────────────┘      │
│                    │  Infrastructure │                          │
│                    └─────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Agent Teams

### Frontend Team

| Agent | Role | Primary Skills |
|-------|------|----------------|
| `frontend-developer` | Component implementation | `/frontend-design` |
| `ui-design-expert` | Visual design & UX | `/frontend-design` |
| `code-review-ai:architect-review` | Architecture & review | `comprehensive-review:full-review` |

### Backend Team

| Agent | Role | Primary Skills |
|-------|------|----------------|
| `backend-architect` | API & architecture | `backend-development:api-design-principles` |
| `database-design:database-architect` | Schema & migrations | `database-migrations:sql-migrations` |
| `security-scanning:security-auditor` | Security review | `security-scanning:security-sast` |

### DevOps Team

| Agent | Role | Primary Skills |
|-------|------|----------------|
| `azure-architect` | Azure infrastructure | `cloud-infrastructure:cloud-architect` |
| `cloud-infrastructure:deployment-engineer` | CI/CD pipelines | `cloud-infrastructure:deployment-engineer` |

### Documentation Team

| Agent | Role | Primary Skills |
|-------|------|----------------|
| `documentation-writer` | User guides | `documentation-generation:docs-architect` |
| `documentation-generation:api-documenter` | API documentation | `documentation-generation:openapi-spec-generation` |

---

## Full-Stack Feature Workflow

### Phase 1: Planning

```
┌─────────────────────────────────────────────────────────────────┐
│ PLANNING PHASE                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. project-coordinator analyzes requirements                   │
│     ├── Break down into frontend/backend tasks                  │
│     ├── Identify API contracts needed                           │
│     └── Create TODO list with dependencies                      │
│                                                                  │
│  2. backend-architect designs API contract                      │
│     ├── Define endpoints                                        │
│     ├── Create DTO specifications                               │
│     └── Document in OpenAPI format                              │
│                                                                  │
│  3. frontend-architect reviews UI requirements                  │
│     ├── Component structure                                     │
│     ├── State management needs                                  │
│     └── Integration points                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 2: Implementation

```
┌─────────────────────────────────────────────────────────────────┐
│ IMPLEMENTATION PHASE (Parallel Tracks)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BACKEND TRACK                    FRONTEND TRACK                │
│  ─────────────                    ──────────────                │
│                                                                  │
│  1. database-architect            1. ui-design-expert           │
│     └── Create migrations            └── Design components      │
│                                                                  │
│  2. backend-architect             2. frontend-developer         │
│     └── Implement API                └── Build components       │
│                                                                  │
│  3. security-auditor              3. frontend-developer         │
│     └── Security review              └── API integration        │
│                                                                  │
│                    ▼ SYNC POINT ▼                               │
│              (API contract verified)                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 3: Integration & Review

```
┌─────────────────────────────────────────────────────────────────┐
│ INTEGRATION PHASE                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Full integration testing                                    │
│     ├── Frontend ↔ Backend API calls                           │
│     ├── Authentication flow                                     │
│     └── Error handling                                          │
│                                                                  │
│  2. Code review (architect-review)                              │
│     ├── Code quality                                            │
│     ├── Performance                                             │
│     └── Best practices                                          │
│                                                                  │
│  3. Documentation update                                        │
│     ├── API docs (if changed)                                   │
│     ├── CLAUDE.md (if patterns changed)                         │
│     └── User guide (if UI changed)                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 4: Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│ DEPLOYMENT PHASE                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. azure-architect                                             │
│     ├── Apply database migrations                               │
│     ├── Update App Service config (if needed)                   │
│     └── Verify Key Vault secrets                                │
│                                                                  │
│  2. deployment-engineer                                         │
│     ├── Trigger CI/CD pipeline                                  │
│     ├── Monitor deployment                                      │
│     └── Run smoke tests                                         │
│                                                                  │
│  3. Post-deployment verification                                │
│     ├── Test in production environment                          │
│     ├── Monitor Application Insights                            │
│     └── Verify all features work                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Master TODO List

### Critical Path Items

- [ ] **API Versioning** - Backend Architect
- [ ] **Error Boundary Components** - Frontend Architect
- [ ] **Request Validation Middleware** - Backend Architect
- [ ] **Bundle Size Optimization** - Frontend Architect

### Feature Backlog

| Priority | Feature | Frontend Agent | Backend Agent |
|----------|---------|----------------|---------------|
| High | Bulk asset import improvements | frontend-developer | backend-architect |
| High | Rollout reporting export | ui-design-expert | backend-architect |
| Medium | Dashboard widgets | ui-design-expert | backend-architect |
| Medium | User preferences | frontend-developer | backend-architect |
| Low | Dark mode | ui-design-expert | - |
| Low | Keyboard shortcuts | frontend-developer | - |

### Technical Debt

| Area | Issue | Owner |
|------|-------|-------|
| Frontend | ExcelJS bundle (936KB) | Frontend Architect |
| Backend | Missing input validation | Security Auditor |
| Database | Missing indexes | Database Architect |
| DevOps | No staging environment | Azure Architect |

### Documentation Tasks

| Document | Status | Owner |
|----------|--------|-------|
| API Reference (OpenAPI) | Needs update | Backend Architect |
| User Guide (Dutch) | Current | Documentation Writer |
| Deployment Guide | Current | Azure Architect |
| Architecture Diagram | Needs update | Project Coordinator |

---

## Codebase Health Metrics

### Quality Gates

```
┌─────────────────────────────────────────────────────────────────┐
│ QUALITY GATES                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend                                                        │
│  ├── TypeScript strict mode      ✓ Required                    │
│  ├── ESLint no errors            ✓ Required                    │
│  ├── Build succeeds              ✓ Required                    │
│  └── Bundle size < 2MB           ⚠ Warning at 1.5MB            │
│                                                                  │
│  Backend                                                         │
│  ├── Build succeeds              ✓ Required                    │
│  ├── All tests pass              ✓ Required                    │
│  ├── No security warnings        ✓ Required                    │
│  └── Code coverage > 60%         ◯ Target                      │
│                                                                  │
│  Database                                                        │
│  ├── Migrations reversible       ✓ Required                    │
│  ├── SQLite compatible           ✓ Required                    │
│  └── SQL Server compatible       ✓ Required                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Regular Maintenance Tasks

**Weekly:**

- [ ] Review open issues/PRs
- [ ] Check Application Insights for errors
- [ ] Update dependencies with security patches

**Monthly:**

- [ ] Run full security scan (`security-scanning:security-sast`)
- [ ] Review and optimize database queries
- [ ] Update documentation for new features
- [ ] Check bundle size and optimize if needed

**Quarterly:**

- [ ] Major dependency updates
- [ ] Architecture review
- [ ] Performance audit
- [ ] Rotate secrets in Key Vault

---

## Agent Invocation Examples

### Feature Development

```markdown
## Request: Add asset export to Excel feature

### Step 1: Plan (project-coordinator)
> Plan the asset export feature including API endpoint and UI

### Step 2: Backend (backend-architect)
> Create GET /api/assets/export endpoint returning Excel file
> Use skill: `backend-development:api-design-principles`

### Step 3: Frontend (frontend-developer)
> Add export button to asset list page with download handling
> Use skill: `/frontend-design`

### Step 4: Review (architect-review)
> Review the implementation for best practices
> Use skill: `comprehensive-review:full-review`
```

### Bug Fix

```markdown
## Request: Fix 500 error on rollout workplace import

### Step 1: Investigate (backend-architect)
> Check logs, identify root cause

### Step 2: Fix (backend-architect or database-architect)
> Implement fix based on root cause

### Step 3: Deploy (azure-architect)
> Apply fix to Azure, verify resolution
```

### Security Review

```markdown
## Request: Security audit before production release

### Step 1: Backend Review (security-auditor)
> Use skill: `security-scanning:security-sast`
> Check OWASP Top 10, auth/authz

### Step 2: Frontend Review (security-auditor)
> Check XSS, CSRF, sensitive data exposure

### Step 3: Infrastructure Review (azure-architect)
> Verify Key Vault, RBAC, network security
```

---

## Communication Templates

### Starting a Feature

```markdown
## Feature: [Feature Name]

### Requirements
[User story or requirements]

### Affected Areas
- [ ] Frontend: [components/pages affected]
- [ ] Backend: [endpoints affected]
- [ ] Database: [tables/migrations needed]
- [ ] Config: [environment variables needed]

### API Contract
[OpenAPI snippet or endpoint description]

### Assigned Agents
- Planning: project-coordinator
- Backend: backend-architect
- Frontend: frontend-developer
- Review: architect-review
```

### Completing a Task

```markdown
## Completed: [Task Name]

### Changes Made
- `file1.ts` - [description]
- `file2.cs` - [description]

### Testing Done
- [ ] Local testing passed
- [ ] Build succeeds
- [ ] Lint passes

### Documentation Updated
- [ ] CLAUDE.md (if patterns changed)
- [ ] README (if setup changed)
- [ ] API docs (if endpoints changed)

### Ready For
- [ ] Code review
- [ ] Deployment
```

---

## Escalation Path

```
Individual Agent Issue
        │
        ▼
Team Lead Agent (architect-review)
        │
        ▼
Project Coordinator
        │
        ▼
Human Developer (jo.wijnen@diepenbeek.be)
```

---

## Quick Reference: Which Agent for What?

| Task | Primary Agent | Supporting Agent |
|------|---------------|------------------|
| New page/component | frontend-developer | ui-design-expert |
| Visual redesign | ui-design-expert | frontend-developer |
| New API endpoint | backend-architect | database-architect |
| Database changes | database-architect | backend-architect |
| Security concerns | security-auditor | backend-architect |
| Deploy to Azure | azure-architect | deployment-engineer |
| CI/CD pipeline | deployment-engineer | azure-architect |
| Documentation | documentation-writer | relevant domain agent |
| Code review | architect-review | - |
| Full feature | project-coordinator | all relevant agents |

---

**Contact:** <jo.wijnen@diepenbeek.be>
