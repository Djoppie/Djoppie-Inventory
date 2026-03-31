# Frontend Development Instructions

Instructions for Claude Code agents working on the React frontend.

## Technology Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **Material-UI (MUI)** for components
- **TanStack Query** for server state
- **React Router** for navigation
- **MSAL React** for authentication
- **Axios** for HTTP requests

## Project Structure

```
src/frontend/src/
├── api/                    # API client layer
│   ├── client.ts           # Axios instance
│   ├── authInterceptor.ts  # MSAL token injection
│   ├── assets.api.ts       # Asset endpoints
│   └── rollout.api.ts      # Rollout endpoints
│
├── components/             # UI components (by feature)
│   ├── assets/             # Asset-related components
│   ├── rollout/            # Rollout feature
│   │   ├── planner/        # Planning components
│   │   ├── execution/      # Execution components
│   │   └── workplace-dialog/
│   ├── common/             # Shared components
│   └── layout/             # Layout components
│
├── hooks/                  # Custom React hooks
│   ├── useAssets.ts
│   └── rollout/            # Rollout hooks
│       ├── useRolloutSessions.ts
│       ├── useRolloutDays.ts
│       └── useRolloutWorkplaces.ts
│
├── pages/                  # Page components
│   ├── DashboardPage.tsx
│   ├── AssetListPage.tsx
│   ├── RolloutPlannerPage.tsx
│   └── RolloutExecutionPage.tsx
│
├── types/                  # TypeScript definitions
│   ├── asset.types.ts
│   └── rollout.ts
│
├── utils/                  # Utilities
│   ├── neumorphicStyles.ts # Neumorphic design helpers
│   └── dataGridStyles.ts   # DataGrid styling
│
├── constants/              # App constants
│   └── routes.ts
│
└── i18n/                   # Translations (nl/en)
```

## Key Commands

```bash
# Install dependencies
npm install

# Run dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## Coding Standards

### Components
- Functional components with hooks
- TypeScript interfaces for props
- Use MUI components for consistency

```tsx
interface AssetCardProps {
  asset: Asset;
  onEdit: (id: number) => void;
}

export default function AssetCard({ asset, onEdit }: AssetCardProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{asset.name}</Typography>
      </CardContent>
    </Card>
  );
}
```

### API Layer
- One file per feature in `api/`
- Use Axios with auth interceptor
- Define TypeScript types

```typescript
// api/assets.api.ts
export const getAssets = async (): Promise<Asset[]> => {
  const { data } = await client.get<Asset[]>('/assets');
  return data;
};
```

### Hooks with TanStack Query
- Custom hooks for data fetching
- Use query keys consistently
- Handle loading and error states

```typescript
// hooks/useAssets.ts
export function useAssets() {
  return useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}
```

### Query Keys Pattern
```typescript
// hooks/rollout/keys.ts
export const rolloutKeys = {
  all: ['rollout'] as const,
  sessions: () => [...rolloutKeys.all, 'sessions'] as const,
  session: (id: number) => [...rolloutKeys.sessions(), id] as const,
  days: (sessionId: number) => [...rolloutKeys.all, 'days', sessionId] as const,
};
```

## Styling

### Neumorphic Design
Use `utils/neumorphicStyles.ts` for consistent shadows:
```typescript
import { getNeumorph, getNeumorphInset } from '../utils/neumorphicStyles';

<Box sx={{ boxShadow: getNeumorph(isDark, 'medium') }}>
```

### Theme Colors
- Primary: `#FF7700` (orange)
- Success: `#10B981` (green)
- Info: `#3B82F6` (blue)
- Accent: `#26A69A` (teal)

### DataGrid Styling
```typescript
import { getNeumorphDataGrid } from '../utils/dataGridStyles';

<DataGrid sx={getNeumorphDataGrid(isDark)} />
```

## Routing

```typescript
// constants/routes.ts
export const ROUTES = {
  DASHBOARD: '/',
  ASSETS: '/assets',
  ROLLOUTS: '/rollouts',
  ROLLOUT_PLANNER: '/rollouts/:id/plan',
  ROLLOUT_EXECUTE: '/rollouts/:id/execute',
};

export const buildRoute = {
  rolloutPlanner: (id: number) => `/rollouts/${id}/plan`,
  rolloutExecute: (id: number) => `/rollouts/${id}/execute`,
};
```

## Authentication

MSAL is configured in `config/msalConfig.ts`:
- Tokens auto-injected via Axios interceptor
- Use `useMsal()` hook for auth state
- Protected routes require authentication

## State Management

- **Server state**: TanStack Query (for API data)
- **UI state**: React useState/useReducer
- **Global state**: React Context (minimal use)

## Cache Invalidation

Always invalidate related queries after mutations:
```typescript
onSuccess: (_, variables) => {
  queryClient.invalidateQueries({ queryKey: rolloutKeys.all });
  queryClient.invalidateQueries({
    queryKey: rolloutKeys.days(variables.sessionId)
  });
},
```

## Common Patterns

### Loading States
```tsx
if (isLoading) return <LinearProgress />;
if (error) return <Alert severity="error">{error.message}</Alert>;
```

### Dialog Pattern
```tsx
const [dialogOpen, setDialogOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<Item | null>(null);

const handleEdit = (item: Item) => {
  setSelectedItem(item);
  setDialogOpen(true);
};
```

### Form with React Hook Form
```tsx
import { useForm } from 'react-hook-form';

const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
```

## Internationalization

Translations in `i18n/nl.json` and `i18n/en.json`:
```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
return <Typography>{t('assets.title')}</Typography>;
```
