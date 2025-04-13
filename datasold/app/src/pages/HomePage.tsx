import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const HomePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const wallet = useAnchorWallet();

  const features = [
    {
      icon: <StorageIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: 'Secure Data Marketplace',
      description:
        'Buy and sell datasets securely on the Solana blockchain with cryptographic guarantees for authenticity.',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: 'Dispute Resolution',
      description:
        'Fair dispute resolution system to protect both buyers and sellers in case of problems with data quality.',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: 'Lightning Fast Transactions',
      description:
        'Built on Solana for lightning-fast transactions at a fraction of the cost of traditional marketplaces.',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Paper
        sx={{
          position: 'relative',
          bgcolor: 'background.paper',
          color: 'text.primary',
          mb: 6,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: 3,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.6)',
            zIndex: 1,
          }}
        />
        <Grid container>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                position: 'relative',
                p: { xs: 4, md: 6 },
                pr: { md: 0 },
                zIndex: 2,
              }}
            >
              <Typography
                component="h1"
                variant="h2"
                color="primary.main"
                gutterBottom
                sx={{ fontWeight: 700 }}
              >
                DataSOLd
              </Typography>
              <Typography variant="h5" color="inherit" paragraph sx={{ mb: 4 }}>
                The Decentralized Data Marketplace on Solana
              </Typography>
              <Typography variant="body1" color="inherit" paragraph>
                Buy and sell datasets securely, settle disputes fairly, and earn reputation in an open marketplace built on the Solana blockchain.
              </Typography>
              <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {wallet ? (
                  <>
                    <Button
                      variant="contained"
                      component={RouterLink}
                      to="/datasets"
                      size="large"
                    >
                      Browse Datasets
                    </Button>
                    <Button
                      variant="outlined"
                      component={RouterLink}
                      to="/create"
                      size="large"
                      sx={{ color: 'white', borderColor: 'white' }}
                    >
                      Sell Your Data
                    </Button>
                  </>
                ) : (
                  <>
                    <WalletMultiButton />
                    <Button
                      variant="outlined"
                      component={RouterLink}
                      to="/datasets"
                      size="large"
                      sx={{ color: 'white', borderColor: 'white' }}
                    >
                      Browse First
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Grid>
          {!isMobile && (
            <Grid item md={6}>
              <Box
                sx={{
                  position: 'relative',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  p: 4,
                }}
              >
                {/* Place for an image if needed */}
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Features Section */}
      <Typography
        component="h2"
        variant="h3"
        align="center"
        color="text.primary"
        gutterBottom
        sx={{ mb: 6 }}
      >
        Key Features
      </Typography>
      <Grid container spacing={4} sx={{ mb: 8 }}>
        {features.map((feature, index) => (
          <Grid item key={index} xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6,
                },
              }}
              elevation={2}
            >
              <Box sx={{ mb: 2 }}>{feature.icon}</Box>
              <Typography variant="h5" component="h3" gutterBottom>
                {feature.title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {feature.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Call to Action */}
      <Paper
        sx={{
          p: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          borderRadius: 2,
          mb: 4,
        }}
        elevation={3}
      >
        <Typography variant="h4" component="h2" gutterBottom>
          Ready to get started?
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 600, mb: 4 }}>
          Join the decentralized data economy today. Connect your wallet to start buying and selling datasets or browse the marketplace first.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {!wallet && <WalletMultiButton />}
          <Button
            variant="contained"
            color="primary"
            size="large"
            component={RouterLink}
            to="/datasets"
          >
            Explore Datasets
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default HomePage; 