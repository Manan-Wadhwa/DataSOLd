import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import PersonIcon from '@mui/icons-material/Person';
import SellIcon from '@mui/icons-material/Sell';
import GavelIcon from '@mui/icons-material/Gavel';
import { PublicKey } from '@solana/web3.js';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { useProgramContext } from '../contexts/ProgramContext';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Dataset } from '../types';

const DatasetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const wallet = useAnchorWallet();
  const { 
    program, 
    userAccountData, 
    userAccount,
    fetchDataset, 
    buyDataset, 
    fileDispute 
  } = useProgramContext();

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [datasetPubkey, setDatasetPubkey] = useState<PublicKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sellerName, setSellerName] = useState<string | null>(null);
  const [sellerPubkey, setSellerPubkey] = useState<PublicKey | null>(null);

  // Transaction states
  const [buyLoading, setBuyLoading] = useState(false);
  const [buySuccess, setBuySuccess] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  // Dispute dialog states
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);
  const [disputeSuccess, setDisputeSuccess] = useState(false);

  useEffect(() => {
    const loadDataset = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        if (!program) {
          throw new Error("Program not initialized");
        }
        
        const pubkey = new PublicKey(id);
        setDatasetPubkey(pubkey);
        
        const datasetData = await fetchDataset(pubkey);
        if (!datasetData) {
          throw new Error("Dataset not found");
        }
        
        setDataset(datasetData);
        setSellerPubkey(datasetData.owner);

        // Try to get seller name
        try {
          const [userPDA] = await PublicKey.findProgramAddressSync(
            [Buffer.from('user'), datasetData.owner.toBuffer()],
            program.programId
          );
          
          const userData = await program.account.user.fetch(userPDA);
          setSellerName(userData.username);
        } catch (e) {
          setSellerName(datasetData.owner.toString().slice(0, 4) + '...' + 
                     datasetData.owner.toString().slice(-4));
        }
      } catch (err) {
        console.error("Error loading dataset:", err);
        setError("Failed to load dataset details.");
      } finally {
        setLoading(false);
      }
    };
    
    loadDataset();
  }, [id, program, fetchDataset]);

  const handleBuyDataset = async () => {
    if (!wallet || !datasetPubkey || !sellerPubkey || !dataset || !userAccount) {
      setBuyError("Cannot complete purchase. Make sure you're connected with your wallet.");
      return;
    }
    
    setBuyLoading(true);
    setBuyError(null);
    
    try {
      const tx = await buyDataset(datasetPubkey, sellerPubkey);
      console.log("Purchase transaction signature:", tx);
      setBuySuccess(true);
      
      // Refresh dataset data to show as sold
      const updatedDataset = await fetchDataset(datasetPubkey);
      setDataset(updatedDataset);
    } catch (err) {
      console.error("Error buying dataset:", err);
      setBuyError("Failed to purchase dataset. Please check your wallet has enough SOL.");
    } finally {
      setBuyLoading(false);
    }
  };

  const handleDisputeOpen = () => {
    setDisputeOpen(true);
  };

  const handleDisputeClose = () => {
    setDisputeOpen(false);
    setDisputeReason('');
    setDisputeError(null);
  };

  const handleSubmitDispute = async () => {
    if (!wallet || !datasetPubkey || !disputeReason.trim() || !userAccount) {
      setDisputeError("Cannot file dispute. Please provide a reason.");
      return;
    }
    
    setDisputeLoading(true);
    setDisputeError(null);
    
    try {
      const tx = await fileDispute(datasetPubkey, disputeReason);
      console.log("Dispute transaction signature:", tx);
      setDisputeSuccess(true);
      
      // Close the dialog after a delay
      setTimeout(() => {
        handleDisputeClose();
      }, 2000);
    } catch (err) {
      console.error("Error filing dispute:", err);
      setDisputeError("Failed to file dispute. Try again later.");
    } finally {
      setDisputeLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !dataset) {
    return (
      <Alert severity="error" sx={{ mb: 4 }}>
        {error || "Dataset not found"}
      </Alert>
    );
  }

  const formattedPrice = Number(dataset.price) / LAMPORTS_PER_SOL;
  const isOwner = wallet && sellerPubkey?.equals(wallet.publicKey);
  const canBuy = wallet && !isOwner && dataset.isActive && userAccountData;
  const canDispute = wallet && !isOwner && !dataset.isActive;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Button 
          onClick={() => navigate(-1)} 
          variant="outlined"
        >
          Back
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <StorageIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
              <Typography variant="h4" component="h1">
                Dataset Details
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  IPFS Hash
                </Typography>
              </Grid>
              <Grid item xs={12} sm={8}>
                <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                  {dataset.ipfsHash}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Price
                </Typography>
              </Grid>
              <Grid item xs={12} sm={8}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {formattedPrice.toFixed(2)} SOL
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
              </Grid>
              <Grid item xs={12} sm={8}>
                <Chip 
                  label={dataset.isActive ? "Available" : "Sold"} 
                  color={dataset.isActive ? "success" : "default"}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Seller
                </Typography>
              </Grid>
              <Grid item xs={12} sm={8}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  <Typography>{sellerName}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  ({sellerPubkey?.toString()})
                </Typography>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Dispute and support section */}
          {!isOwner && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Support
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {dataset.isActive
                  ? "If you encounter any issues after purchasing this dataset, you can file a dispute."
                  : "Have issues with this dataset? You can file a dispute to get help from our moderators."}
              </Typography>
              
              {canDispute ? (
                <Button 
                  variant="outlined" 
                  startIcon={<GavelIcon />}
                  onClick={handleDisputeOpen}
                >
                  File a Dispute
                </Button>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Disputes can only be filed for datasets you've purchased.
                </Typography>
              )}
            </Paper>
          )}
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Actions
              </Typography>
              
              {!wallet ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Connect your wallet to buy this dataset
                  </Typography>
                  <WalletMultiButton />
                </Box>
              ) : !userAccountData ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Create a user profile to start buying datasets
                  </Typography>
                  <Button 
                    variant="contained"
                    component="a"
                    href="/profile"
                  >
                    Create Profile
                  </Button>
                </Box>
              ) : dataset.isActive ? (
                <Box>
                  {isOwner ? (
                    <Alert severity="info">
                      You own this dataset
                    </Alert>
                  ) : (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom>
                        Price: {formattedPrice.toFixed(2)} SOL
                      </Typography>
                      
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<SellIcon />}
                        onClick={handleBuyDataset}
                        disabled={buyLoading || buySuccess}
                        sx={{ mt: 2 }}
                      >
                        {buyLoading ? 'Processing...' : buySuccess ? 'Purchased!' : 'Buy Now'}
                      </Button>
                      
                      {buyError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          {buyError}
                        </Alert>
                      )}
                      
                      {buySuccess && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                          Purchase successful! You now have access to this dataset.
                        </Alert>
                      )}
                    </Box>
                  )}
                </Box>
              ) : (
                <Alert severity="info">
                  This dataset has already been sold
                </Alert>
              )}
            </CardContent>
          </Card>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              About Data Marketplace
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              DataSOLd is a decentralized marketplace for buying and selling data, built on the Solana blockchain.
              All transactions are secure and verified.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Dataset content is stored on IPFS, ensuring censorship resistance and content persistence.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Dispute Dialog */}
      <Dialog open={disputeOpen} onClose={handleDisputeClose}>
        <DialogTitle>File a Dispute</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please describe the issue you're experiencing with this dataset.
            Our moderators will review your dispute.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="reason"
            label="Reason for dispute"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            disabled={disputeLoading || disputeSuccess}
          />
          {disputeError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {disputeError}
            </Alert>
          )}
          {disputeSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Dispute filed successfully!
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDisputeClose} disabled={disputeLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitDispute} 
            variant="contained" 
            disabled={!disputeReason.trim() || disputeLoading || disputeSuccess}
          >
            {disputeLoading ? 'Submitting...' : 'Submit Dispute'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DatasetDetailPage; 