# 🚀 NFT 컨트랙트 배포 가이드

블록체인 디렉토리 설정이 완료되었습니다! 이제 NFT 컨트랙트를 배포할 수 있습니다.

## ✅ 완료된 작업

1. ✅ Hardhat 프로젝트 구조 생성
2. ✅ OfficialDongunNFT.sol 스마트 컨트랙트 생성
3. ✅ 배포 스크립트 (deploy.js) 생성
4. ✅ 민팅 스크립트 (mint.js, batchMint.js) 생성
5. ✅ 환경 변수 파일 (.env) 설정 완료
6. ✅ 컨트랙트 확인 스크립트 (checkContract.js) 준비

## 📋 다음 단계

### 1단계: 의존성 설치

```bash
cd blockchain
npm install
```

이 명령어는 다음을 설치합니다:
- Hardhat 2.19.0
- OpenZeppelin Contracts 5.0.0
- Ethers.js 6.4.0
- 기타 필요한 플러그인

### 2단계: NFT 컨트랙트 배포

```bash
npm run deploy
```

또는:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

**출력 예시:**
```
🚀 Deploying OfficialDongunNFT...

📍 Deploying with account: 0x9C06f18ea52d88EaC5F1563b03495aBa75e9Fe31
💰 Account balance: 0.5 ETH

✅ OfficialDongunNFT deployed to: 0x1234567890abcdef1234567890abcdef12345678
🌐 View on Etherscan: https://sepolia.etherscan.io/address/0x1234567890abcdef1234567890abcdef12345678

📋 Contract Details:
   Name: Official DongunCoin NFT
   Symbol: DGCNFT
   Owner: 0x9C06f18ea52d88EaC5F1563b03495aBa75e9Fe31
```

### 3단계: 컨트랙트 주소 복사

배포 후 출력된 컨트랙트 주소를 복사하세요:
```
0x1234567890abcdef1234567890abcdef12345678
```

### 4단계: 환경 변수 업데이트

#### Backend (.env)

`backend/.env` 파일에 추가:
```env
NFT_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
```

#### Frontend (.env.local)

`frontend/.env.local` 파일에 추가:
```env
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
```

### 5단계: 테스트 NFT 발행 (선택사항)

```bash
# 10개의 테스트 NFT를 Vault 지갑에 발행
npm run batch-mint
```

또는 단일 NFT 발행:
```bash
npm run mint
```

### 6단계: 컨트랙트 상태 확인

```bash
npm run check
```

**출력 예시:**
```
🔍 NFT 컨트랙트 상태 확인 중...

📍 컨트랙트 주소: 0x1234...
🌐 Etherscan: https://sepolia.etherscan.io/address/0x1234...

📋 컨트랙트 정보:
  이름: Official DongunCoin NFT
  심볼: DGCNFT
  Owner: 0x9C06f18ea52d88EaC5F1563b03495aBa75e9Fe31
  총 발행량: 10 NFT

⏸️  일시정지: 아니오

📦 발행된 NFT 목록:
  Token ID 1:
    소유자: 0x9C06f18ea52d88EaC5F1563b03495aBa75e9Fe31
    메타데이터: https://api.donguncoin.com/nft/metadata/1
  ...
```

## 📁 프로젝트 구조

```
blockchain/
├── contracts/
│   └── OfficialDongunNFT.sol      # ERC-721 NFT 스마트 컨트랙트
├── scripts/
│   ├── deploy.js                  # 배포 스크립트
│   ├── mint.js                    # 단일 NFT 발행
│   ├── batchMint.js              # 배치 NFT 발행
│   └── checkContract.js          # 컨트랙트 상태 확인
├── test/                          # 테스트 디렉토리
├── hardhat.config.js             # Hardhat 설정
├── package.json                  # npm 패키지 설정
├── .env                          # 환경 변수 (이미 설정됨)
└── README.md                     # 상세 문서
```

## 🔑 환경 변수 (.env)

샘플을 복사한 뒤 개인 키를 채워주세요:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=0xyour_deployer_private_key
NFT_CONTRACT_ADDRESS=  # 배포 후 입력
ETHERSCAN_API_KEY=     # 선택
```

## 💰 Sepolia ETH 받기

컨트랙트를 배포하려면 Sepolia 테스트넷 ETH가 필요합니다:

- https://sepoliafaucet.com
- https://www.alchemy.com/faucets/ethereum-sepolia

지갑 주소: `0x9C06f18ea52d88EaC5F1563b03495aBa75e9Fe31` (Private Key로부터)

## 🎯 스마트 컨트랙트 주요 기능

### OfficialDongunNFT (ERC-721)

- ✅ **소유자 전용 발행**: 컨트랙트 소유자만 NFT 발행 가능
- ✅ **배치 발행**: 최대 100개까지 한 번에 발행
- ✅ **NFT 출금**: Vault에서 사용자 지갑으로 전송
- ✅ **일시정지**: 긴급 상황 시 컨트랙트 중지 가능
- ✅ **소각 가능**: NFT 소각 기능
- ✅ **재진입 공격 방지**: ReentrancyGuard 적용

### 주요 함수

```solidity
// 단일 NFT 발행
function mint(address to, string memory uri) returns (uint256)

// 배치 NFT 발행 (최대 100개)
function batchMint(address[] recipients, string[] uris) returns (uint256[])

// NFT 출금 (Vault → 사용자 지갑)
function withdrawNFT(uint256 tokenId, address userWallet)

// 총 발행량 조회
function totalSupply() returns (uint256)

// 컨트랙트 일시정지/재개
function pause()
function unpause()
```

## 🛠️ 사용 가능한 명령어

| 명령어 | 설명 |
|--------|------|
| `npm install` | 의존성 설치 |
| `npm run deploy` | Sepolia에 컨트랙트 배포 |
| `npm run mint` | 단일 NFT 발행 |
| `npm run batch-mint` | 10개 NFT 배치 발행 |
| `npm run check` | 컨트랙트 상태 확인 |
| `npm test` | 테스트 실행 |
| `npm run compile` | 컨트랙트 컴파일 |
| `npm run node` | 로컬 Hardhat 노드 실행 |

## ⚠️ 중요 사항

1. **Private Key 보안**: `.env` 파일을 절대 Git에 커밋하지 마세요!
2. **Sepolia ETH**: 배포 전에 충분한 Sepolia ETH가 있는지 확인하세요
3. **Contract Address**: 배포 후 반드시 backend와 frontend 환경 변수를 업데이트하세요

## 🆘 문제 해결

### "Insufficient funds" 오류

→ Sepolia ETH가 필요합니다. Faucet에서 받으세요.

### "Module not found" 오류

→ `npm install`을 실행했는지 확인하세요.

### "Invalid private key" 오류

→ `.env` 파일의 PRIVATE_KEY 형식을 확인하세요 (0x 없이).

## 📚 더 많은 정보

- [README.md](./README.md) - 상세 문서
- [Hardhat 문서](https://hardhat.org/docs)
- [OpenZeppelin 문서](https://docs.openzeppelin.com/contracts)

---

## ✅ 체크리스트

- [ ] `npm install` 실행
- [ ] Sepolia ETH 받기 (0.1 ETH 정도면 충분)
- [ ] `npm run deploy` 실행
- [ ] 컨트랙트 주소 복사
- [ ] `backend/.env`에 NFT_CONTRACT_ADDRESS 추가
- [ ] `frontend/.env.local`에 NEXT_PUBLIC_NFT_CONTRACT_ADDRESS 추가
- [ ] `npm run batch-mint`로 테스트 NFT 발행
- [ ] `npm run check`로 상태 확인

## 🎉 완료!

모든 단계를 완료했다면 DongunCoinHub 시스템을 실행할 준비가 되었습니다!

다음 단계:
1. 프로젝트 루트로 이동: `cd ..`
2. 전체 시스템 실행: `./scripts/run.sh` 또는 `docker-compose up -d`
3. 브라우저에서 접속: http://localhost:3000
