import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export interface User {
  username: string;
  authority: PublicKey;
  reputation: number;
  isBanned: boolean;
  bump: number;
}

export interface Dataset {
  owner: PublicKey;
  price: BN;
  ipfsHash: string;
  isActive: boolean;
  bump: number;
}

export interface Dispute {
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