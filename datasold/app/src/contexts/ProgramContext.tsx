import React, { createContext, useContext, useEffect, useState } from 'react';
import { AnchorProvider, Program, Idl, BN } from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import idl from '../idl/datasold.json';

// Define interfaces for our data structures
interface User {
  username: string;
  authority: PublicKey;
  reputation: number;
  isBanned: boolean;
  bump: number;
}

interface Dataset {
  owner: PublicKey;
  price: BN;
  ipfsHash: string;
  isActive: boolean;
  bump: number;
}

interface Dispute {
  dataset: PublicKey;
  challenger: PublicKey;
  reason: string;
  createdAt: BN;
  status: number;
  result: boolean;
  resolver: PublicKey;
  resolvedAt: BN;
  bump: number;
}

interface ProgramContextType {
  program: Program | null;
  provider: AnchorProvider | null;
  programId: PublicKey;
  userAccount: PublicKey | null;
  userAccountData: User | null;
  isAdmin: boolean;
  fetchUserAccount: () => Promise<void>;
  createUser: (username: string) => Promise<string>;
  createDataset: (ipfsHash: string, price: number) => Promise<string>;
  buyDataset: (datasetPubkey: PublicKey, sellerPubkey: PublicKey) => Promise<string>;
  fileDispute: (datasetPubkey: PublicKey, reason: string) => Promise<string>;
  resolveDispute: (disputePubkey: PublicKey, datasetPubkey: PublicKey, verdict: boolean) => Promise<string>;
  fetchDatasets: () => Promise<{ publicKey: PublicKey; account: Dataset }[]>;
  fetchUserDatasets: () => Promise<{ publicKey: PublicKey; account: Dataset }[]>;
  fetchDataset: (publicKey: PublicKey) => Promise<Dataset | null>;
  fetchDisputes: () => Promise<{ publicKey: PublicKey; account: Dispute }[]>;
}

const ProgramContext = createContext<ProgramContextType>({
  program: null,
  provider: null,
  programId: new PublicKey('7f2vK2P7uWAQY6QS7P8jPhQvbrs6F1BSc4zdejQrcSRn'),
  userAccount: null,
  userAccountData: null,
  isAdmin: false,
  fetchUserAccount: async () => {},
  createUser: async () => '',
  createDataset: async () => '',
  buyDataset: async () => '',
  fileDispute: async () => '',
  resolveDispute: async () => '',
  fetchDatasets: async () => [],
  fetchUserDatasets: async () => [],
  fetchDataset: async () => null,
  fetchDisputes: async () => [],
});

export const useProgramContext = () => useContext(ProgramContext);

export const ProgramContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [program, setProgram] = useState<Program | null>(null);
  const [provider, setProvider] = useState<AnchorProvider | null>(null);
  const [userAccount, setUserAccount] = useState<PublicKey | null>(null);
  const [userAccountData, setUserAccountData] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [globalState, setGlobalState] = useState<PublicKey | null>(null);

  // The program ID from the IDL
  const programId = new PublicKey(idl.metadata.address);

  useEffect(() => {
    // Initialize the provider and program when wallet connects
    if (wallet) {
      const provider = new AnchorProvider(
        connection,
        wallet,
        AnchorProvider.defaultOptions()
      );
      
      // Create the program interface using the IDL
      const program = new Program(idl as Idl, programId, provider);
      
      setProvider(provider);
      setProgram(program);

      // Find the global state PDA
      PublicKey.findProgramAddressSync(
        [Buffer.from('global_state')],
        programId
      ).then(([statePDA, _]) => {
        setGlobalState(statePDA);
      });

      // Try to find user account
      fetchUserAccount();
    } else {
      setProvider(null);
      setProgram(null);
      setUserAccount(null);
      setUserAccountData(null);
      setIsAdmin(false);
    }
  }, [wallet, connection]);

  const fetchUserAccount = async () => {
    if (!program || !wallet) return;

    try {
      // Find the user PDA
      const [userPDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from('user'), wallet.publicKey.toBuffer()],
        programId
      );
      
      setUserAccount(userPDA);

      // Fetch the user account data
      try {
        const userData = await program.account.user.fetch(userPDA);
        setUserAccountData(userData as unknown as User);
        
        // If global state exists, check if user is admin
        if (globalState) {
          const stateData = await program.account.globalState.fetch(globalState);
          setIsAdmin(wallet.publicKey.equals(stateData.authority));
        }
      } catch (e) {
        // User account doesn't exist yet
        console.log("User account not found");
      }
    } catch (error) {
      console.error("Error fetching user account:", error);
    }
  };

  const createUser = async (username: string): Promise<string> => {
    if (!program || !wallet || !globalState) throw new Error("Program not initialized");

    try {
      const [userPDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from('user'), wallet.publicKey.toBuffer()],
        programId
      );

      const tx = await program.methods
        .createUser(username)
        .accounts({
          user: userPDA,
          authority: wallet.publicKey,
          globalState,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await fetchUserAccount();
      return tx;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  };

  const createDataset = async (ipfsHash: string, price: number): Promise<string> => {
    if (!program || !wallet || !globalState || !userAccount) 
      throw new Error("Program not initialized or user not created");

    try {
      // Convert price to lamports
      const priceInLamports = new BN(price * 1000000000); // 1 SOL = 1,000,000,000 lamports

      // Find the dataset PDA
      const [datasetPDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from('dataset'), wallet.publicKey.toBuffer(), Buffer.from(ipfsHash)],
        programId
      );

      const tx = await program.methods
        .createDataset(ipfsHash, priceInLamports)
        .accounts({
          dataset: datasetPDA,
          user: userAccount,
          authority: wallet.publicKey,
          globalState,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error("Error creating dataset:", error);
      throw error;
    }
  };

  const buyDataset = async (datasetPubkey: PublicKey, sellerPubkey: PublicKey): Promise<string> => {
    if (!program || !wallet || !globalState || !userAccount) 
      throw new Error("Program not initialized or user not created");

    try {
      // Find the seller's user account
      const [sellerUserPDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from('user'), sellerPubkey.toBuffer()],
        programId
      );

      const tx = await program.methods
        .buyDataset()
        .accounts({
          dataset: datasetPubkey,
          buyer: userAccount,
          seller: sellerUserPDA,
          buyerAuthority: wallet.publicKey,
          sellerAuthority: sellerPubkey,
          globalState,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error("Error buying dataset:", error);
      throw error;
    }
  };

  const fileDispute = async (datasetPubkey: PublicKey, reason: string): Promise<string> => {
    if (!program || !wallet || !globalState || !userAccount) 
      throw new Error("Program not initialized or user not created");

    try {
      // Find the dispute PDA
      const [disputePDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from('dispute'), datasetPubkey.toBuffer(), wallet.publicKey.toBuffer()],
        programId
      );

      const tx = await program.methods
        .fileDispute(reason)
        .accounts({
          dispute: disputePDA,
          dataset: datasetPubkey,
          challenger: userAccount,
          authority: wallet.publicKey,
          globalState,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error("Error filing dispute:", error);
      throw error;
    }
  };

  const resolveDispute = async (
    disputePubkey: PublicKey, 
    datasetPubkey: PublicKey, 
    verdict: boolean
  ): Promise<string> => {
    if (!program || !wallet || !globalState || !isAdmin) 
      throw new Error("Program not initialized or not admin");

    try {
      const tx = await program.methods
        .resolveDispute(verdict)
        .accounts({
          dispute: disputePubkey,
          dataset: datasetPubkey,
          resolver: wallet.publicKey,
          globalState,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error("Error resolving dispute:", error);
      throw error;
    }
  };

  const fetchDatasets = async () => {
    if (!program) return [];
    
    try {
      // Fetch all datasets that are still active
      const datasets = await program.account.dataset.all([
        {
          memcmp: {
            offset: 24, // position of isActive in the account data
            bytes: Buffer.from([1]).toString('base64') // 1 for true
          }
        }
      ]);
      
      return datasets;
    } catch (error) {
      console.error("Error fetching datasets:", error);
      return [];
    }
  };

  const fetchUserDatasets = async () => {
    if (!program || !wallet) return [];
    
    try {
      // Fetch datasets owned by the current user
      const datasets = await program.account.dataset.all([
        {
          memcmp: {
            offset: 8, // position of owner in the account data
            bytes: wallet.publicKey.toBase58()
          }
        }
      ]);
      
      return datasets;
    } catch (error) {
      console.error("Error fetching user datasets:", error);
      return [];
    }
  };

  const fetchDataset = async (publicKey: PublicKey) => {
    if (!program) return null;
    
    try {
      const dataset = await program.account.dataset.fetch(publicKey);
      return dataset as unknown as Dataset;
    } catch (error) {
      console.error("Error fetching dataset:", error);
      return null;
    }
  };

  const fetchDisputes = async () => {
    if (!program) return [];
    
    try {
      // Fetch all disputes
      const disputes = await program.account.dispute.all();
      return disputes;
    } catch (error) {
      console.error("Error fetching disputes:", error);
      return [];
    }
  };

  return (
    <ProgramContext.Provider
      value={{
        program,
        provider,
        programId,
        userAccount,
        userAccountData,
        isAdmin,
        fetchUserAccount,
        createUser,
        createDataset,
        buyDataset,
        fileDispute,
        resolveDispute,
        fetchDatasets,
        fetchUserDatasets,
        fetchDataset,
        fetchDisputes,
      }}
    >
      {children}
    </ProgramContext.Provider>
  );
}; 