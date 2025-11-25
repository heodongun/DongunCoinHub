const hre = require("hardhat");

async function main() {
  console.log("🔍 NFT 컨트랙트 상태 확인 중...\n");

  // 환경 변수에서 컨트랙트 주소 가져오기
  const contractAddress = process.env.NFT_CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.log("❌ NFT_CONTRACT_ADDRESS 환경 변수가 설정되지 않았습니다.");
    console.log("💡 .env 파일에서 NFT_CONTRACT_ADDRESS를 설정하세요.");
    return;
  }

  console.log(`📍 컨트랙트 주소: ${contractAddress}`);
  console.log(`🌐 Etherscan: https://sepolia.etherscan.io/address/${contractAddress}\n`);

  try {
    // 컨트랙트 가져오기
    const OfficialDongunNFT = await hre.ethers.getContractFactory("OfficialDongunNFT");
    const nft = await OfficialDongunNFT.attach(contractAddress);

    // 기본 정보 조회
    console.log("📋 컨트랙트 정보:");
    const name = await nft.name();
    const symbol = await nft.symbol();
    console.log(`  이름: ${name}`);
    console.log(`  심볼: ${symbol}`);

    // Owner 정보
    const owner = await nft.owner();
    console.log(`  Owner: ${owner}`);

    // 총 발행량
    const totalSupply = await nft.totalSupply();
    console.log(`  총 발행량: ${totalSupply.toString()} NFT\n`);

    // 일시정지 상태
    const paused = await nft.paused();
    console.log(`⏸️  일시정지: ${paused ? "예" : "아니오"}`);

    // 발행된 NFT 목록 조회
    if (totalSupply > 0) {
      console.log(`\n📦 발행된 NFT 목록 (최대 10개):`);
      const maxShow = Math.min(Number(totalSupply), 10);

      for (let i = 1; i <= maxShow; i++) {
        try {
          const tokenOwner = await nft.ownerOf(i);
          const tokenURI = await nft.tokenURI(i);

          console.log(`\n  Token ID ${i}:`);
          console.log(`    소유자: ${tokenOwner}`);
          console.log(`    메타데이터: ${tokenURI}`);
        } catch (error) {
          console.log(`\n  Token ID ${i}: 존재하지 않음`);
        }
      }

      if (totalSupply > 10) {
        console.log(`\n  ... 외 ${Number(totalSupply) - 10}개`);
      }
    } else {
      console.log("\n⚠️  아직 발행된 NFT가 없습니다.");
      console.log("💡 scripts/mint.js 또는 scripts/batchMint.js를 실행하여 NFT를 발행하세요.");
    }

    // Vault 지갑 잔액
    console.log(`\n💰 Vault 지갑 (Owner) 보유 NFT:`);
    const ownerBalance = await nft.balanceOf(owner);
    console.log(`  ${ownerBalance.toString()}개\n`);

    // 로열티 정보
    try {
      const [receiver, royaltyAmount] = await nft.royaltyInfo(1, hre.ethers.parseEther("1"));
      const royaltyPercent = (Number(royaltyAmount) / Number(hre.ethers.parseEther("1"))) * 100;

      console.log(`👑 로열티 정보:`);
      console.log(`  수령 주소: ${receiver}`);
      console.log(`  로열티율: ${royaltyPercent}%\n`);
    } catch (error) {
      console.log(`👑 로열티 정보: 설정되지 않음\n`);
    }

    console.log("✅ 컨트랙트 상태 확인 완료!");

  } catch (error) {
    console.error("❌ 오류 발생:", error.message);

    if (error.message.includes("invalid address")) {
      console.log("\n💡 NFT_CONTRACT_ADDRESS가 올바른 주소 형식인지 확인하세요.");
    } else if (error.message.includes("call revert")) {
      console.log("\n💡 컨트랙트가 해당 주소에 배포되어 있는지 확인하세요.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
