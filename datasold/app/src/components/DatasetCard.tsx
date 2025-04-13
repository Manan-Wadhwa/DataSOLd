import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  Grid,
  Link,
  Typography,
} from '@mui/material';
import { PublicKey } from '@solana/web3.js';
import { Dataset } from '../types';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import StorageIcon from '@mui/icons-material/Storage';
import PersonIcon from '@mui/icons-material/Person';

interface DatasetCardProps {
  publicKey: PublicKey;
  dataset: Dataset;
  sellerName?: string;
}

const DatasetCard: React.FC<DatasetCardProps> = ({ publicKey, dataset, sellerName }) => {
  // Shorten IPFS hash for display
  const shortenedHash = dataset.ipfsHash.length > 20
    ? `${dataset.ipfsHash.slice(0, 10)}...${dataset.ipfsHash.slice(-6)}`
    : dataset.ipfsHash;

  // Format SOL price
  const price = Number(dataset.price) / LAMPORTS_PER_SOL;
  
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
        position: 'relative',
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'primary.main',
          color: 'white',
          height: '60px'
        }}
      >
        <StorageIcon sx={{ fontSize: 40 }} />
      </Box>
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
          Dataset
        </Typography>
        
        <Grid container spacing={1} sx={{ mt: 1 }}>
          <Grid item xs={4}>
            <Typography variant="body2" color="text.secondary">
              IPFS Hash:
            </Typography>
          </Grid>
          <Grid item xs={8}>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              {shortenedHash}
            </Typography>
          </Grid>
          
          <Grid item xs={4}>
            <Typography variant="body2" color="text.secondary">
              Price:
            </Typography>
          </Grid>
          <Grid item xs={8}>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {price.toFixed(2)} SOL
            </Typography>
          </Grid>
          
          {sellerName && (
            <>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">
                  Seller:
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PersonIcon fontSize="small" />
                  <Typography variant="body2">{sellerName}</Typography>
                </Box>
              </Grid>
            </>
          )}
        </Grid>
        
        <Box sx={{ mt: 2 }}>
          <Chip 
            label={dataset.isActive ? "Available" : "Sold"} 
            color={dataset.isActive ? "success" : "default"}
            size="small"
          />
        </Box>
      </CardContent>
      
      <Divider />
      
      <CardActions>
        <Button 
          component={RouterLink} 
          to={`/datasets/${publicKey.toString()}`}
          size="small" 
          fullWidth
          variant="contained"
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default DatasetCard; 