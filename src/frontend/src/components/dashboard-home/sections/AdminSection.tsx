import React from 'react';
import { Box } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ApartmentIcon from '@mui/icons-material/Apartment';
import GroupsIcon from '@mui/icons-material/Groups';
import CategoryIcon from '@mui/icons-material/Category';
import BadgeIcon from '@mui/icons-material/Badge';
import { ADMIN_ORGANIZATION_COLOR } from '../../../constants/filterColors';
import { ROUTES } from '../../../constants/routes';
import DashboardSection from './DashboardSection';
import SectionKPICard from './SectionKPICard';

interface AdminSectionProps {
  buildingsCount: number;
  servicesCount: number;
  assetTypesCount: number;
  employeesCount: number;
  delay?: number;
  filterIgnored?: boolean;
}

const AdminSection: React.FC<AdminSectionProps> = ({
  buildingsCount,
  servicesCount,
  assetTypesCount,
  employeesCount,
  delay = 0,
  filterIgnored = false,
}) => {
  return (
    <DashboardSection
      title="Beheer"
      icon={<SettingsIcon />}
      accentColor={ADMIN_ORGANIZATION_COLOR}
      route={ROUTES.ADMIN}
      span={2}
      delay={delay}
      filterIgnored={filterIgnored}
    >
      {/* KPI Cards Grid - Horizontal for wide section */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(4, 1fr)',
          },
          gap: 1.5,
        }}
      >
        <SectionKPICard
          label="Gebouwen"
          value={buildingsCount}
          color="#7E57C2"
          icon={<ApartmentIcon />}
        />
        <SectionKPICard
          label="Diensten"
          value={servicesCount}
          color={ADMIN_ORGANIZATION_COLOR}
          icon={<GroupsIcon />}
        />
        <SectionKPICard
          label="Asset Types"
          value={assetTypesCount}
          color="#FF7700"
          icon={<CategoryIcon />}
        />
        <SectionKPICard
          label="Medewerkers"
          value={employeesCount}
          color="#7b1fa2"
          icon={<BadgeIcon />}
        />
      </Box>
    </DashboardSection>
  );
};

export default AdminSection;
