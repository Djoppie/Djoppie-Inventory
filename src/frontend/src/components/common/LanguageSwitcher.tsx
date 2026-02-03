import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageIcon from '@mui/icons-material/Language';
import CheckIcon from '@mui/icons-material/Check';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    handleClose();
  };

  const languages = [
    { code: 'nl', name: t('language.dutch'), flag: '🇳🇱' },
    { code: 'en', name: t('language.english'), flag: '🇬🇧' },
  ];

  return (
    <>
      <Tooltip title={t('language.selectLanguage')}>
        <IconButton
          onClick={handleClick}
          sx={{
            color: 'text.primary',
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': {
              borderColor: 'primary.main',
              boxShadow: '0 0 8px rgba(255, 215, 0, 0.3)',
            },
          }}
        >
          <LanguageIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            border: '1px solid',
            borderColor: 'divider',
            minWidth: 180,
          },
        }}
      >
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            selected={lang.code === i18n.language}
            sx={{
              fontFamily: 'monospace',
              '&.Mui-selected': {
                backgroundColor: 'action.selected',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              },
            }}
          >
            <ListItemText>
              <span style={{ marginRight: '8px' }}>{lang.flag}</span>
              {lang.name}
            </ListItemText>
            {lang.code === i18n.language && (
              <ListItemIcon sx={{ minWidth: 'auto', ml: 2 }}>
                <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
              </ListItemIcon>
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSwitcher;
