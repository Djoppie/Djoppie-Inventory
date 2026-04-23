import { useState } from 'react';
import { IconButton, Menu, MenuItem, Tooltip, CircularProgress, ListItemIcon, ListItemText } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';

interface ExportMenuProps {
  onCsvExport?: () => void;
  onExcelExport?: () => void;
  isExporting?: boolean;
  accentColor?: string;
  disabled?: boolean;
}

const ExportMenu = ({ onCsvExport, onExcelExport, isExporting, accentColor = '#FF7700', disabled }: ExportMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleCsv = () => {
    onCsvExport?.();
    handleClose();
  };

  const handleExcel = () => {
    onExcelExport?.();
    handleClose();
  };

  return (
    <>
      <Tooltip title="Exporteer">
        <span>
          <IconButton
            size="small"
            onClick={handleOpen}
            disabled={disabled || isExporting}
            sx={{ color: accentColor }}
            aria-label="Export menu"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            {isExporting ? <CircularProgress size={16} sx={{ color: accentColor }} /> : <DownloadIcon fontSize="small" />}
          </IconButton>
        </span>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {onCsvExport && (
          <MenuItem onClick={handleCsv}>
            <ListItemIcon><DescriptionIcon fontSize="small" /></ListItemIcon>
            <ListItemText>CSV (gefilterd)</ListItemText>
          </MenuItem>
        )}
        {onExcelExport && (
          <MenuItem onClick={handleExcel}>
            <ListItemIcon><TableChartIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Excel (gefilterd)</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default ExportMenu;
