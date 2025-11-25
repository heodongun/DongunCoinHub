# 🚀 DongunCoinHub 빠른 시작 가이드

이 가이드는 **처음부터 끝까지** DongunCoinHub를 실행하는 방법을 단계별로 설명합니다.

---

## 📋 목차

1. [사전 준비](#1-사전-준비)
2. [블록체인 설정 (NFT 컨트랙트 배포)](#2-블록체인-설정-nft-컨트랙트-배포)
3. [백엔드 설정](#3-백엔드-설정)
4. [프론트엔드 설정](#4-프론트엔드-설정)
5. [전체 시스템 실행](#5-전체-시스템-실행)
6. [테스트 및 확인](#6-테스트-및-확인)
7. [문제 해결](#7-문제-해결)

---

## 1. 사전 준비

### 필수 소프트웨어

```bash
# Node.js 18+ 설치 확인
node --version  # v18.0.0 이상

# Docker 설치 확인
docker --version
docker-compose --version

# Java 17+ 설치 확인 (Backend용)
java -version  # 17 이상
```

### Sepolia 테스트넷 준비

#### 1.1 MetaMask에 Sepolia 추가

1. MetaMask 설치 (https://metamask.io)
2. 네트워크 추가:
   - 네트워크 이름: `Sepolia Testnet`
   - RPC URL: `https://sepolia.infura.io/v3/YOUR_KEY`
   - Chain ID: `11155111`
   - Currency Symbol: `ETH`

#### 1.2 테스트 ETH 받기

Sepolia ETH가 필요합니다 (가스비 지불용):

```
Sepolia Faucet 목록:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia
```

1. 위 사이트 중 하나 접속
2. 지갑 주소 입력
3. 0.5 ETH 받기 (NFT 배포 및 민팅용)

---

## 2. 블록체인 설정 (NFT 컨트랙트 배포)

### 2.1 환경 변수 설정

`blockchain/.env` 파일이 이미 있으므로 확인:

```bash
cd blockchain
cat .env
```

내용:
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/c78b7199563549a5b61637084bf8d0f1
PRIVATE_KEY=0x79d055b74a1eaf82e26ac127bc26fab9ecd2560e1d38cec304f95306136a04c0
```

✅ **이미 설정되어 있습니다!**

### 2.2 의존성 설치

```bash
cd blockchain
npm install
```

### 2.3 NFT 컨트랙트 배포

```bash
# Sepolia 테스트넷에 배포
npx hardhat run scripts/deploy.js --network sepolia
```

**출력 예시:**
```
Deploying OfficialDongunNFT...
OfficialDongunNFT deployed to: 0x1234567890abcdef1234567890abcdef12345678
Deployment complete!
```

**🔥 중요: 이 주소를 복사해두세요!** (나중에 Backend/Frontend 설정에 사용)

### 2.4 Etherscan에서 컨트랙트 확인

```bash
# 배포 확인
# https://sepolia.etherscan.io/address/0x1234567890abcdef1234567890abcdef12345678
```

### 2.5 (선택) Etherscan 검증

```bash
# Etherscan API 키 필요 (https://etherscan.io/myapikey)
npx hardhat verify --network sepolia 0x1234...컨트랙트주소 "Dongun Official NFT" "DNFT"
```

### 2.6 NFT 민팅 (테스트용)

```bash
# 단일 NFT 민팅
npx hardhat run scripts/mint.js --network sepolia

# 또는 배치 민팅 (10개)
npx hardhat run scripts/batchMint.js --network sepolia
```

**출력 예시:**
```
Minting NFT to vault: 0xYourVaultAddress
NFT minted! Token ID: 1
Metadata: ipfs://QmExample...
Transaction: 0xabcd...
```

---

## 3. 백엔드 설정

### 3.1 환경 변수 설정

```bash
cd ../backend
cp .env.example .env
```

`backend/.env` 파일 편집:

```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=donguncoin_hub
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Secret (프로덕션에서는 변경 필수!)
JWT_SECRET=super-secret-jwt-key-change-this-in-production-please-use-64-chars
JWT_ACCESS_EXPIRATION=900000
JWT_REFRESH_EXPIRATION=604800000

# External API Keys (선택사항, 없어도 더미 데이터로 작동)
COINGECKO_API_KEY=
ETHERSCAN_API_KEY=

# Blockchain Configuration
WEB3_RPC_URL=https://sepolia.infura.io/v3/c78b7199563549a5b61637084bf8d0f1
VAULT_PRIVATE_KEY=79d055b74a1eaf82e26ac127bc26fab9ecd2560e1d38cec304f95306136a04c0
NFT_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678  # ← 2.3에서 배포한 주소

# Server Configuration
PORT=8080
```

**🔥 중요:**
- `NFT_CONTRACT_ADDRESS`: 2.3 단계에서 배포한 컨트랙트 주소로 변경
- `VAULT_PRIVATE_KEY`: 0x 제거한 Private Key (이미 올바름)

### 3.2 빌드 확인

```bash
./gradlew build
```

---

## 4. 프론트엔드 설정

### 4.1 의존성 설치

```bash
cd ../frontend
npm install
```

### 4.2 환경 변수 설정

`.env.local` 파일 편집:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8080

# WalletConnect Project ID (https://cloud.walletconnect.com에서 무료 발급)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_PROJECT_ID

# NFT Contract Address
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678  # ← 2.3에서 배포한 주소

# Chain ID (Sepolia = 11155111)
NEXT_PUBLIC_CHAIN_ID=11155111
```

**🔥 중요:**
- `NFT_CONTRACT_ADDRESS`: 2.3 단계에서 배포한 컨트랙트 주소로 변경

### 4.3 WalletConnect Project ID 발급 (선택)

WalletConnect를 사용하려면 무료 Project ID가 필요합니다:

1. https://cloud.walletconnect.com 접속
2. 회원가입/로그인
3. "Create New Project" 클릭
4. Project Name: `DongunCoinHub`
5. Project ID 복사하여 `.env.local`에 입력

> ⚠️ Project ID 없이도 실행 가능하지만, 지갑 연결 시 경고가 표시됩니다.

---

## 5. 전체 시스템 실행

### 방법 1: Docker Compose (권장)

```bash
# 프로젝트 루트로 이동
cd ..

# 전체 스택 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

**실행되는 서비스:**
- PostgreSQL (port 5432)
- Backend (port 8080)
- Frontend (port 3000)

### 방법 2: 개별 실행

#### Terminal 1 - Database
```bash
docker-compose up -d postgres
```

#### Terminal 2 - Backend
```bash
cd backend
./gradlew run
```

#### Terminal 3 - Frontend
```bash
cd frontend
npm run dev
```

---

## 6. 테스트 및 확인

### 6.1 서비스 접속

브라우저에서 접속:

```
Frontend: http://localhost:3000
Backend API: http://localhost:8080
```

### 6.2 테스트 계정으로 로그인

1. http://localhost:3000/login 접속
2. 테스트 계정 정보 입력:

```
이메일: test@donguncoin.com
비밀번호: test1234
```

3. 로그인 후 대시보드에서 확인:
   - ✅ 보유 현금: 10,000,000 KRW
   - ✅ 코인 시세 표시됨
   - ✅ 마켓 정보 로딩됨

### 6.3 기능 테스트

#### 6.3.1 코인 거래 테스트

1. 상단 메뉴 → **"마켓"** 클릭
2. 원하는 코인 선택 (예: BTC)
3. **"매수"** 버튼 클릭
4. 수량 입력 (예: 0.001)
5. **"매수하기"** 클릭
6. 대시보드로 돌아가서 잔액 확인

#### 6.3.2 NFT 구매 테스트

1. 상단 메뉴 → **"NFT"** 클릭
2. **"NFT 마켓"** 탭에서 NFT 확인
   - 민팅한 NFT가 보여야 함
3. 원하는 NFT 카드에서 **"구매하기"** 클릭
4. 구매 확인 팝업에서 **"구매하기"** 클릭
5. **"내 NFT"** 탭으로 이동하여 구매한 NFT 확인

#### 6.3.3 NFT 출금 테스트 (실제 지갑으로)

1. NFT 페이지 → **"내 NFT"** 탭
2. 보유한 NFT 카드에서 **"출금하기"** 클릭
3. 출금 모달에서:
   - 메타마스크 **"Connect Wallet"** 클릭
   - 지갑 주소 자동 입력됨
   - 또는 수동으로 주소 입력: `0xYourWalletAddress`
4. **"출금하기"** 클릭
5. 약 30초~1분 후 MetaMask에서 NFT 도착 확인:
   - MetaMask → NFT 탭
   - 또는 OpenSea Testnet에서 확인

### 6.4 API 테스트

```bash
# 코인 시세 조회
curl http://localhost:8080/api/market/tickers

# 특정 코인 상세
curl http://localhost:8080/api/market/coins/BTC

# NFT 목록
curl http://localhost:8080/api/nft/list
```

### 6.5 Database 확인

```bash
# PostgreSQL 접속
docker-compose exec postgres psql -U postgres -d donguncoin_hub

# 테이블 목록 확인
\dt

# 사용자 확인
SELECT * FROM users;

# 코인 목록 확인
SELECT * FROM coins;

# 가격 데이터 확인
SELECT * FROM price_snapshots ORDER BY created_at DESC LIMIT 10;

# 종료
\q
```

### 6.6 Worker 동작 확인

```bash
# Backend 로그 확인
docker-compose logs -f backend

# 출력 예시 (1분마다):
# ✅ Updated price for BTC: 50000000.00
# ✅ Updated price for ETH: 3000000.00
```

---

## 7. 문제 해결

### 7.1 NFT 컨트랙트 배포 실패

**증상:**
```
Error: insufficient funds for gas
```

**해결:**
1. MetaMask 지갑에 Sepolia ETH가 충분한지 확인 (최소 0.1 ETH)
2. Faucet에서 더 받기: https://sepoliafaucet.com

---

**증상:**
```
Error: Invalid JSON RPC response
```

**해결:**
1. `blockchain/.env`의 RPC URL 확인
2. Infura/Alchemy 대시보드에서 API 키 상태 확인

---

### 7.2 Backend 연결 실패

**증상:**
```
Connection refused: localhost:5432
```

**해결:**
```bash
# PostgreSQL 실행 확인
docker-compose ps postgres

# 재시작
docker-compose restart postgres

# 로그 확인
docker-compose logs postgres
```

---

**증상:**
```
JWT_SECRET is not set
```

**해결:**
1. `backend/.env` 파일 존재 확인
2. `JWT_SECRET` 값이 설정되어 있는지 확인

---

### 7.3 Frontend 실행 안됨

**증상:**
```
Module not found: Can't resolve 'wagmi'
```

**해결:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

**증상:**
```
API call failed: Network Error
```

**해결:**
1. Backend가 실행 중인지 확인: `http://localhost:8080`
2. `.env.local`의 `NEXT_PUBLIC_API_URL` 확인
3. CORS 문제: Backend 재시작

---

### 7.4 NFT 출금 안됨

**증상:**
```
NFT 출금 상태가 PENDING에서 변하지 않음
```

**해결:**
1. Backend 로그 확인:
```bash
docker-compose logs -f backend | grep NFTWithdrawal
```

2. Vault 지갑에 Sepolia ETH 확인:
```
https://sepolia.etherscan.io/address/0xYourVaultAddress
```

3. Private Key 확인:
```bash
# backend/.env
VAULT_PRIVATE_KEY=79d055...  # 0x 제거된 형태
```

---

### 7.5 Docker 관련

**증상:**
```
docker-credential-desktop: executable file not found
```

**해결:**
`~/.docker/config.json` 편집:
```json
{
  "auths": {},
  // "credsStore": "desktop"  ← 이 줄 삭제 또는 주석
}
```

---

**증상:**
```
Port 8080 is already in use
```

**해결:**
```bash
# 포트 사용 프로세스 확인
lsof -i :8080

# 프로세스 종료
kill -9 <PID>

# 또는 Docker 포트 변경
# docker-compose.yml에서 "8081:8080"로 변경
```

---

## 8. 추가 명령어

### 개발 도구

```bash
# 전체 재시작
docker-compose restart

# Backend만 재시작
docker-compose restart backend

# 로그 실시간 확인
docker-compose logs -f backend

# 컨테이너 정리
docker-compose down -v

# Database 백업
docker-compose exec postgres pg_dump -U postgres donguncoin_hub > backup.sql

# Database 복원
docker-compose exec -T postgres psql -U postgres donguncoin_hub < backup.sql
```

### NFT 관련

```bash
cd blockchain

# 추가 NFT 민팅
npx hardhat run scripts/mint.js --network sepolia

# 배치 민팅 (10개)
npx hardhat run scripts/batchMint.js --network sepolia

# 컨트랙트 상태 확인
npx hardhat run scripts/checkContract.js --network sepolia
```

### 테스트

```bash
# Blockchain 테스트
cd blockchain
npm test

# Backend 테스트 (예정)
cd backend
./gradlew test

# 통합 테스트
./test.sh
```

---

## 9. 다음 단계

### 9.1 실제 사용하기

1. ✅ 회원가입 (새 계정 생성)
2. ✅ 가상 코인 거래 체험
3. ✅ NFT 구매
4. ✅ NFT를 실제 지갑으로 출금

### 9.2 커스터마이징

1. **새로운 코인 추가**:
```sql
-- database/init.sql
INSERT INTO coins (symbol, name, gecko_id, is_enabled)
VALUES ('DOGE', 'Dogecoin', 'dogecoin', true);
```

2. **NFT 메타데이터 변경**:
```javascript
// blockchain/scripts/mint.js
const metadata = {
  name: "My Custom NFT",
  description: "Custom description",
  image: "ipfs://..."
};
```

3. **수수료율 변경**:
```kotlin
// backend/.../TradeService.kt
private val FEE_RATE = BigDecimal("0.002") // 0.2%
```

### 9.3 프로덕션 배포

1. 도메인 구매
2. 서버 준비 (AWS, GCP, DigitalOcean 등)
3. HTTPS 설정 (Let's Encrypt)
4. 환경 변수 프로덕션 값으로 변경
5. `docker-compose.prod.yml` 사용

자세한 내용: [DEPLOYMENT.md](DEPLOYMENT.md) 참고

---

## 10. 요약

### ✅ 체크리스트

- [ ] Sepolia ETH 받음 (0.5 ETH)
- [ ] NFT 컨트랙트 배포 완료
- [ ] 컨트랙트 주소를 Backend/Frontend 환경변수에 설정
- [ ] Docker Compose로 전체 시스템 실행
- [ ] Frontend 접속 확인 (http://localhost:3000)
- [ ] 테스트 계정 로그인 확인
- [ ] 코인 거래 테스트 완료
- [ ] NFT 구매 테스트 완료
- [ ] NFT 출금 테스트 완료 (선택)

### 🎯 핵심 URL

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Sepolia Etherscan**: https://sepolia.etherscan.io
- **Sepolia Faucet**: https://sepoliafaucet.com

### 📞 도움이 필요하면

1. [TESTING.md](TESTING.md) - 테스트 가이드
2. [DEPLOYMENT.md](DEPLOYMENT.md) - 배포 가이드
3. [GitHub Issues](https://github.com/yourusername/DongunCoinHub/issues)

---

**🎉 축하합니다! DongunCoinHub가 성공적으로 실행되었습니다! 🎉**

이제 가상 화폐 거래와 실제 NFT 체험을 즐기세요!
