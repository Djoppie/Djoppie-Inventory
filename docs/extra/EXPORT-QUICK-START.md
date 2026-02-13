# Export Feature - Quick Start Guide

## For End Users

### How to Export Your Inventory

1. **Open the Dashboard**
   - Navigate to the main dashboard page
   - You'll see all your assets displayed

2. **Click "Export Inventory" Button**
   - Located in the toolbar, next to the view toggle
   - Has a download icon and orange gradient

3. **Choose Your Format**
   - **Excel (.xlsx)**: Best for spreadsheets, analysis, and reporting
   - **CSV (.csv)**: Universal compatibility, works everywhere

4. **Configure Your Export** (Optional)
   - **File Name**: Enter a custom name (default: "djoppie_inventory")
   - **Timestamp**: Check to add date/time to filename
   - **Filters**: Click to filter by status, category, or search
   - **Columns**: Click to choose which columns to include

5. **Click "Export"**
   - Your file downloads automatically
   - Success message appears
   - Dialog closes automatically

### Tips for Best Results

- **Excel for Analysis**: Use Excel format if you plan to create charts, pivot tables, or do data analysis
- **CSV for Import**: Use CSV format if you need to import data into another system
- **Filter Before Export**: Reduce file size by filtering to only what you need
- **Select Fewer Columns**: Faster export and smaller file size
- **Include Timestamp**: Useful for tracking when exports were created

## For Developers

### Quick Implementation

#### 1. Install Dependencies
```bash
cd src/frontend
npm install xlsx
```

#### 2. Import Components
```typescript
import ExportDialog from '../components/export/ExportDialog';
import { Asset } from '../types/asset.types';
```

#### 3. Add Export Button
```typescript
const [exportDialogOpen, setExportDialogOpen] = useState(false);

<Button
  variant="contained"
  startIcon={<DownloadIcon />}
  onClick={() => setExportDialogOpen(true)}
>
  Export
</Button>
```

#### 4. Add Export Dialog
```typescript
<ExportDialog
  open={exportDialogOpen}
  onClose={() => setExportDialogOpen(false)}
  assets={yourAssetsArray}
/>
```

### Manual Export (Programmatic)

```typescript
import { exportAssets, getDefaultExportColumns } from '../utils/exportUtils';

// Configure export
const config = {
  columns: getDefaultExportColumns(),
  format: 'xlsx', // or 'csv'
  fileName: 'my_export',
  includeTimestamp: true,
};

// Export assets
exportAssets(myAssets, config);
```

### Custom Column Configuration

```typescript
import { ExportColumn, getDefaultExportColumns } from '../utils/exportUtils';

// Start with defaults
const columns = getDefaultExportColumns();

// Enable specific columns
const customColumns = columns.map(col => ({
  ...col,
  enabled: col.key === 'assetCode' || col.key === 'assetName',
}));

// Add custom column
const allColumns: ExportColumn[] = [
  ...columns,
  { key: 'customField', label: 'Custom Label', enabled: true },
];
```

## File Locations

### Source Files
```
src/frontend/src/
├── components/export/
│   └── ExportDialog.tsx          # Main export component
├── utils/
│   └── exportUtils.ts            # Export utility functions
├── i18n/locales/
│   ├── en.json                   # English translations
│   └── nl.json                   # Dutch translations
└── pages/
    └── DashboardPage.tsx         # Integration example
```

### Documentation
```
docs/
├── EXPORT-FEATURE.md             # Comprehensive documentation
├── EXPORT-DESIGN-SHOWCASE.md     # Design system documentation
└── EXPORT-QUICK-START.md         # This file
```

## Common Customizations

### Change Default File Name
```typescript
// In ExportDialog.tsx, line ~25
const [fileName, setFileName] = useState('custom_name');
```

### Change Default Format
```typescript
// In ExportDialog.tsx, line ~24
const [format, setFormat] = useState<'xlsx' | 'csv'>('csv');
```

### Enable All Columns by Default
```typescript
// In exportUtils.ts, getDefaultExportColumns()
export const getDefaultExportColumns = (): ExportColumn[] => [
  { key: 'assetCode', label: 'Asset Code', enabled: true },
  { key: 'assetName', label: 'Asset Name', enabled: true },
  // ... change enabled: false to enabled: true for desired columns
];
```

### Add Custom Column
```typescript
// In your component
const customColumns: ExportColumn[] = [
  ...getDefaultExportColumns(),
  { key: 'customField' as keyof Asset, label: 'Custom Field', enabled: true },
];

// Then pass to ExportDialog
<ExportDialog
  open={open}
  onClose={onClose}
  assets={assets}
  // Note: You'll need to modify ExportDialog to accept columns prop
/>
```

## Translations

### Add New Translation Key

**English (en.json):**
```json
{
  "export": {
    "newKey": "New English text"
  }
}
```

**Dutch (nl.json):**
```json
{
  "export": {
    "newKey": "Nieuwe Nederlandse tekst"
  }
}
```

**Use in Component:**
```typescript
const { t } = useTranslation();
<Typography>{t('export.newKey')}</Typography>
```

## Testing Checklist

### Manual Testing
- [ ] Export button appears on dashboard
- [ ] Dialog opens when clicking export button
- [ ] Excel format selection works
- [ ] CSV format selection works
- [ ] File name input accepts text
- [ ] Timestamp checkbox toggles
- [ ] Search filter works
- [ ] Status filters work (multiple selection)
- [ ] Category filters work (multiple selection)
- [ ] Column selection works
- [ ] Select all/deselect all buttons work
- [ ] Export button disabled when no assets
- [ ] Export button disabled when no columns
- [ ] Excel export downloads file
- [ ] CSV export downloads file
- [ ] Exported file opens correctly
- [ ] Exported data is accurate
- [ ] Success message appears
- [ ] Dialog closes after export
- [ ] Dark mode works correctly
- [ ] Light mode works correctly
- [ ] Responsive layout on mobile
- [ ] Responsive layout on tablet
- [ ] Keyboard navigation works
- [ ] Screen reader accessibility

### Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Data Testing
- [ ] Empty asset list (0 assets)
- [ ] Small dataset (< 10 assets)
- [ ] Medium dataset (100-500 assets)
- [ ] Large dataset (1000+ assets)
- [ ] Assets with missing fields
- [ ] Assets with special characters
- [ ] Assets with long text fields

## Troubleshooting

### Build Errors

**"Cannot find module 'xlsx'"**
```bash
npm install xlsx
```

**"Cannot find module '../components/export/ExportDialog'"**
- Check file path is correct
- Ensure ExportDialog.tsx was created
- Try restarting dev server

### Runtime Errors

**"exportAssets is not a function"**
- Check import statement: `import { exportAssets } from '../utils/exportUtils'`
- Verify exportUtils.ts exports the function

**"No assets to export"**
- Ensure assets array is not empty
- Check assets prop is passed correctly to ExportDialog

**Export fails silently**
- Check browser console for errors
- Verify file download permissions
- Try different browser

### Styling Issues

**Colors don't match**
- Verify Material-UI theme is configured
- Check CSS custom properties are defined
- Ensure theme mode (dark/light) is detected correctly

**Button doesn't appear**
- Check component is imported
- Verify state management (exportDialogOpen)
- Check button is not hidden by CSS

## Performance Tips

### Large Datasets
- Filter before exporting to reduce data size
- Select fewer columns to speed up processing
- Use CSV for faster processing (smaller file size)

### Optimize Export Speed
```typescript
// Use useMemo for filtered assets
const filteredAssets = useMemo(() => {
  return assets.filter(/* your filters */);
}, [assets, /* filter dependencies */]);
```

### Memory Optimization
```typescript
// Disable unused columns to reduce memory
const essentialColumns = columns.filter(col =>
  ['assetCode', 'assetName', 'status'].includes(col.key)
);
```

## API Reference

### ExportDialog Props
```typescript
interface ExportDialogProps {
  open: boolean;           // Dialog visibility state
  onClose: () => void;     // Close handler
  assets: Asset[];         // Array of assets to export
}
```

### ExportConfig Interface
```typescript
interface ExportConfig {
  columns: ExportColumn[];        // Columns to include
  format: 'xlsx' | 'csv';        // Export format
  fileName: string;               // Base file name
  includeTimestamp: boolean;      // Add timestamp to filename
}
```

### ExportColumn Interface
```typescript
interface ExportColumn {
  key: keyof Asset;    // Asset property key
  label: string;       // Column header label
  enabled: boolean;    // Include in export
}
```

### Main Functions

**exportAssets(assets, config)**
- Main export function
- Throws error if no assets
- Routes to format-specific handler

**exportToExcel(assets, config)**
- Generates Excel (.xlsx) file
- Sets column widths
- Downloads file

**exportToCSV(assets, config)**
- Generates CSV file
- UTF-8 encoding
- Downloads file

**getDefaultExportColumns()**
- Returns default column configuration
- Specifies which columns enabled by default

## Support & Resources

### Documentation
- **Full Documentation**: `docs/EXPORT-FEATURE.md`
- **Design Guide**: `docs/EXPORT-DESIGN-SHOWCASE.md`
- **This Guide**: `docs/EXPORT-QUICK-START.md`

### Code Examples
- **Dashboard Integration**: `src/frontend/src/pages/DashboardPage.tsx`
- **Export Component**: `src/frontend/src/components/export/ExportDialog.tsx`
- **Utility Functions**: `src/frontend/src/utils/exportUtils.ts`

### External Resources
- [xlsx Library Documentation](https://docs.sheetjs.com/)
- [Material-UI Documentation](https://mui.com/)
- [React Documentation](https://react.dev/)

## Version Information

- **Feature Version**: 1.0.0
- **Created**: 2026-02-06
- **Framework**: React 19 + TypeScript
- **UI Library**: Material-UI v7
- **Export Library**: xlsx

---

**Need Help?**
- Check the full documentation: `docs/EXPORT-FEATURE.md`
- Review code examples in the source files
- Contact the development team
