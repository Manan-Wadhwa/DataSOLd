import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Slider,
  TextField,
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PublishIcon from '@mui/icons-material/Publish';
import InfoIcon from '@mui/icons-material/Info';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useProgramContext } from '../contexts/ProgramContext';

const CreateDatasetPage: React.FC = () => {
  const wallet = useAnchorWallet();
  const navigate = useNavigate();
  const { userAccountData, createDataset } = useProgramContext();

  const [ipfsHash, setIpfsHash] = useState('');
  const [price, setPrice] = useState<number>(0.1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdDatasetId, setCreatedDatasetId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ipfsHash.trim()) {
      setError("Please enter a valid IPFS hash");
      return;
    }

    if (price <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const tx = await createDataset(ipfsHash, price);
      console.log("Dataset creation transaction signature:", tx);
      setSuccess(true);
      
      // For this demo, we don't have a way to directly get the dataset ID,
      // so we'd need to query for it in a real implementation
      // For now, redirect to the datasets page
      setTimeout(() => {
        navigate('/datasets');
      }, 2000);
    } catch (err) {
      console.error("Error creating dataset:", err);
      setError("Failed to create dataset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (_event: Event, newValue: number | number[]) => {
    setPrice(newValue as number);
  };

  if (!wallet) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" gutterBottom>
          Connect Your Wallet
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          You need to connect your wallet to create a dataset listing.
        </Typography>
        <WalletMultiButton />
      </Box>
    );
  }

  if (!userAccountData) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" gutterBottom>
          Create Your Profile
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          You need to create a user profile before you can list datasets.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/profile')}
        >
          Go to Profile
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        List a New Dataset
      </Typography>
      
      <Paper sx={{ p: 4, mt: 4 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Dataset Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <TextField
              label="IPFS Content Hash (CID)"
              fullWidth
              value={ipfsHash}
              onChange={(e) => setIpfsHash(e.target.value)}
              margin="normal"
              variant="outlined"
              required
              placeholder="QmT8rPDu2GFHRXbzT6iiwv3AdExFWgECyQr9Y1TTp2ARJx"
              helperText="The IPFS hash pointing to your encrypted dataset"
              disabled={loading || success}
            />
            
            <Typography id="price-slider" gutterBottom sx={{ mt: 3 }}>
              Price (SOL)
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Slider
                value={price}
                onChange={handlePriceChange}
                aria-labelledby="price-slider"
                step={0.01}
                min={0.01}
                max={10}
                valueLabelDisplay="auto"
                disabled={loading || success}
                sx={{ flex: 1, mr: 2 }}
              />
              <TextField
                value={price}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value >= 0) {
                    setPrice(value);
                  }
                }}
                type="number"
                size="small"
                InputProps={{
                  inputProps: { min: 0.01, step: 0.01 }
                }}
                sx={{ width: '100px' }}
                disabled={loading || success}
              />
            </Box>
          </Box>
          
          <Box sx={{ mt: 2, mb: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <InfoIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Important</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Before listing, make sure your data is already encrypted and uploaded to IPFS.
              The content hash you provide should point to this encrypted data.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Buyers will receive the decryption key after purchase through an off-chain mechanism.
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Dataset listed successfully! Redirecting to datasets page...
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              type="button" 
              variant="outlined" 
              sx={{ mr: 2 }}
              onClick={() => navigate('/datasets')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              startIcon={loading ? <CircularProgress size={20} /> : <PublishIcon />}
              disabled={loading || success || !ipfsHash.trim() || price <= 0}
            >
              {loading ? 'Publishing...' : 'Publish Dataset'}
            </Button>
          </Box>
        </form>
      </Paper>
      
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          How to Upload to IPFS
        </Typography>
        <Typography variant="body2" paragraph>
          1. Encrypt your dataset using a tool like GPG or any encryption software
        </Typography>
        <Typography variant="body2" paragraph>
          2. Upload the encrypted file to IPFS using one of these services:
        </Typography>
        <Box sx={{ ml: 3 }}>
          <Typography variant="body2" component="div">
            • <a href="https://web3.storage/" target="_blank" rel="noopener noreferrer">Web3.Storage</a>
          </Typography>
          <Typography variant="body2" component="div">
            • <a href="https://pinata.cloud/" target="_blank" rel="noopener noreferrer">Pinata</a>
          </Typography>
          <Typography variant="body2" component="div">
            • <a href="https://nft.storage/" target="_blank" rel="noopener noreferrer">NFT.Storage</a>
          </Typography>
        </Box>
        <Typography variant="body2" paragraph sx={{ mt: 2 }}>
          3. Copy the IPFS content identifier (CID) provided after upload
        </Typography>
        <Typography variant="body2">
          4. Paste the CID into the form above and set your desired price
        </Typography>
      </Paper>
    </Box>
  );
};

export default CreateDatasetPage; 