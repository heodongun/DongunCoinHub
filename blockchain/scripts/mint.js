const hre = require("hardhat");

async function main() {
  console.log("🎨 Minting NFT...\n");

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

  // NFT metadata URI (you can customize this)
  const metadataURI = "https://api.donguncoin.com/nft/metadata/1";

  console.log("🔨 Minting NFT...");
  const tx = await nft.mint(deployer.address, metadataURI);
  console.log(`📝 Transaction hash: ${tx.hash}`);

  const receipt = await tx.wait();
  console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

  // Get the token ID from the event
  const event = receipt.logs.find(log => {
    try {
      const parsed = nft.interface.parseLog(log);
      return parsed && parsed.name === "NFTMinted";
    } catch (e) {
      return false;
    }
  });

  if (event) {
    const parsed = nft.interface.parseLog(event);
    const tokenId = parsed.args.tokenId;
    console.log(`🎉 NFT minted with Token ID: ${tokenId}`);
    console.log(`🌐 View on Etherscan: https://sepolia.etherscan.io/token/${contractAddress}?a=${tokenId}\n`);
  }

  // Get total supply
  const totalSupply = await nft.totalSupply();
  console.log(`📊 Total NFTs minted: ${totalSupply}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
