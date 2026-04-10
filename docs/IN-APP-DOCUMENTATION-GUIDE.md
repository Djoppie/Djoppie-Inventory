# In-App Documentation Guide

This guide provides a structured approach for implementing in-app help and documentation in the Djoppie-Inventory system.

## Architecture Approach

### Documentation Layers

The in-app documentation system uses a three-tier approach:

1. **Inline Help** - Tooltips, field hints, validation messages
2. **Contextual Help** - Page-specific help panels, guided tours
3. **Reference Documentation** - Searchable help center, knowledge base

### Technology Stack

- **react-joyride** - Interactive guided tours and walkthroughs
- **@mui/material/Tooltip** - Inline tooltips and hints (already available)
- **@mui/material/Drawer** - Help panel drawers
- **i18next** - Multilingual documentation support (Dutch/English)
- **markdown-to-jsx** - Render markdown content in React components

### State Management

```typescript
// src/contexts/HelpContext.tsx
interface HelpContextState {
  isHelpMode: boolean;           // Toggle help tooltips visibility
  activeHelp: string | null;      // Current help topic
  completedTours: string[];       // Completed guided tours
  toggleHelpMode: () => void;
  showHelp: (topic: string) => void;
  markTourComplete: (tourId: string) => void;
}
```

## Component Structure

### 1. HelpButton Component

Location: `src/components/help/HelpButton.tsx`

```typescript
interface HelpButtonProps {
  topic?: string;                 // Help topic identifier
  tooltipText?: string;           // Quick tooltip text
  variant?: 'icon' | 'text';      // Button style
  size?: 'small' | 'medium';
}

// Usage:
<HelpButton topic="asset-creation" tooltipText="Learn how to create assets" />
```

### 2. HelpDrawer Component

Location: `src/components/help/HelpDrawer.tsx`

```typescript
interface HelpDrawerProps {
  open: boolean;
  topic: string;                  // Maps to documentation file
  onClose: () => void;
}

// Features:
// - Renders markdown content
// - Table of contents navigation
// - Related topics suggestions
// - "Was this helpful?" feedback
```

### 3. HelpTooltip Component

Location: `src/components/help/HelpTooltip.tsx`

```typescript
interface HelpTooltipProps {
  title: string;
  description?: string;
  learnMoreTopic?: string;        // Link to detailed help
  placement?: TooltipPlacement;
  children: React.ReactElement;
}

// Usage:
<HelpTooltip
  title="Asset Code"
  description="Unique identifier for tracking assets"
  learnMoreTopic="asset-codes"
>
  <TextField name="assetCode" />
</HelpTooltip>
```

### 4. GuidedTour Component

Location: `src/components/help/GuidedTour.tsx`

```typescript
interface TourStep {
  target: string;                 // CSS selector
  content: string;                // Step description
  placement?: 'top' | 'bottom' | 'left' | 'right';
  disableBeacon?: boolean;
}

interface GuidedTourProps {
  tourId: string;
  steps: TourStep[];
  autoStart?: boolean;
  onComplete?: () => void;
}

// Usage:
const assetCreationTour = [
  {
    target: '.asset-code-field',
    content: 'Enter a unique code to identify this asset'
  },
  {
    target: '.asset-type-select',
    content: 'Select the type of asset you are creating'
  }
];
```

### 5. HelpSearchDialog Component

Location: `src/components/help/HelpSearchDialog.tsx`

```typescript
interface HelpSearchDialogProps {
  open: boolean;
  onClose: () => void;
}

// Features:
// - Fuzzy search across all help topics
// - Recent searches
// - Popular topics
// - Keyboard navigation (⌘K / Ctrl+K)
```

## Documentation Content Structure

### File Organization

```
src/help/
├── topics/
│   ├── nl/                       # Dutch documentation
│   │   ├── assets/
│   │   │   ├── creating-assets.md
│   │   │   ├── editing-assets.md
│   │   │   ├── asset-status.md
│   │   │   └── qr-codes.md
│   │   ├── rollout/
│   │   │   ├── planning.md
│   │   │   ├── execution.md
│   │   │   └── reporting.md
│   │   └── index.md
│   └── en/                       # English documentation
│       └── [same structure]
├── tours/
│   ├── asset-creation.tour.ts
│   ├── rollout-planning.tour.ts
│   └── first-login.tour.ts
└── index.ts                      # Topic registry
```

### Markdown Front Matter

```markdown
---
id: creating-assets
title: Assets aanmaken
category: assets
tags: [assets, qr-codes, templates]
relatedTopics: [editing-assets, asset-templates]
lastUpdated: 2026-04-05
---

# Assets aanmaken

Quick intro paragraph...

## Table of Contents
- [Via QR Code Scanner](#via-qr-code)
- [Via Asset Templates](#via-templates)
...
```

### Topic Registry

Location: `src/help/index.ts`

```typescript
interface HelpTopic {
  id: string;
  titleKey: string;               // i18n key
  category: string;
  path: string;                   // Markdown file path
  keywords: string[];             // Search keywords
}

export const helpTopics: HelpTopic[] = [
  {
    id: 'creating-assets',
    titleKey: 'help.topics.creatingAssets',
    category: 'assets',
    path: '/help/topics/assets/creating-assets.md',
    keywords: ['aanmaken', 'nieuw', 'asset', 'create', 'new']
  }
];
```

## Sidebar Integration

### Help Menu Addition

Update: `src/components/layout/Sidebar.tsx`

```typescript
const helpMenuItems = [
  {
    icon: <HelpOutlineIcon />,
    label: t('help.menu.helpCenter'),
    action: () => openHelpCenter(),
    badge: hasNewContent ? 'new' : undefined
  },
  {
    icon: <TourIcon />,
    label: t('help.menu.guidedTours'),
    action: () => openTourSelection()
  },
  {
    icon: <KeyboardIcon />,
    label: t('help.menu.keyboardShortcuts'),
    action: () => openShortcutsDialog()
  },
  {
    icon: <ContactSupportIcon />,
    label: t('help.menu.contact'),
    href: 'mailto:jo.wijnen@diepenbeek.be'
  }
];
```

### Help Mode Toggle

Add toggle in user menu or settings:

```typescript
<FormControlLabel
  control={
    <Switch
      checked={isHelpMode}
      onChange={toggleHelpMode}
    />
  }
  label={t('help.toggleHelpMode')}
/>
```

When enabled:
- Shows additional help icons next to complex UI elements
- Highlights interactive elements on hover
- Displays field-level guidance automatically

## Context-Sensitive Help

### Page-Level Help

Each page component registers its help topic:

```typescript
// src/pages/AssetsPage.tsx
import { useHelp } from '@/contexts/HelpContext';

export default function AssetsPage() {
  const { registerPageHelp } = useHelp();

  useEffect(() => {
    registerPageHelp({
      topic: 'managing-assets',
      quickActions: [
        { label: 'How to create an asset', topic: 'creating-assets' },
        { label: 'Understanding asset status', topic: 'asset-status' }
      ]
    });
  }, []);

  return (
    <Box>
      <PageHeader
        title="Assets"
        helpButton={<HelpButton topic="managing-assets" />}
      />
      {/* Page content */}
    </Box>
  );
}
```

### Field-Level Help

Use HelpTooltip for form fields:

```typescript
<FormControl>
  <HelpTooltip
    title={t('fields.assetCode.label')}
    description={t('fields.assetCode.help')}
    learnMoreTopic="asset-codes"
  >
    <TextField
      name="assetCode"
      label={t('fields.assetCode.label')}
      required
    />
  </HelpTooltip>
</FormControl>
```

### Action-Based Help

Trigger help before complex actions:

```typescript
const handleBulkImport = async () => {
  const hasSeenTutorial = localStorage.getItem('tutorial:bulk-import');

  if (!hasSeenTutorial) {
    const shouldShowTutorial = await confirmDialog({
      title: 'Bulk Import Tutorial',
      message: 'Would you like a quick tutorial on bulk importing?',
      confirmText: 'Yes, show me',
      cancelText: 'Skip'
    });

    if (shouldShowTutorial) {
      startTour('bulk-import');
      return;
    }
  }

  // Proceed with import
};
```

## Best Practices

### Content Guidelines

1. **Be Concise** - Users want quick answers, not essays
2. **Use Visuals** - Include screenshots and diagrams in markdown
3. **Write Task-Oriented** - Focus on "how to" rather than "what is"
4. **Progressive Disclosure** - Start simple, link to advanced topics
5. **Keep Updated** - Review help content when features change

### UX Principles

1. **Non-Intrusive** - Help should be available, not forced
2. **Contextual** - Show relevant help based on user's current task
3. **Persistent** - Don't repeatedly show tours after completion
4. **Accessible** - Keyboard navigable, screen reader compatible
5. **Fast** - Lazy-load documentation content

### Multilingual Support

All help content must support Dutch and English:

```typescript
// i18n keys for help system
export const helpTranslations = {
  nl: {
    help: {
      menu: {
        helpCenter: 'Helpcentrum',
        guidedTours: 'Rondleidingen',
        keyboardShortcuts: 'Sneltoetsen',
        contact: 'Contact support'
      },
      search: {
        placeholder: 'Zoek in documentatie...',
        noResults: 'Geen resultaten gevonden'
      }
    }
  },
  en: {
    help: {
      menu: {
        helpCenter: 'Help Center',
        guidedTours: 'Guided Tours',
        keyboardShortcuts: 'Keyboard Shortcuts',
        contact: 'Contact Support'
      },
      search: {
        placeholder: 'Search documentation...',
        noResults: 'No results found'
      }
    }
  }
};
```

### Performance Considerations

1. **Lazy Loading** - Load help content on-demand
2. **Caching** - Cache loaded markdown files in memory
3. **Code Splitting** - Separate help components into own bundle
4. **CDN Delivery** - Serve static help content from CDN in production

## Implementation Roadmap

### Phase 1: Foundation (Week 1)

- [ ] Install dependencies: `react-joyride`, `markdown-to-jsx`
- [ ] Create HelpContext and provider
- [ ] Build HelpButton component
- [ ] Build HelpTooltip component
- [ ] Create help content directory structure
- [ ] Add help menu to sidebar

**Deliverable**: Basic help infrastructure with tooltip support

### Phase 2: Content & Drawers (Week 2)

- [ ] Build HelpDrawer component
- [ ] Create markdown renderer with styling
- [ ] Write core help topics (assets, rollout)
- [ ] Implement topic registry and routing
- [ ] Add page-level help integration
- [ ] Create i18n translations for help UI

**Deliverable**: Functional help drawer with initial content

### Phase 3: Guided Tours (Week 3)

- [ ] Build GuidedTour component wrapper
- [ ] Create first-login onboarding tour
- [ ] Create asset-creation tour
- [ ] Create rollout-planning tour
- [ ] Add tour completion tracking
- [ ] Implement tour selection dialog

**Deliverable**: Interactive guided tours for key workflows

### Phase 4: Search & Polish (Week 4)

- [ ] Build HelpSearchDialog component
- [ ] Implement fuzzy search across topics
- [ ] Add keyboard shortcuts (⌘K / Ctrl+K)
- [ ] Create "Was this helpful?" feedback system
- [ ] Add related topics suggestions
- [ ] Performance optimization and testing

**Deliverable**: Complete searchable help system

### Phase 5: Advanced Features (Future)

- [ ] Video tutorial embeds
- [ ] Interactive demos (embedded Stackblitz)
- [ ] User-contributed tips system
- [ ] Analytics on help usage
- [ ] AI-powered help suggestions
- [ ] Export help content as PDF

## Code Examples

### Complete HelpContext Implementation

```typescript
// src/contexts/HelpContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

interface HelpContextState {
  isHelpMode: boolean;
  activeHelp: string | null;
  completedTours: string[];
  toggleHelpMode: () => void;
  showHelp: (topic: string) => void;
  closeHelp: () => void;
  markTourComplete: (tourId: string) => void;
}

const HelpContext = createContext<HelpContextState | undefined>(undefined);

export function HelpProvider({ children }: { children: React.ReactNode }) {
  const [isHelpMode, setIsHelpMode] = useState(false);
  const [activeHelp, setActiveHelp] = useState<string | null>(null);
  const [completedTours, setCompletedTours] = useState<string[]>(() => {
    const saved = localStorage.getItem('djoppie:completed-tours');
    return saved ? JSON.parse(saved) : [];
  });

  const toggleHelpMode = useCallback(() => {
    setIsHelpMode(prev => !prev);
  }, []);

  const showHelp = useCallback((topic: string) => {
    setActiveHelp(topic);
  }, []);

  const closeHelp = useCallback(() => {
    setActiveHelp(null);
  }, []);

  const markTourComplete = useCallback((tourId: string) => {
    setCompletedTours(prev => {
      const updated = [...prev, tourId];
      localStorage.setItem('djoppie:completed-tours', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <HelpContext.Provider
      value={{
        isHelpMode,
        activeHelp,
        completedTours,
        toggleHelpMode,
        showHelp,
        closeHelp,
        markTourComplete
      }}
    >
      {children}
    </HelpContext.Provider>
  );
}

export function useHelp() {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within HelpProvider');
  }
  return context;
}
```

### HelpButton Component

```typescript
// src/components/help/HelpButton.tsx
import { IconButton, Tooltip } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useHelp } from '@/contexts/HelpContext';

interface HelpButtonProps {
  topic: string;
  tooltipText?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function HelpButton({
  topic,
  tooltipText = 'Help',
  size = 'medium'
}: HelpButtonProps) {
  const { showHelp } = useHelp();

  return (
    <Tooltip title={tooltipText}>
      <IconButton
        onClick={() => showHelp(topic)}
        size={size}
        color="primary"
        aria-label="help"
      >
        <HelpOutlineIcon />
      </IconButton>
    </Tooltip>
  );
}
```

### Sample Guided Tour

```typescript
// src/help/tours/asset-creation.tour.ts
import { Step } from 'react-joyride';

export const assetCreationTour: Step[] = [
  {
    target: '.new-asset-button',
    content: 'Click here to start creating a new asset',
    disableBeacon: true,
    placement: 'bottom'
  },
  {
    target: '.asset-code-field',
    content: 'Enter a unique code for this asset. This will be encoded in the QR code.',
    placement: 'right'
  },
  {
    target: '.asset-type-select',
    content: 'Select the type of asset (laptop, monitor, etc.)',
    placement: 'right'
  },
  {
    target: '.intune-lookup-button',
    content: 'For Intune-managed devices, you can auto-fill hardware details',
    placement: 'left'
  },
  {
    target: '.qr-code-preview',
    content: 'Preview and download the QR code for this asset',
    placement: 'left'
  }
];
```

## Testing Checklist

- [ ] Help tooltips display correctly on all form fields
- [ ] Help drawer opens with correct content
- [ ] Markdown rendering works (headings, lists, links, code blocks)
- [ ] Guided tours complete successfully
- [ ] Tour completion state persists across sessions
- [ ] Search returns relevant results
- [ ] Keyboard shortcuts work (⌘K / Ctrl+K)
- [ ] Help content displays in both Dutch and English
- [ ] Help mode toggle works
- [ ] Mobile-responsive help drawers
- [ ] Accessible via keyboard navigation
- [ ] Screen reader compatibility

## Resources

### Dependencies

```json
{
  "react-joyride": "^2.7.0",
  "markdown-to-jsx": "^7.4.0"
}
```

### Installation

```bash
cd src/frontend
npm install react-joyride markdown-to-jsx
```

### Useful Links

- [React Joyride Documentation](https://docs.react-joyride.com/)
- [MUI Tooltip API](https://mui.com/material-ui/react-tooltip/)
- [MUI Drawer API](https://mui.com/material-ui/react-drawer/)
- [markdown-to-jsx](https://github.com/probablyup/markdown-to-jsx)

## Maintenance

### Content Updates

When features change:

1. Update relevant help topic markdown files
2. Update affected guided tour steps
3. Increment `lastUpdated` date in front matter
4. Test all related help components

### Analytics (Optional Future Enhancement)

Track help usage to improve content:

```typescript
// Log help interactions
const trackHelpEvent = (event: string, topic: string) => {
  analytics.track('Help Interaction', {
    event,
    topic,
    timestamp: new Date().toISOString()
  });
};

// Usage
showHelp('creating-assets'); // Triggers trackHelpEvent('help_opened', 'creating-assets')
```

## Contact

For questions about in-app documentation implementation:

- **Developer**: Jo Wijnen
- **Email**: jo.wijnen@diepenbeek.be
- **Repository**: https://github.com/Djoppie/Djoppie-Inventory.git
