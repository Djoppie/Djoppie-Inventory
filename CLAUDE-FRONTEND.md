# CLAUDE-FRONTEND.md

## Frontend Development Instructions for Claude Code Agents

This document defines how Claude Code agents should collaborate on frontend development for Djoppie Inventory.

---

## Agent Roles & Responsibilities

### 1. Frontend Specialist (`frontend-developer`)
**Primary Role:** Build React components, implement features, handle state management

**Responsibilities:**
- Implement React 19 components with TypeScript
- Manage client-side state with TanStack Query
- Handle routing with React Router
- Implement API integration with Axios
- Write responsive layouts with MUI components
- Ensure accessibility (WCAG 2.1 AA)

**When to Use:**
- Creating new page components
- Implementing CRUD operations
- Adding form handling and validation
- Integrating with backend APIs
- Fixing frontend bugs

**Skills to Invoke:**
- `/frontend-design` - For creating distinctive UI components
- `javascript-typescript:typescript-advanced-types` - For complex type definitions
- `javascript-typescript:modern-javascript-patterns` - For ES6+ patterns

---

### 2. UI Design Expert (`ui-design-expert`)
**Primary Role:** Visual design, styling, user experience optimization

**Responsibilities:**
- Create modern, professional layouts
- Implement neumorphic design elements
- Design color schemes and typography
- Add smooth animations and transitions
- Ensure visual consistency across pages
- Optimize for different screen sizes

**When to Use:**
- Designing new page layouts
- Improving visual appearance
- Creating custom components with advanced CSS
- Implementing animations
- Reviewing UI/UX decisions

**Skills to Invoke:**
- `/frontend-design` - Primary skill for all design work
- `documentation-generation:mermaid-expert` - For UI flow diagrams

---

### 3. Frontend Architect (`code-review-ai:architect-review`)
**Primary Role:** Architecture decisions, code quality, performance optimization

**Responsibilities:**
- Define component architecture patterns
- Review code for best practices
- Optimize bundle size and performance
- Establish coding standards
- Design state management strategies
- Plan feature implementations

**When to Use:**
- Planning new features
- Reviewing PRs
- Performance optimization
- Refactoring decisions
- Establishing patterns

**Skills to Invoke:**
- `comprehensive-review:full-review` - For thorough code review
- `code-refactoring:legacy-modernizer` - For modernization tasks

---

## Agent Collaboration Workflow

### Feature Development Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND FEATURE WORKFLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. PLANNING PHASE (Frontend Architect)                         │
│     ├── Analyze requirements                                    │
│     ├── Design component structure                              │
│     ├── Define types and interfaces                             │
│     └── Create implementation plan                              │
│                                                                  │
│  2. DESIGN PHASE (UI Design Expert)                             │
│     ├── Create visual mockup (if needed)                        │
│     ├── Define styling approach                                 │
│     ├── Plan animations/transitions                             │
│     └── Ensure design consistency                               │
│                                                                  │
│  3. IMPLEMENTATION PHASE (Frontend Specialist)                  │
│     ├── Create component files                                  │
│     ├── Implement business logic                                │
│     ├── Connect to APIs                                         │
│     └── Add tests                                               │
│                                                                  │
│  4. POLISH PHASE (UI Design Expert)                             │
│     ├── Refine styling                                          │
│     ├── Add micro-interactions                                  │
│     └── Optimize responsiveness                                 │
│                                                                  │
│  5. REVIEW PHASE (Frontend Architect)                           │
│     ├── Code review                                             │
│     ├── Performance check                                       │
│     └── Final approval                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Best Practices

### Component Structure
```
src/frontend/src/
├── components/
│   ├── common/           # Reusable UI components
│   │   ├── index.ts      # Barrel exports
│   │   └── [Component].tsx
│   ├── [feature]/        # Feature-specific components
│   │   ├── index.ts
│   │   └── [Component].tsx
│   └── layout/           # Layout components
├── pages/                # Page components (route-level)
├── hooks/                # Custom React hooks
│   └── use[Feature].ts
├── api/                  # API client functions
│   └── [feature].api.ts
├── types/                # TypeScript type definitions
└── utils/                # Helper functions
```

### Naming Conventions
- **Components:** PascalCase (`AssetCard.tsx`)
- **Hooks:** camelCase with `use` prefix (`useAssets.ts`)
- **API files:** camelCase with `.api.ts` suffix (`assets.api.ts`)
- **Types:** PascalCase interfaces (`Asset`, `AssetDto`)
- **Constants:** SCREAMING_SNAKE_CASE

### Performance Guidelines
1. **Code Splitting:** Use `React.lazy()` for route-level components
2. **Memoization:** Use `useMemo` and `useCallback` appropriately
3. **Query Caching:** Leverage TanStack Query's caching
4. **Bundle Size:** Monitor with `npm run build` output
5. **Images:** Use optimized formats (WebP) and lazy loading

### TypeScript Standards
```typescript
// Always define explicit return types for functions
function getAsset(id: number): Promise<Asset> { ... }

// Use interfaces for objects, types for unions/primitives
interface Asset {
  id: number;
  assetCode: string;
  status: AssetStatus;
}

type AssetStatus = 'InGebruik' | 'Stock' | 'Herstelling' | 'Defect' | 'UitDienst' | 'Nieuw';

// Use generics for reusable components
interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
}
```

---

## Current TODO Tasks

### High Priority
- [ ] **Implement skeleton loading states** for all data-heavy pages
  - Agent: Frontend Specialist
  - Files: `src/components/rollout/skeletons/`

- [ ] **Add error boundaries** to catch and display errors gracefully
  - Agent: Frontend Architect
  - Pattern: Create reusable ErrorBoundary component

- [ ] **Optimize bundle size** - ExcelJS is 936KB
  - Agent: Frontend Architect
  - Action: Consider lazy loading or alternatives

### Medium Priority
- [ ] **Create consistent form components** with validation
  - Agent: Frontend Specialist + UI Design Expert
  - Pattern: Use react-hook-form with MUI integration

- [ ] **Implement dark mode toggle**
  - Agent: UI Design Expert
  - Scope: Theme provider, color palette, persistence

- [ ] **Add loading indicators** for all API calls
  - Agent: Frontend Specialist
  - Pattern: Use TanStack Query's `isLoading` state

### Low Priority
- [ ] **Add keyboard shortcuts** for power users
  - Agent: Frontend Specialist
  - Scope: Navigation, common actions

- [ ] **Implement print stylesheets** for reports
  - Agent: UI Design Expert
  - Files: Asset details, rollout reports

---

## Code Quality Checklist

Before completing any frontend task, verify:

- [ ] TypeScript strict mode passes (`npm run build`)
- [ ] ESLint has no errors (`npm run lint`)
- [ ] Component is responsive (mobile, tablet, desktop)
- [ ] Accessibility: proper ARIA labels, keyboard navigation
- [ ] Loading states are handled
- [ ] Error states are handled
- [ ] Translations added for new text (nl.json, en.json)
- [ ] No console.log statements in production code
- [ ] API calls use TanStack Query hooks

---

## Skills Quick Reference

| Task | Skill to Use |
|------|--------------|
| Create new UI component | `/frontend-design` |
| Complex TypeScript types | `javascript-typescript:typescript-advanced-types` |
| Test implementation | `javascript-typescript:javascript-testing-patterns` |
| Code review | `comprehensive-review:full-review` |
| Refactor legacy code | `code-refactoring:legacy-modernizer` |
| Document component | `documentation-generation:docs-architect` |

---

## Integration Points

### With Backend Team
- API contracts defined in `src/frontend/src/types/`
- DTOs must match backend `DjoppieInventory.Core/DTOs/`
- Use OpenAPI spec when available

### With DevOps
- Environment variables in `.env.development` and `.env.production`
- Build output in `dist/` folder
- Static Web App configuration in `staticwebapp.config.json`

---

## Agent Communication Protocol

When handing off between agents:

```markdown
## Handoff: [Source Agent] → [Target Agent]

### Context
[Brief description of what was done]

### Files Modified
- `path/to/file.tsx` - [what changed]

### Next Steps
1. [Specific task for next agent]
2. [Another task]

### Notes
[Any important context or decisions made]
```

---

**Contact:** jo.wijnen@diepenbeek.be
