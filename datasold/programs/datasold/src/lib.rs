// lib.rs
use anchor_lang::prelude::*;

pub mod context;
pub mod state;
pub mod utils;
pub mod error;

use context::{
    init::*,
    user::*,
    dataset::*,
    buy::*,
    auction::*,
    honor::*,
    dispute::*,
};


// Define the program ID
declare_id!("7f2vK2P7uWAQY6QS7P8jPhQvbrs6F1BSc4zdejQrcSRn");

#[program]
mod datasold {
    use super::*;

    // =========================== Init ===========================
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        init_program(ctx)
    }

    // =========================== User ===========================
    pub fn register_user(ctx: Context<RegisterUser>) -> Result<()> {
        register_user_handler(ctx)
    }

    // =========================== Dataset ===========================
    pub fn create_dataset(ctx: Context<CreateDataset>, cid: String, price: u64) -> Result<()> {
        create_dataset_handler(ctx, cid, price)
    }

    // =========================== Buy ===========================
    pub fn buy_dataset(ctx: Context<BuyDataset>) -> Result<()> {
        buy_dataset_handler(ctx)
    }

    pub fn claim_payment(ctx: Context<ClaimPayment>) -> Result<()> {
        claim_payment_handler(ctx)
    }

    // =========================== Auction ===========================
    pub fn start_auction(ctx: Context<StartAuction>, min_bid: u64, deadline: i64) -> Result<()> {
        start_auction_handler(ctx, min_bid, deadline)
    }

    pub fn place_bid(ctx: Context<PlaceBid>, bid: u64) -> Result<()> {
        place_bid_handler(ctx, bid)
    }

    pub fn end_auction(ctx: Context<EndAuction>) -> Result<()> {
        end_auction_handler(ctx)
    }

    // =========================== Honor ===========================
    pub fn update_honor(ctx: Context<UpdateHonor>, delta: i8) -> Result<()> {
        update_honor_handler(ctx, delta)
    }

    // =========================== Dispute ===========================
    pub fn open_dispute(ctx: Context<OpenDispute>, reason: String) -> Result<()> {
        open_dispute_handler(ctx, reason)
    }

    pub fn resolve_dispute(ctx: Context<ResolveDispute>, verdict: bool) -> Result<()> {
        resolve_dispute_handler(ctx, verdict)
    }

    pub fn ban_user(ctx: Context<BanUser>) -> Result<()> {
        ban_user_handler(ctx)
    }
}
