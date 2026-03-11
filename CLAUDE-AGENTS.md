# Claude Code Agents & Skills

This document describes the custom agents and skills configured for Djoppie-Inventory development.

## Custom Agents

Located in `.claude/agents/`:

### Backend Development

| Agent | Purpose |
|-------|---------|
| `backend-architect` | API design, database schema, Azure deployment, Entity Framework migrations |
| `azure-entra-deployment` | Entra ID configuration, SSO setup, OAuth/OIDC flows, app registrations |
| `azure-deployment-architect` | Production readiness, CI/CD pipelines, Azure infrastructure |

### Frontend Development

| Agent | Purpose |
|-------|---------|
| `frontend-architect` | React/TypeScript, Vite, MUI components, TanStack Query, performance |
| `frontend-specialist` | UI/UX design, responsive layouts, animations, Material-UI theming |
| `ui-design-expert` | Visual design, logos, color schemes, modern design techniques |

### Orchestration

| Agent | Purpose |
|-------|---------|
| `project-orchestrator` | High-level architecture, feature planning, cross-layer coordination |
| `workflow-coordinator` | End-to-end features, form/list design, API contracts, UI/UX patterns |
| `documentation-writer` | README files, setup guides, user documentation |

## Skills Used

### Commit & Git

- `/commit` - Create git commits with proper formatting
- `/commit-push-pr` - Commit, push, and create pull request
- `/clean_gone` - Clean up deleted remote branches

### Code Quality

- `/code-review` - Review pull requests for issues
- `/full-review` - Comprehensive multi-dimensional review

### Documentation

- `documentation-generation:docs-architect` - Architecture documentation
- `documentation-generation:mermaid-expert` - Mermaid diagrams
- `documentation-generation:api-documenter` - OpenAPI specs

### Security

- `security-scanning:security-auditor` - Security audits, OWASP
- `security-scanning:security-sast` - Static code analysis

### Database

- `database-design:postgresql` - Schema design (adapted for SQLite/SQL Server)
- `database-migrations:sql-migrations` - Zero-downtime migrations

## Usage Examples

### Invoke an agent for architecture planning:
```
@agent-backend-architect Design the database schema for asset history tracking
```

### Use a skill for commits:
```
/commit
```

### Launch documentation generation:
```
@agent-documentation-generation:docs-architect Create architecture overview
```

## Agent Configuration

Agents are defined in `.claude/agents/*.md` with:
- Description of capabilities
- When to use (proactive triggers)
- Example prompts
- Tool access permissions

## Best Practices

1. **Use orchestrator for complex features** - `project-orchestrator` coordinates multi-layer work
2. **Proactive agent usage** - Agents marked for proactive use are automatically suggested
3. **Specialized agents for specialized tasks** - Use `azure-entra-deployment` for auth, not generic backend
4. **Documentation agents for docs** - Don't manually write docs, use the documentation agents
