import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Skeleton, 
  Paper,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StorageIcon from '@mui/icons-material/Storage';
import { PublicKey } from '@solana/web3.js';
import { Dataset } from '../types';
import { useProgramContext } from '../contexts/ProgramContext';
import DatasetCard from '../components/DatasetCard';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { Link as RouterLink } from 'react-router-dom';

type DatasetWithPublicKey = {
  publicKey: PublicKey;
  account: Dataset;
  sellerName?: string;
};

const DatasetListPage: React.FC = () => {
  const { program, fetchDatasets } = useProgramContext();
  const [datasets, setDatasets] = useState<DatasetWithPublicKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const wallet = useAnchorWallet();

  useEffect(() => {
    const loadDatasets = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!program) {
          throw new Error("Program not initialized");
        }
        
        const datasetsResponse = await fetchDatasets();
        const enrichedDatasets = await Promise.all(
          datasetsResponse.map(async (item) => {
            try {
              // Get seller username if possible
              let sellerName;
              try {
                const userPDA = await PublicKey.findProgramAddressSync(
                  [Buffer.from('user'), item.account.owner.toBuffer()],
                  program.programId
                )[0];
                
                const userData = await program.account.user.fetch(userPDA);
                sellerName = userData.username;
              } catch (e) {
                sellerName = item.account.owner.toString().slice(0, 4) + '...' + 
                           item.account.owner.toString().slice(-4);
              }
              
              return {
                ...item,
                sellerName
              };
            } catch (e) {
              return item;
            }
          })
        );
        
        setDatasets(enrichedDatasets);
      } catch (err) {
        console.error("Error loading datasets:", err);
        setError("Failed to load datasets. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    loadDatasets();
  }, [program, fetchDatasets]);

  // Filter datasets based on search term
  const filteredDatasets = datasets.filter(dataset => {
    return dataset.account.ipfsHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (dataset.sellerName && 
            dataset.sellerName.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // Sort datasets based on sort selection
  const sortedDatasets = [...filteredDatasets].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.account.price.lt(b.account.price) ? -1 : 1;
      case 'price-high':
        return a.account.price.gt(b.account.price) ? -1 : 1;
      case 'newest':
      default:
        // We don't have a timestamp in our data model, so we'll use the natural order
        return 0;
    }
  });

  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Skeleton loader for datasets
  const datasetSkeletons = Array(6).fill(0).map((_, index) => (
    <Grid item xs={12} sm={6} md={4} key={`skeleton-${index}`}>
      <Paper sx={{ p: 2, height: '100%' }}>
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="text" sx={{ fontSize: '2rem', mt: 1 }} />
        <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
        <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
        <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
        <Skeleton variant="rectangular" height={40} sx={{ mt: 2 }} />
      </Paper>
    </Grid>
  ));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Available Datasets
        </Typography>
        
        {wallet && (
          <Button
            variant="contained"
            component={RouterLink}
            to="/create"
            startIcon={<StorageIcon />}
          >
            Sell Data
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <TextField
          label="Search datasets"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="sort-select-label">Sort By</InputLabel>
          <Select
            labelId="sort-select-label"
            value={sortBy}
            label="Sort By"
            onChange={handleSortChange}
          >
            <MenuItem value="newest">Newest</MenuItem>
            <MenuItem value="price-low">Price: Low to High</MenuItem>
            <MenuItem value="price-high">Price: High to Low</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Grid container spacing={3}>
          {datasetSkeletons}
        </Grid>
      ) : sortedDatasets.length > 0 ? (
        <Grid container spacing={3}>
          {sortedDatasets.map((dataset) => (
            <Grid item xs={12} sm={6} md={4} key={dataset.publicKey.toString()}>
              <DatasetCard
                publicKey={dataset.publicKey}
                dataset={dataset.account}
                sellerName={dataset.sellerName}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <StorageIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" paragraph>
            No datasets found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {searchTerm ? 'Try a different search term' : 'Be the first to list a dataset!'}
          </Typography>
          {wallet && (
            <Button
              variant="contained"
              component={RouterLink}
              to="/create"
              startIcon={<StorageIcon />}
            >
              List a Dataset
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default DatasetListPage; 