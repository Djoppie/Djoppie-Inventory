import { Box, Typography, useTheme, CircularProgress, Chip } from '@mui/material';
import { getNeumorphColors } from '../../../utils/neumorphicStyles';
import { SECTOR_COLOR, EMPLOYEE_COLOR } from '../../../constants/filterColors';
import type { DeviceGroupMembership, GroupInfo } from '../../../types/intune-dashboard.types';

interface DeviceGroupsTabProps {
  data: DeviceGroupMembership | undefined;
  loading: boolean;
}

interface GroupSectionProps {
  title: string;
  groups: GroupInfo[];
  accentColor: string;
  isDark: boolean;
}

const GroupSection = ({ title, groups, accentColor, isDark }: GroupSectionProps) => (
  <Box sx={{ mb: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          fontSize: '0.78rem',
          color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.75)',
        }}
      >
        {title}
      </Typography>
      <Chip
        label={groups.length}
        size="small"
        sx={{
          height: 18,
          fontSize: '0.6rem',
          fontWeight: 700,
          bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
        }}
      />
    </Box>
    {groups.length === 0 ? (
      <Typography
        variant="body2"
        sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '0.75rem', pl: 1.5 }}
      >
        No groups found.
      </Typography>
    ) : (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {groups.map((group) => (
          <Box
            key={group.id}
            sx={{
              borderLeft: `3px solid ${accentColor}`,
              pl: 1.5,
              py: 0.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)',
                }}
              >
                {group.displayName}
              </Typography>
              {group.groupType && (
                <Chip
                  label={group.groupType}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 500,
                    bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
                  }}
                />
              )}
            </Box>
            {group.description && (
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
                  fontSize: '0.68rem',
                  display: 'block',
                  mt: 0.25,
                }}
              >
                {group.description}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    )}
  </Box>
);

const DeviceGroupsTab = ({ data, loading }: DeviceGroupsTabProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  getNeumorphColors(isDark);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={24} sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)' }} />
      </Box>
    );
  }

  if (!data) {
    return (
      <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', py: 2, textAlign: 'center' }}>
        No group data available.
      </Typography>
    );
  }

  return (
    <Box>
      <GroupSection title="Device Groups" groups={data.deviceGroups} accentColor={SECTOR_COLOR} isDark={isDark} />
      <GroupSection title="User Groups" groups={data.userGroups} accentColor={EMPLOYEE_COLOR} isDark={isDark} />
    </Box>
  );
};

export default DeviceGroupsTab;
