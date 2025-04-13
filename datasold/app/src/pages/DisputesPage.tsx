import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
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
  Typography,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { useProgramContext } from '../contexts/ProgramContext';
import { PublicKey } from '@solana/web3.js';
import { formatDistanceToNow } from 'date-fns';

interface Dispute {
  publicKey: PublicKey;
  account: {
    dataset: PublicKey;
    challenger: PublicKey;
    reason: string;
    createdAt: { toNumber: () => number };
    status: number;
    result: boolean;
    resolver: PublicKey;
    resolvedAt: { toNumber: () => number };
  };
}

const DisputesPage: React.FC = () => {
  const wallet = useAnchorWallet();
  const { isAdmin, fetchDisputes, resolveDispute } = useProgramContext();

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Resolve dialog state
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolveSuccess, setResolveSuccess] = useState(false);

  useEffect(() => {
    loadDisputes();
  }, [wallet]);

  const loadDisputes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const disputesData = await fetchDisputes();
      setDisputes(disputesData as Dispute[]);
    } catch (err) {
      console.error("Error loading disputes:", err);
      setError("Failed to load disputes. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResolveDialog = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setResolveDialogOpen(true);
    setResolveError(null);
    setResolveSuccess(false);
  };

  const handleCloseResolveDialog = () => {
    setResolveDialogOpen(false);
    setSelectedDispute(null);
  };

  const handleResolveDispute = async (inFavorOfChallenger: boolean) => {
    if (!selectedDispute) return;
    
    setResolveLoading(true);
    setResolveError(null);
    
    try {
      const tx = await resolveDispute(
        selectedDispute.publicKey, 
        selectedDispute.account.dataset, 
        inFavorOfChallenger
      );
      console.log("Resolve dispute transaction signature:", tx);
      setResolveSuccess(true);
      
      // Refresh disputes list after successful resolution
      await loadDisputes();
      
      // Close dialog after a delay
      setTimeout(() => {
        handleCloseResolveDialog();
      }, 2000);
    } catch (err) {
      console.error("Error resolving dispute:", err);
      setResolveError("Failed to resolve dispute. Please try again.");
    } finally {
      setResolveLoading(false);
    }
  };

  if (!wallet) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" gutterBottom>
          Connect Your Wallet
        </Typography>
        <Typography variant="body1" paragraph>
          You need to connect your wallet to access this page.
        </Typography>
        <Button variant="contained" color="primary">
          Connect Wallet
        </Button>
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <GavelIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Admin Access Only
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This page is only accessible to marketplace administrators.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dispute Resolution
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Review and resolve user disputes for dataset purchases.
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : disputes.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <GavelIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No Disputes Found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            There are currently no disputes to resolve.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {disputes.map((dispute) => {
            const isPending = dispute.account.status === 0;
            const createdDate = new Date(dispute.account.createdAt.toNumber() * 1000);
            const timeAgo = formatDistanceToNow(createdDate, { addSuffix: true });
            
            return (
              <Grid item xs={12} md={6} key={dispute.publicKey.toString()}>
                <Card sx={{ 
                  height: '100%',
                  border: isPending ? '1px solid' : 'none',
                  borderColor: isPending ? 'warning.main' : 'divider',
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <GavelIcon sx={{ mr: 1, color: isPending ? 'warning.main' : 'success.main' }} />
                        <Typography variant="h6">
                          Dispute #{dispute.publicKey.toString().slice(0, 8)}
                        </Typography>
                      </Box>
                      <Chip 
                        icon={isPending ? <AccessTimeIcon /> : <CheckCircleIcon />}
                        label={isPending ? "Pending" : "Resolved"} 
                        color={isPending ? "warning" : "success"}
                        size="small"
                      />
                    </Box>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          Dataset:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                          {dispute.account.dataset.toString().slice(0, 16)}...
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          Filed by:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                          {dispute.account.challenger.toString().slice(0, 16)}...
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          Filed:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">
                          {timeAgo}
                        </Typography>
                      </Grid>
                      
                      {!isPending && (
                        <>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">
                              Result:
                            </Typography>
                          </Grid>
                          <Grid item xs={8}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {dispute.account.result ? (
                                <>
                                  <ThumbUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                                  <Typography variant="body2">In favor of buyer</Typography>
                                </>
                              ) : (
                                <>
                                  <ThumbDownIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                                  <Typography variant="body2">In favor of seller</Typography>
                                </>
                              )}
                            </Box>
                          </Grid>
                        </>
                      )}
                    </Grid>
                    
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Reason:
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {dispute.account.reason}
                      </Typography>
                    </Box>
                  </CardContent>
                  
                  {isPending && (
                    <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                      <Button 
                        variant="outlined" 
                        color="primary"
                        onClick={() => handleOpenResolveDialog(dispute)}
                      >
                        Resolve Dispute
                      </Button>
                    </CardActions>
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
      
      {/* Resolve Dialog */}
      <Dialog
        open={resolveDialogOpen}
        onClose={handleCloseResolveDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Resolve Dispute</DialogTitle>
        <DialogContent>
          {selectedDispute && (
            <>
              <DialogContentText paragraph>
                Please review the dispute details carefully before making a decision.
              </DialogContentText>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Dispute Reason:
                </Typography>
                <Typography variant="body2" paragraph sx={{ pl: 2 }}>
                  {selectedDispute.account.reason}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Choose a verdict:
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<ThumbDownIcon />}
                    onClick={() => handleResolveDispute(false)}
                    disabled={resolveLoading || resolveSuccess}
                    sx={{ flex: 1, mr: 1 }}
                  >
                    Favor Seller
                  </Button>
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<ThumbUpIcon />}
                    onClick={() => handleResolveDispute(true)}
                    disabled={resolveLoading || resolveSuccess}
                    sx={{ flex: 1, ml: 1 }}
                  >
                    Favor Buyer
                  </Button>
                </Box>
              </Box>
              
              {resolveError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {resolveError}
                </Alert>
              )}
              
              {resolveSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Dispute resolved successfully!
                </Alert>
              )}
              
              {resolveLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResolveDialog} disabled={resolveLoading}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DisputesPage; 