import { Chip, Tooltip } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { useTranslation } from 'react-i18next';

interface Props {
  employeeDisplayName?: string;
  onRelink?: () => void;
}

export function EmployeeLinkChip({ employeeDisplayName, onRelink }: Props) {
  const { t } = useTranslation();
  if (employeeDisplayName) {
    return (
      <Tooltip title={t('requests.form.linkedEmployee')}>
        <Chip icon={<LinkIcon />} label={employeeDisplayName} color="success" size="small" />
      </Tooltip>
    );
  }
  return (
    <Tooltip title={t('requests.form.notLinked')}>
      <Chip
        icon={<LinkOffIcon />}
        label={t('requests.form.notLinked')}
        size="small"
        variant="outlined"
        color="warning"
        onClick={onRelink}
      />
    </Tooltip>
  );
}
