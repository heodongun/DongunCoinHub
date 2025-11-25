const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying OfficialDongunNFT...\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`📍 Deploying with account: ${deployer.address}`);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${hre.ethers.formatEther(balance)} ETH\n`);

  // Deploy the contract
  const OfficialDongunNFT = await hre.ethers.getContractFactory("OfficialDongunNFT");
  const nft = await OfficialDongunNFT.deploy(deployer.address);

  await nft.waitForDeployment();

  const contractAddress = await nft.getAddress();

  console.log(`✅ OfficialDongunNFT deployed to: ${contractAddress}`);
  console.log(`🌐 View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}\n`);

  // Get contract details
  const name = await nft.name();
  const symbol = await nft.symbol();
  const owner = await nft.owner();

  console.log("📋 Contract Details:");
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Owner: ${owner}\n`);

  console.log("💡 Next Steps:");
  console.log(`   1. Update backend/.env with:`);
  console.log(`      NFT_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`   2. Update frontend/.env.local with:`);
  console.log(`      NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`   3. Mint test NFTs: npm run batch-mint`);
  console.log(`   4. Verify on Etherscan (optional): npx hardhat verify --network sepolia ${contractAddress} "${deployer.address}"\n`);

  // Save deployment info to file
  const fs = require("fs");
  const deploymentInfo = {
    network: "sepolia",
    contractAddress: contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    name: name,
    symbol: symbol,
  };

  fs.writeFileSync(
    "deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("✅ Deployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
