import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Datasold } from "../target/types/datasold";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("datasold", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Datasold as Program<Datasold>;
  const wallet = provider.wallet as anchor.Wallet;

  // Create test keypairs
  const user1 = Keypair.generate();
  const user2 = Keypair.generate();
  const adminWallet = wallet.payer;
  let globalState: PublicKey;
  let user1Account: PublicKey;
  let user2Account: PublicKey;
  let datasetPDA: PublicKey;
  let disputePDA: PublicKey;

  it("Airdrop SOL to test accounts", async () => {
    // Airdrop SOL to test users
    const signature1 = await provider.connection.requestAirdrop(
      user1.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature1);

    const signature2 = await provider.connection.requestAirdrop(
      user2.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature2);

    // Verify balances
    const balance1 = await provider.connection.getBalance(user1.publicKey);
    const balance2 = await provider.connection.getBalance(user2.publicKey);
    
    assert(balance1 >= 2 * LAMPORTS_PER_SOL, "User1 airdrop failed");
    assert(balance2 >= 2 * LAMPORTS_PER_SOL, "User2 airdrop failed");
  });

  it("Initializes the program", async () => {
    // Find the program's global state PDA
    const [statePDA, _] = await PublicKey.findProgramAddressSync(
      [Buffer.from("global_state")],
      program.programId
    );
    globalState = statePDA;

    // Call initialize instruction
    const tx = await program.methods
      .initialize()
      .accounts({
        globalState,
        authority: adminWallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    console.log("Initialize transaction signature:", tx);
    
    // Verify the state was created
    const stateAccount = await program.account.globalState.fetch(globalState);
    assert.isNotNull(stateAccount, "Global state not created");
    assert.equal(stateAccount.authority.toString(), adminWallet.publicKey.toString(), "Authority mismatch");
  });

  it("Creates a new user", async () => {
    // Find user PDA
    const [userPDA, _] = await PublicKey.findProgramAddressSync(
      [Buffer.from("user"), user1.publicKey.toBuffer()],
      program.programId
    );
    user1Account = userPDA;

    // Create user
    const username = "testuser1";
    const tx = await program.methods
      .createUser(username)
      .accounts({
        user: user1Account,
        authority: user1.publicKey,
        globalState,
        systemProgram: SystemProgram.programId,
      })
      .signers([user1])
      .rpc();
    
    console.log("Create user transaction signature:", tx);
    
    // Verify user account
    const userAccount = await program.account.user.fetch(user1Account);
    assert.equal(userAccount.username, username, "Username mismatch");
    assert.equal(userAccount.authority.toString(), user1.publicKey.toString(), "Authority mismatch");
    assert.equal(userAccount.reputation, 0, "Initial reputation should be 0");
    assert.isFalse(userAccount.isBanned, "New user should not be banned");
  });

  it("Creates a second user", async () => {
    const [userPDA, _] = await PublicKey.findProgramAddressSync(
      [Buffer.from("user"), user2.publicKey.toBuffer()],
      program.programId
    );
    user2Account = userPDA;

    const username = "testuser2";
    const tx = await program.methods
      .createUser(username)
      .accounts({
        user: user2Account,
        authority: user2.publicKey,
        globalState,
        systemProgram: SystemProgram.programId,
      })
      .signers([user2])
      .rpc();
    
    const userAccount = await program.account.user.fetch(user2Account);
    assert.equal(userAccount.username, username, "Username mismatch");
  });

  it("Creates a dataset listing", async () => {
    const ipfsHash = "QmT8rPDu2GFHRXbzT6iiwv3AdExFWgECyQr9Y1TTp2ARJx";
    const price = 0.5 * LAMPORTS_PER_SOL; // 0.5 SOL

    // Find dataset PDA
    const [datasetPubkey, _] = await PublicKey.findProgramAddressSync(
      [Buffer.from("dataset"), user1.publicKey.toBuffer(), Buffer.from(ipfsHash)],
      program.programId
    );
    datasetPDA = datasetPubkey;

    const tx = await program.methods
      .createDataset(ipfsHash, new anchor.BN(price))
      .accounts({
        dataset: datasetPDA,
        user: user1Account,
        authority: user1.publicKey,
        globalState,
        systemProgram: SystemProgram.programId,
      })
      .signers([user1])
      .rpc();
    
    console.log("Create dataset transaction signature:", tx);
    
    // Verify dataset
    const datasetAccount = await program.account.dataset.fetch(datasetPDA);
    assert.equal(datasetAccount.owner.toString(), user1.publicKey.toString(), "Owner mismatch");
    assert.equal(datasetAccount.price.toNumber(), price, "Price mismatch");
    assert.equal(datasetAccount.ipfsHash, ipfsHash, "IPFS hash mismatch");
    assert.isTrue(datasetAccount.isActive, "Dataset should be active");
  });

  it("Buys a dataset", async () => {
    const initialSellerBalance = await provider.connection.getBalance(user1.publicKey);
    const datasetAccount = await program.account.dataset.fetch(datasetPDA);
    
    const tx = await program.methods
      .buyDataset()
      .accounts({
        dataset: datasetPDA,
        buyer: user2Account,
        seller: user1Account,
        buyerAuthority: user2.publicKey,
        sellerAuthority: user1.publicKey,
        globalState,
        systemProgram: SystemProgram.programId,
      })
      .signers([user2])
      .rpc();
    
    console.log("Buy dataset transaction signature:", tx);
    
    // Verify dataset is no longer active
    const updatedDatasetAccount = await program.account.dataset.fetch(datasetPDA);
    assert.isFalse(updatedDatasetAccount.isActive, "Dataset should be inactive after sale");
    
    // Verify seller received payment
    const newSellerBalance = await provider.connection.getBalance(user1.publicKey);
    assert(newSellerBalance > initialSellerBalance, "Seller didn't receive payment");
  });

  it("Files a dispute", async () => {
    const reason = "Data is incomplete";
    
    // Find dispute PDA
    const [disputePubkey, _] = await PublicKey.findProgramAddressSync(
      [Buffer.from("dispute"), datasetPDA.toBuffer(), user2.publicKey.toBuffer()],
      program.programId
    );
    disputePDA = disputePubkey;
    
    const tx = await program.methods
      .fileDispute(reason)
      .accounts({
        dispute: disputePDA,
        dataset: datasetPDA,
        challenger: user2Account,
        authority: user2.publicKey,
        globalState,
        systemProgram: SystemProgram.programId,
      })
      .signers([user2])
      .rpc();
    
    console.log("File dispute transaction signature:", tx);
    
    // Verify dispute was created
    const disputeAccount = await program.account.dispute.fetch(disputePDA);
    assert.equal(disputeAccount.dataset.toString(), datasetPDA.toString(), "Dataset mismatch");
    assert.equal(disputeAccount.challenger.toString(), user2.publicKey.toString(), "Challenger mismatch");
    assert.equal(disputeAccount.reason, reason, "Reason mismatch");
    assert.equal(disputeAccount.status, 0, "Status should be pending (0)");
  });

  it("Resolves a dispute", async () => {
    const verdict = true; // In favor of the challenger
    
    const tx = await program.methods
      .resolveDispute(verdict)
      .accounts({
        dispute: disputePDA,
        dataset: datasetPDA,
        resolver: adminWallet.publicKey,
        globalState,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    console.log("Resolve dispute transaction signature:", tx);
    
    // Verify dispute was resolved
    const disputeAccount = await program.account.dispute.fetch(disputePDA);
    assert.equal(disputeAccount.status, 1, "Status should be resolved (1)");
    assert.equal(disputeAccount.result, verdict, "Result mismatch");
    assert.equal(disputeAccount.resolver.toString(), adminWallet.publicKey.toString(), "Resolver mismatch");
  });

  it("Adjusts user reputation", async () => {
    const delta = 5; // Positive reputation change
    const initialRep = (await program.account.user.fetch(user1Account)).reputation;
    
    const tx = await program.methods
      .adjustReputation(delta)
      .accounts({
        user: user1Account,
        authority: adminWallet.publicKey,
        globalState,
      })
      .rpc();
    
    console.log("Adjust reputation transaction signature:", tx);
    
    // Verify reputation changed
    const userAccount = await program.account.user.fetch(user1Account);
    assert.equal(userAccount.reputation, initialRep + delta, "Reputation adjustment failed");
  });

  it("Bans a user", async () => {
    const tx = await program.methods
      .banUser()
      .accounts({
        user: user1Account,
        authority: adminWallet.publicKey,
        globalState,
      })
      .rpc();
    
    console.log("Ban user transaction signature:", tx);
    
    // Verify user was banned
    const userAccount = await program.account.user.fetch(user1Account);
    assert.isTrue(userAccount.isBanned, "User should be banned");
  });

  it("Unbans a user", async () => {
    const tx = await program.methods
      .unbanUser()
      .accounts({
        user: user1Account,
        authority: adminWallet.publicKey,
        globalState,
      })
      .rpc();
    
    console.log("Unban user transaction signature:", tx);
    
    // Verify user was unbanned
    const userAccount = await program.account.user.fetch(user1Account);
    assert.isFalse(userAccount.isBanned, "User should be unbanned");
  });

  it("Is initialized!", async () => {
    // Add your test here.
    console.log("Your program is initialized!");
  });
});
