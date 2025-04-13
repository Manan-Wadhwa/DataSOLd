use anchor_lang::prelude::*;
use crate::state::review::Review;
use crate::state::dataset::Dataset;
use crate::state::user::User;

#[derive(Accounts)]
pub struct CreateReview<'info> {
    #[account(init, payer = authority, space = 8 + Review::INIT_SPACE)]
    pub review: Account<'info, Review>,
    
    #[account(mut)]
    pub dataset: Account<'info, Dataset>,
    
    #[account(mut, has_one = owner @ crate::errors::ErrorCode::Unauthorized)]
    pub reviewer: Account<'info, User>,
    
    #[account(mut, constraint = dataset_owner.key() == dataset.owner @ crate::errors::ErrorCode::Unauthorized)]
    pub dataset_owner: Account<'info, User>,
    
    #[account(mut, constraint = authority.key() == reviewer.owner @ crate::errors::ErrorCode::Unauthorized)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateReview<'info> {
    #[account(mut, has_one = reviewer @ crate::errors::ErrorCode::Unauthorized)]
    pub review: Account<'info, Review>,
    
    #[account(mut)]
    pub dataset: Account<'info, Dataset>,
    
    #[account(mut)]
    pub reviewer: Account<'info, User>,
    
    #[account(mut, constraint = authority.key() == reviewer.owner @ crate::errors::ErrorCode::Unauthorized)]
    pub authority: Signer<'info>,
} 