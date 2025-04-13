use anchor_lang::{prelude::*, solana_program::clock::Clock};

pub mod constants;
pub mod error;
pub mod state;
pub mod context;
pub mod utils;

use context::{
    init::{Initialize, initialize_handler},
    user::{CreateUser, BanUser, UnbanUser, create_user_handler, ban_user_handler, unban_user_handler},
    dataset::{CreateDataset, create_dataset_handler},
    buy::{BuyDataset, buy_dataset_handler},
    dispute::{FileDispute, ResolveDispute, file_dispute_handler, resolve_dispute_handler},
    honor::{AdjustReputation, adjust_reputation_handler},
};

declare_id!("7f2vK2P7uWAQY6QS7P8jPhQvbrs6F1BSc4zdejQrcSRn");

#[program]
pub mod datasold {
    use super::*;

    // ─── Initialization ────────────────────────────────────────────
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize_handler(ctx)
    }

    // ─── User Management ───────────────────────────────────────────
    pub fn create_user(ctx: Context<CreateUser>, username: String) -> Result<()> {
        create_user_handler(ctx, username)
    }
    pub fn ban_user(ctx: Context<BanUser>) -> Result<()> {
        ban_user_handler(ctx)
    }
    pub fn unban_user(ctx: Context<UnbanUser>) -> Result<()> {
        unban_user_handler(ctx)
    }

    // ─── Dataset Listings ──────────────────────────────────────────
    pub fn create_dataset(
        ctx: Context<CreateDataset>,
        ipfs_hash: String,
        price: u64,
    ) -> Result<()> {
        create_dataset_handler(ctx, ipfs_hash, price)
    }

    // ─── Direct Purchases ──────────────────────────────────────────
    pub fn buy_dataset(ctx: Context<BuyDataset>) -> Result<()> {
        buy_dataset_handler(ctx)
    }

    // ─── Dispute Resolution ────────────────────────────────────────
    pub fn file_dispute(ctx: Context<FileDispute>, reason: String) -> Result<()> {
        file_dispute_handler(ctx, reason)
    }
    pub fn resolve_dispute(ctx: Context<ResolveDispute>, verdict: bool) -> Result<()> {
        resolve_dispute_handler(ctx, verdict)
    }

    // ─── Reputation / Honor ────────────────────────────────────────
    pub fn adjust_reputation(ctx: Context<AdjustReputation>, delta: i32) -> Result<()> {
        adjust_reputation_handler(ctx, delta)
    }
}
