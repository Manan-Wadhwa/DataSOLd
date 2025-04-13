use anchor_lang::prelude::*;

#[account]
pub struct User {
    pub owner: Pubkey,
    pub bump: u8,
    pub username: String,
    pub elo_score: i64,
    pub banned: bool,

}

#[derive(Accounts)]
#[instruction(username: String)]
pub struct CreateUser<'info> {
    #[account(
        init,
        payer = signer,
        seeds = [b"user".signer.key.as_ref()],
        bump,
        space = 8 + 1 + 32 + username.len() + 1 + 8 + 1,
    )]

    pub user_profile: Account<'info, User>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
pub fn create_user(ctx: Context<CreateUser>, username: String) {
    let profile = &mut ctx.accounts.user_profile;
    profile.owner = *ctx.accounts.signer.key;
    profile.bump = *ctx.bumps.get("user_profile").unwrap();
    profile.username = username;
    profile.elo_score = 1000;
    profile.banned = false;

    Ok(())
}

