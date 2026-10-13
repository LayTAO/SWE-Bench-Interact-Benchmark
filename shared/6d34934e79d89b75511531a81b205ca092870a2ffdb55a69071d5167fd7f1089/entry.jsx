import React from 'react';
import { createRoot } from 'react-dom/client';
import Button from '/subject/packages/mui-material/src/Button/Button.js';
import Menu from '/subject/packages/mui-material/src/Menu/Menu.js';
import MenuItem from '/subject/packages/mui-material/src/MenuItem/MenuItem.js';
import { ThemeProvider, createTheme } from '/subject/packages/mui-material/src/styles/index.js';

const theme = createTheme({
  components: {
    MuiMenu: { styleOverrides: { paper: { borderRadius: 4 } } },
    MuiPopover: { styleOverrides: { paper: { borderRadius: 8, height: 100 } } },
    MuiPaper: { styleOverrides: { root: { borderRadius: 16, height: 200, width: 200 } } },
  },
});

function App() {
  const [anchor, setAnchor] = React.useState(null);
  return (
    <ThemeProvider theme={theme}>
      <main style={{ padding: 80 }}>
        <span id="oracle-ready" />
        <Button onClick={(event) => setAnchor(event.currentTarget)}>Open themed menu</Button>
        <Menu
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={() => setAnchor(null)}
          PaperProps={{ 'data-testid': 'menu-paper' }}
        >
          <MenuItem>First item</MenuItem>
          <MenuItem>Second item</MenuItem>
        </Menu>
      </main>
    </ThemeProvider>
  );
}

createRoot(document.getElementById('app')).render(<App />);
