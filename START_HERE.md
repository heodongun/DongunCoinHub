# 🎯 DongunCoinHub - 여기서 시작하세요!

**완전한 가상 화폐 거래 + 실제 NFT 플랫폼**

---

## ⚡ 5분 안에 시작하기

### 단계 1: NFT 컨트랙트 배포 (Blockchain)

```bash
# 1. Blockchain 폴더로 이동
cd blockchain

# 2. 의존성 설치
npm install

# 3. Sepolia 테스트넷에 NFT 컨트랙트 배포
npx hardhat run scripts/deploy.js --network sepolia
```

**출력 예시:**
```
Deploying OfficialDongunNFT...
OfficialDongunNFT deployed to: 0x1234567890abcdef1234567890abcdef12345678
```

✅ **이 주소를 복사하세요!** → 다음 단계에서 사용

---

### 단계 2: NFT 민팅 (선택사항)

```bash
# 테스트용 NFT 10개 발행
npx hardhat run scripts/batchMint.js --network sepolia
```

---

### 단계 3: Backend 환경 변수 설정

```bash
cd ../backend
```

`backend/.env` 파일 편집:

```env
# ... 다른 설정들 ...

# ⬇️ 이 부분을 단계 1에서 복사한 주소로 변경 ⬇️
NFT_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678

# ⬇️ Private Key (0x 제거) - 이미 올바르게 설정됨 ⬇️
VAULT_PRIVATE_KEY=79d055b74a1eaf82e26ac127bc26fab9ecd2560e1d38cec304f95306136a04c0
```

---

### 단계 4: Frontend 환경 변수 설정

```bash
cd ../frontend
```

`frontend/.env.local` 파일 편집:

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8080

# WalletConnect Project ID (https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_PROJECT_ID

# ⬇️ NFT 컨트랙트 주소 (단계 1에서 복사한 주소) ⬇️
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678

# Sepolia Chain ID
NEXT_PUBLIC_CHAIN_ID=11155111
```

---

### 단계 5: 전체 시스템 실행

```bash
# 프로젝트 루트로 이동
cd ..

# 실행 스크립트 사용 (권장)
./run.sh

# 또는 Docker Compose 직접 사용
docker-compose up -d
```

---

### 단계 6: 접속 및 테스트

**브라우저 접속:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

**테스트 계정으로 로그인:**
```
이메일: test@donguncoin.com
비밀번호: test1234
```

**테스트 시나리오:**
1. ✅ 대시보드에서 10,000,000 KRW 확인
2. ✅ 마켓 → BTC 매수 테스트
3. ✅ NFT → NFT 구매 테스트
4. ✅ NFT → 내 NFT → 출금 테스트 (선택)

---

## 📚 상세 가이드

### 처음 사용하시나요?
👉 **[QUICKSTART.md](QUICKSTART.md)** - 완전한 단계별 가이드

### 이미 설정 완료?
```bash
# 간단 실행
./run.sh

# 또는
docker-compose up -d
```

### 문제 발생?
👉 **[QUICKSTART.md - 문제 해결](QUICKSTART.md#7-문제-해결)** 섹션 참고

---

## 🎯 핵심 체크리스트

- [ ] **Sepolia ETH 받음** (Faucet: https://sepoliafaucet.com)
- [ ] **NFT 컨트랙트 배포** (`npx hardhat run scripts/deploy.js --network sepolia`)
- [ ] **컨트랙트 주소 복사**
- [ ] **backend/.env 설정** (NFT_CONTRACT_ADDRESS)
- [ ] **frontend/.env.local 설정** (NFT_CONTRACT_ADDRESS)
- [ ] **시스템 실행** (`./run.sh` 또는 `docker-compose up -d`)
- [ ] **Frontend 접속** (http://localhost:3000)
- [ ] **로그인 테스트** (test@donguncoin.com / test1234)

---

## 🆘 빠른 도움말

### 컨트랙트 주소 확인하는 법
```bash
cd blockchain
cat .env | grep NFT_CONTRACT_ADDRESS
```

### 컨트랙트 상태 확인
```bash
cd blockchain
npx hardhat run scripts/checkContract.js --network sepolia
```

### 로그 확인
```bash
# 전체 로그
docker-compose logs -f

# Backend만
docker-compose logs -f backend

# Frontend만
docker-compose logs -f frontend
```

### 시스템 중지
```bash
docker-compose down
```

### 완전 초기화 (데이터 삭제)
```bash
docker-compose down -v
```

---

## 📖 전체 문서 목록

| 문서 | 설명 |
|------|------|
| **START_HERE.md** | 👈 지금 보고 있는 문서 (빠른 시작) |
| **[QUICKSTART.md](QUICKSTART.md)** | 📚 완전한 단계별 설치 가이드 |
| **[README.md](README.md)** | 📄 프로젝트 개요 및 소개 |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | 🚀 프로덕션 배포 가이드 |
| **[TESTING.md](TESTING.md)** | 🧪 테스트 가이드 |
| **[COMPLETION_REPORT.md](COMPLETION_REPORT.md)** | ✅ 프로젝트 완성 보고서 |

---

## 🎉 다음 단계

### 즉시 체험 가능:
1. 가상 화폐 거래 (BTC, ETH 등 6개 코인)
2. NFT 구매 (가상 포인트)
3. NFT 출금 (실제 지갑으로)

### 커스터마이징:
1. 새로운 코인 추가
2. NFT 메타데이터 변경
3. 수수료율 조정
4. UI/UX 커스터마이징

### 프로덕션 배포:
1. 도메인 구매
2. 서버 준비
3. HTTPS 설정
4. Mainnet 전환 (선택)

---

## 💡 FAQ

### Q: Sepolia ETH는 어디서 받나요?
A: https://sepoliafaucet.com 또는 https://www.alchemy.com/faucets/ethereum-sepolia

### Q: NFT 컨트랙트를 다시 배포해도 되나요?
A: 네! 새 주소를 받아서 backend/.env와 frontend/.env.local을 업데이트하면 됩니다.

### Q: WalletConnect Project ID는 필수인가요?
A: 선택사항입니다. 없어도 실행되지만, 지갑 연결 시 경고가 표시됩니다.

### Q: 실제 돈이 필요한가요?
A: 아니요! 모든 거래는 가상 포인트입니다. Sepolia ETH만 테스트용으로 필요합니다 (무료).

### Q: NFT는 진짜인가요?
A: 네! Sepolia 테스트넷의 실제 ERC-721 NFT입니다. 메타마스크에서 확인할 수 있습니다.

---

## 🚀 지금 바로 시작하세요!

```bash
# 1. NFT 컨트랙트 배포
cd blockchain
npm install
npx hardhat run scripts/deploy.js --network sepolia

# 2. 주소 복사 후 환경 변수 설정
# backend/.env, frontend/.env.local

# 3. 실행!
cd ..
./run.sh
```

**접속:** http://localhost:3000

**로그인:** test@donguncoin.com / test1234

---

**문제가 있으신가요?** 👉 [QUICKSTART.md](QUICKSTART.md#7-문제-해결)

**더 자세한 설명이 필요하신가요?** 👉 [QUICKSTART.md](QUICKSTART.md)

**🎉 행운을 빕니다! 🎉**
