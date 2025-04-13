use anchor_lang::prelude::*;

#[account]
pub struct Dataset {
    /// Who listed this data
    pub owner: Pubkey,
    /// Price in lamports
    pub price: u64,
    /// IPFS CID pointing to encrypted data
    pub ipfs_hash: String,
    /// Active (true) or sold/cancelled (false)
    pub is_active: bool,
    /// Bump for the PDA
    pub bump: u8,
}

#[account]
pub struct Dispute {
    /// The dataset under dispute
    pub dataset: Pubkey,
    /// Who filed the dispute
    pub challenger: Pubkey,
    /// UTF‑8 reason text
    pub reason: String,
    /// When it was filed
    pub created_at: i64,
    /// 0 = Pending, 1 = Resolved
    pub status: u8,
    /// If resolved, the outcome: true = dispute valid (seller at fault)
    pub result: bool,
    /// Who resolved (admin)
    pub resolver: Pubkey,
    /// When it was resolved
    pub resolved_at: i64,
    /// PDA bump
    pub bump: u8,
}

#[account]
pub struct User {
    /// User wallet
    pub authority: Pubkey,
    /// User chosen name
    pub username: String,
    /// Reputation score
    pub reputation: i32,
    /// If user is banned
    pub is_banned: bool,
    /// For the PDA
    pub bump: u8,
}
