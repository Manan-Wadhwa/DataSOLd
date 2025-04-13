import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Pages
import HomePage from './pages/HomePage';
import DatasetListPage from './pages/DatasetListPage';
import DatasetDetailPage from './pages/DatasetDetailPage';
import CreateDatasetPage from './pages/CreateDatasetPage';
import ProfilePage from './pages/ProfilePage';
import DisputesPage from './pages/DisputesPage';

// Components
import Layout from './components/Layout';
import NotFound from './components/NotFound';

// Context
import { ProgramContextProvider } from './contexts/ProgramContext';

// Create a dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#14F195', // Solana green
    },
    secondary: {
      main: '#9945FF', // Solana purple
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <ProgramContextProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/datasets" element={<DatasetListPage />} />
            <Route path="/datasets/:id" element={<DatasetDetailPage />} />
            <Route path="/create" element={<CreateDatasetPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/disputes" element={<DisputesPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </ProgramContextProvider>
    </ThemeProvider>
  );
}

export default App; 