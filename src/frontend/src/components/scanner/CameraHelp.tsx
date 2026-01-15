import { Box, Typography, Paper, List, ListItem, ListItemIcon, ListItemText, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HttpsIcon from '@mui/icons-material/Https';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import BlockIcon from '@mui/icons-material/Block';

const CameraHelp = () => {
  return (
    <Box sx={{ mt: 3 }}>
      <Accordion
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
          '&:before': { display: 'none' },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            backgroundColor: 'background.paper',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
            📹 Camera Troubleshooting Guide
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Common Issues */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Common Issues & Solutions:
            </Typography>

            <List dense>
              {/* Permission Issue */}
              <ListItem sx={{ alignItems: 'flex-start', py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                  <BlockIcon sx={{ color: 'error.main' }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Permission Denied
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      Click the camera icon in your browser's address bar and select "Allow".
                      Then refresh the page and try again.
                    </Typography>
                  }
                />
              </ListItem>

              {/* HTTPS Issue */}
              <ListItem sx={{ alignItems: 'flex-start', py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                  <HttpsIcon sx={{ color: 'warning.main' }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Not Using HTTPS
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      Camera access requires HTTPS. Use localhost for development or deploy to a secure server.
                      Check if your URL starts with "https://" or "http://localhost".
                    </Typography>
                  }
                />
              </ListItem>

              {/* No Camera */}
              <ListItem sx={{ alignItems: 'flex-start', py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                  <CameraAltIcon sx={{ color: 'info.main' }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      No Camera Detected
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      Ensure your device has a working camera. Check if other apps can access it.
                      For external cameras, verify the USB connection.
                    </Typography>
                  }
                />
              </ListItem>

              {/* Camera In Use */}
              <ListItem sx={{ alignItems: 'flex-start', py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                  <SettingsIcon sx={{ color: 'warning.main' }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Camera Already In Use
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      Close other applications using the camera (Zoom, Teams, Skype, etc.).
                      Check for other browser tabs accessing the camera.
                    </Typography>
                  }
                />
              </ListItem>
            </List>

            {/* Browser Steps */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main', display: 'block', mb: 1 }}>
                ✓ Quick Fix Steps:
              </Typography>
              <List dense sx={{ pl: 2 }}>
                <ListItem sx={{ py: 0.5, pl: 0 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="caption">
                        Refresh the page and click "Allow" when prompted
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5, pl: 0 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="caption">
                        Check browser settings: Settings → Privacy → Camera
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5, pl: 0 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="caption">
                        Try a different browser (Chrome, Firefox, Edge)
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5, pl: 0 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="caption">
                        Use the "Manual Entry" tab as an alternative
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </Box>

            {/* Alternative */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: 'info.dark',
                borderColor: 'primary.main',
                opacity: 0.9,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
                💡 Can't fix the camera? Use the "Manual Entry" tab to type the asset code directly!
              </Typography>
            </Paper>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default CameraHelp;
