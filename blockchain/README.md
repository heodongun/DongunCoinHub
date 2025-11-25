# DongunCoin Hub - Blockchain

Official DongunCoin NFT smart contract on Ethereum Sepolia testnet.

## 🎯 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the sample file and fill in your own keys (do not commit them):

```bash
cp .env.example .env
```

Required values:
```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=0xyour_deployer_private_key
NFT_CONTRACT_ADDRESS=      # fill after deploy
ETHERSCAN_API_KEY=         # optional
```

### 3. Deploy NFT Contract

```bash
npm run deploy
```

This will:
- Deploy `OfficialDongunNFT` contract to Sepolia
- Display the contract address
- Save deployment info to `deployment.json`

### 4. Update Backend & Frontend

After deployment, update the contract address in:

**Backend** (`backend/.env`):
```env
NFT_CONTRACT_ADDRESS=0x_YOUR_DEPLOYED_CONTRACT_ADDRESS_
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x_YOUR_DEPLOYED_CONTRACT_ADDRESS_
```

### 5. Mint Test NFTs

```bash
# Mint 10 test NFTs to vault
npm run batch-mint
```

## 📋 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Deploy | `npm run deploy` | Deploy NFT contract to Sepolia |
| Mint Single | `npm run mint` | Mint one NFT to vault |
| Batch Mint | `npm run batch-mint` | Mint 10 NFTs to vault |
| Check Contract | `npm run check` | Check contract status and NFTs |
| Test | `npm test` | Run contract tests |
| Compile | `npm run compile` | Compile smart contracts |
| Local Node | `npm run node` | Start local Hardhat node |

## 🔍 Check Contract Status

```bash
npm run check
```

This shows:
- Contract information (name, symbol, owner)
- Total NFT supply
- Pause status
- List of minted NFTs
- Vault wallet balance

## 📦 Contract Features

### OfficialDongunNFT (ERC-721)

- **Minting**: Only owner can mint NFTs
- **Batch Minting**: Efficient bulk minting (up to 100 NFTs)
- **NFT Withdrawal**: Transfer NFTs from vault to user wallets
- **Pausable**: Emergency stop functionality
- **Burnable**: NFTs can be burned if needed
- **Reentrancy Protection**: Safe against reentrancy attacks

### Key Functions

```solidity
// Mint single NFT
function mint(address to, string memory uri) returns (uint256)

// Batch mint NFTs
function batchMint(address[] recipients, string[] uris) returns (uint256[])

// Withdraw NFT from vault to user wallet
function withdrawNFT(uint256 tokenId, address userWallet)

// Get total supply
function totalSupply() returns (uint256)

// Pause/unpause contract
function pause()
function unpause()
```

## 🌐 Network Configuration

### Sepolia Testnet

- **Network Name**: Sepolia
- **Chain ID**: 11155111
- **RPC URL**: Configured in `.env`
- **Block Explorer**: https://sepolia.etherscan.io

### Get Sepolia ETH

You need Sepolia ETH to deploy and interact with contracts:

- https://sepoliafaucet.com
- https://www.alchemy.com/faucets/ethereum-sepolia

## 🔐 Security

- **Private Key**: Stored in `.env` (never commit this file!)
- **Owner Only**: Minting and withdrawal restricted to contract owner
- **Pausable**: Contract can be paused in emergencies
- **Reentrancy Guard**: Protection against reentrancy attacks

## 📚 Documentation

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [ERC-721 Standard](https://eips.ethereum.org/EIPS/eip-721)

## 🆘 Troubleshooting

### Error: Insufficient funds

You need Sepolia ETH. Get it from a faucet.

### Error: Invalid address

Check that contract address in `.env` is correct.

### Error: Contract not found

Make sure you deployed the contract first with `npm run deploy`.

## 📄 License

MIT
