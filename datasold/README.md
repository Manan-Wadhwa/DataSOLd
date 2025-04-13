# DataSOLd

A decentralized marketplace for data assets built on Solana blockchain.

## Overview

DataSOLd enables users to list, discover, and securely trade data assets using the Solana blockchain. It provides a transparent, secure, and decentralized platform for data transactions with built-in reputation and dispute resolution mechanisms.

## Features

- **Data Asset Listings**: Users can list their data assets with detailed descriptions and pricing
- **Secure Transactions**: Direct peer-to-peer transactions using Solana
- **Dispute Resolution**: Built-in dispute resolution mechanism for transaction issues
- **Reputation System**: User reputation tracking based on successful transactions and dispute outcomes
- **Admin Controls**: Admin capabilities for platform management and dispute resolution

## Getting Started

### Prerequisites

- Rust (version 1.68.0 recommended)
- Solana CLI tools 
- Node.js and Yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/datasold.git
   cd datasold
   ```

2. Install JavaScript dependencies:
   ```bash
   yarn install
   ```

3. Build the Solana program:
   ```bash
   anchor build
   ```

4. Deploy to a local test validator:
   ```bash
   anchor deploy
   ```

### Running Tests

```bash
anchor test
```

## Project Structure

- `/programs/datasold/src`: Solana program source code
  - `lib.rs`: Main program entry point
  - `context/`: Account context definitions for instructions
  - `state.rs`: State account definitions
  - `error.rs`: Custom error definitions
  - `constants.rs`: Program constants
  - `utils/`: Utility functions

- `/app`: Frontend application (React.js)
- `/tests`: Integration tests for the Solana program

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 