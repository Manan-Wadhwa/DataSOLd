import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  TextField,
  Typography,
  Chip,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import StorageIcon from '@mui/icons-material/Storage';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useProgramContext } from '../contexts/ProgramContext';
import DatasetCard from '../components/DatasetCard';

const ProfilePage: React.FC = () => {
  const wallet = useAnchorWallet();
  const { 
    userAccountData, 
    userAccount, 
    createUser, 
    fetchUserDatasets 
  } = useProgramContext();

  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userDatasets, setUserDatasets] = useState<any[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);

  useEffect(() => {
    if (wallet && userAccountData) {
      loadUserDatasets();
    }
  }, [wallet, userAccountData]);

  const loadUserDatasets = async () => {
    if (!wallet) return;
    
    setDatasetsLoading(true);
    try {
      const datasets = await fetchUserDatasets();
      setUserDatasets(datasets);
    } catch (err) {
      console.error("Error loading user datasets:", err);
    } finally {
      setDatasetsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const tx = await createUser(username);
      console.log("User creation transaction signature:", tx);
      setSuccess(true);
    } catch (err) {
      console.error("Error creating user:", err);
      setError("Failed to create user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!wallet) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" gutterBottom>
          Connect Your Wallet
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          You need to connect your wallet to access your profile.
        </Typography>
        <WalletMultiButton />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {userAccountData ? 'Your Profile' : 'Create Your Profile'}
      </Typography>
      
      {!userAccountData ? (
        <Paper sx={{ p: 4, mt: 4 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                User Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <TextField
                label="Username"
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                variant="outlined"
                required
                placeholder="Choose a username"
                helperText="This name will be visible to other users"
                disabled={loading || success}
              />
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Profile created successfully!
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button 
                type="submit" 
                variant="contained" 
                startIcon={loading ? <CircularProgress size={20} /> : <PersonIcon />}
                disabled={loading || success || !username.trim()}
                size="large"
              >
                {loading ? 'Creating...' : 'Create Profile'}
              </Button>
            </Box>
          </form>
        </Paper>
      ) : (
        <Box>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    pb: 2
                  }}>
                    <Box sx={{ 
                      width: 80, 
                      height: 80, 
                      borderRadius: '50%', 
                      bgcolor: 'primary.main', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      mb: 2
                    }}>
                      <PersonIcon sx={{ fontSize: 40, color: 'white' }} />
                    </Box>
                    
                    <Typography variant="h5" sx={{ mb: 0.5 }}>
                      {userAccountData.username}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <StarIcon sx={{ color: 'warning.main', mr: 0.5 }} />
                      <Typography variant="body2" color="text.secondary">
                        Reputation: {userAccountData.reputation}
                      </Typography>
                    </Box>
                    
                    {userAccountData.isBanned && (
                      <Chip 
                        label="Account Banned" 
                        color="error" 
                        size="small" 
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Wallet Address:
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {wallet.publicKey.toString()}
                  </Typography>
                </CardContent>
              </Card>
              
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Profile Information
                </Typography>
                <Typography variant="body2" paragraph>
                  Your reputation score increases when buyers are satisfied with your data quality.
                </Typography>
                <Typography variant="body2">
                  Higher reputation means more visibility for your datasets in the marketplace.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Your Datasets
                </Typography>
                
                {datasetsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : userDatasets.length > 0 ? (
                  <Grid container spacing={3}>
                    {userDatasets.map((item) => (
                      <Grid item xs={12} sm={6} key={item.publicKey.toString()}>
                        <DatasetCard
                          publicKey={item.publicKey}
                          dataset={item.account}
                          sellerName={userAccountData.username}
                        />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <StorageIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" paragraph>
                      You haven't listed any datasets yet.
                    </Typography>
                    <Button 
                      variant="contained" 
                      href="/create" 
                      startIcon={<StorageIcon />}
                    >
                      Create Dataset Listing
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default ProfilePage; 