const hre = require("hardhat");

async function main() {
  console.log("🎨 Batch Minting NFTs...\n");

  // Get contract address from environment variable
  const contractAddress = process.env.NFT_CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.log("❌ NFT_CONTRACT_ADDRESS not set in .env file");
    console.log("💡 Please add NFT_CONTRACT_ADDRESS=0x... to your .env file\n");
    process.exit(1);
  }

  console.log(`📍 Contract Address: ${contractAddress}`);

  // Get the contract
  const OfficialDongunNFT = await hre.ethers.getContractFactory("OfficialDongunNFT");
  const nft = await OfficialDongunNFT.attach(contractAddress);

  // Get deployer (vault wallet)
  const [deployer] = await hre.ethers.getSigners();
  console.log(`👤 Minting to vault: ${deployer.address}\n`);

  // Prepare batch mint data (10 NFTs for testing)
  const batchSize = 10;
  const recipients = new Array(batchSize).fill(deployer.address);
  const uris = Array.from({ length: batchSize }, (_, i) =>
    `https://api.donguncoin.com/nft/metadata/${i + 1}`
  );

  console.log(`🔨 Batch minting ${batchSize} NFTs...`);
  const tx = await nft.batchMint(recipients, uris);
  console.log(`📝 Transaction hash: ${tx.hash}`);

  const receipt = await tx.wait();
  console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

  // Get the token IDs from the event
  const event = receipt.logs.find(log => {
    try {
      const parsed = nft.interface.parseLog(log);
      return parsed && parsed.name === "BatchMinted";
    } catch (e) {
      return false;
    }
  });

  if (event) {
    const parsed = nft.interface.parseLog(event);
    const tokenIds = parsed.args.tokenIds;
    console.log(`\n🎉 Successfully minted ${tokenIds.length} NFTs!`);
    console.log(`📊 Token IDs: ${tokenIds.map(id => id.toString()).join(", ")}`);
    console.log(`🌐 View collection on Etherscan: https://sepolia.etherscan.io/token/${contractAddress}\n`);
  }

  // Get total supply
  const totalSupply = await nft.totalSupply();
  console.log(`📊 Total NFTs minted: ${totalSupply}`);

  // Get vault balance
  const vaultBalance = await nft.balanceOf(deployer.address);
  console.log(`💼 Vault wallet NFT balance: ${vaultBalance}\n`);

  console.log("✅ Batch minting complete!");
  console.log("💡 These NFTs are now in the vault and can be purchased through the platform");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
