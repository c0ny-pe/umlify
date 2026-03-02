import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

import { createTheme, ThemeProvider } from '@mui/material/styles';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// nodrag prevents rare bugs when editing a node.
const theme = createTheme({
  components: {
    MuiButtonBase: {
      defaultProps: {
        className: 'nodrag',
      },
    },
    MuiTextField: {
      defaultProps: {
        className: 'nodrag',
      },
    },
    MuiSelect: {
      defaultProps: {
        className: 'nodrag',
      },
    }
  },
});

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);