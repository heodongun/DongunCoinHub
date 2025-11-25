# 🏦 DongunCoinHub

**"돈은 가상, NFT는 진짜"** - 모의 코인 거래소 + 실제 NFT 플랫폼

## 📋 프로젝트 개요

DongunCoinHub는 교육 및 체험 목적의 가상 암호화폐 거래 플랫폼입니다.

### 핵심 특징

- ❌ **실제 돈/코인 거래 아님**: 모든 거래는 가상 포인트로 진행
- ✅ **실제 블록체인 데이터**: 실시간 시세와 온체인 정보 연동
- ✅ **진짜 NFT**: 실제 Ethereum 블록체인의 ERC-721 NFT
- 🎓 **교육 목적**: 안전한 환경에서 암호화폐 거래 학습

## 🏗️ 기술 스택

### Backend
- **Language**: Kotlin
- **Framework**: Ktor 2.3.5
- **Database**: PostgreSQL 15
- **ORM**: Exposed
- **DI**: Koin

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Query
- **Web3**: wagmi + viem

### Blockchain
- **Network**: Ethereum (Sepolia Testnet)
- **Standard**: ERC-721 (NFT)
- **Framework**: Hardhat
- **Language**: Solidity 0.8.20

## 🚀 빠른 시작

### 전제 조건

- Docker & Docker Compose
- Node.js 18+
- JDK 17+
- Git

### 1. 프로젝트 클론

```bash
git clone https://github.com/yourusername/DongunCoinHub.git
cd DongunCoinHub
```

### 2. 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# 필수 값 설정
# - DATABASE_PASSWORD
# - JWT_SECRET
# - WEB3_RPC_URL (Alchemy/Infura)
# - NFT_CONTRACT_ADDRESS (배포 후)
# - VAULT_PRIVATE_KEY (배포 후)
```

### 3. Docker Compose로 실행

```bash
# 전체 스택 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 상태 확인
docker-compose ps
```

### 4. 서비스 접속

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Database**: localhost:5432

### 5. 테스트 계정

```
Email: test@donguncoin.com
Password: test1234
초기 잔액: 10,000,000 KRW
```

## 📁 프로젝트 구조

```
DongunCoinHub/
├── backend/                 # Kotlin + Ktor 백엔드
│   ├── src/main/kotlin/
│   │   └── com/donguncoin/hub/
│   │       ├── Application.kt
│   │       ├── config/
│   │       ├── data/
│   │       ├── domain/
│   │       ├── routes/
│   │       └── workers/
│   └── build.gradle.kts
├── frontend/                # Next.js 프론트엔드
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
├── blockchain/              # Hardhat + Solidity
│   ├── contracts/
│   ├── scripts/
│   ├── test/
│   └── hardhat.config.ts
├── database/
│   └── init.sql            # PostgreSQL 초기화
├── docker-compose.yml
└── README.md
```

## 🎯 주요 기능

### 1. 회원 가입 & 로그인
- 이메일/비밀번호 인증
- JWT 토큰 발급
- 초기 가상 현금 1천만원 지급

### 2. 모의 코인 거래
- 실시간 시세 조회 (CoinGecko API)
- 시장가 주문 (즉시 체결)
- 매수/매도 기능
- 거래 수수료 0.1%

### 3. 포트폴리오 관리
- 보유 코인 현황
- 총 자산 평가액
- 거래 내역 조회
- 수익률 계산

### 4. NFT 마켓플레이스
- NFT 구매 (가상 포인트)
- NFT 보유 현황
- NFT 출금 (실제 지갑으로)
- 출금 요청 상태 추적

### 5. 온체인 모니터링
- 최신 블록 정보
- 트랜잭션 조회
- 가스비 통계
- 네트워크 활동 지표

### 6. 리더보드
- 총 수익 순위
- 기간별 수익률 순위
- 내 순위 확인

## 🔐 보안 고려사항

### 가상 자산 보호
- PostgreSQL SERIALIZABLE 트랜잭션
- `SELECT ... FOR UPDATE` 락
- 이중 지급 방지

### NFT 권한 관리
- 컨트랙트 Owner만 mint 가능
- Vault 지갑 Private Key는 환경변수
- 출금 시 서명 검증

### API 보안
- JWT 인증 (15분 + Refresh 7일)
- Rate Limiting (분당 100 요청)
- CORS 설정
- 입력 검증

## 🧪 테스트

### Backend 테스트

```bash
cd backend
./gradlew test
```

### Frontend 테스트

```bash
cd frontend
npm test
```

### NFT 컨트랙트 테스트

```bash
cd blockchain
npm test
```

### 통합 테스트

```bash
# E2E 테스트 실행
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📊 API 문서

### 인증

#### POST /api/auth/register
```json
{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "username"
}
```

#### POST /api/auth/login
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 거래

#### POST /api/trade/order
```json
{
  "coinSymbol": "BTC",
  "side": "BUY",
  "type": "MARKET",
  "quantity": "0.1"
}
```

#### GET /api/account/summary
계정 요약 정보 조회

#### GET /api/market/tickers
전체 코인 시세 조회

### NFT

#### GET /api/nft/list
구매 가능한 NFT 목록

#### POST /api/nft/buy
```json
{
  "nftTokenId": 1,
  "price": "1000000"
}
```

#### POST /api/nft/withdraw
```json
{
  "nftTokenId": 1,
  "targetWallet": "0x..."
}
```

## 🔧 개발 가이드

### Backend 개발

```bash
cd backend

# 컴파일
./gradlew build

# 실행
./gradlew run

# 테스트
./gradlew test
```

### Frontend 개발

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버
npm run dev

# 빌드
npm run build
```

### NFT 컨트랙트 배포

```bash
cd blockchain

# 컴파일
npm run compile

# 로컬 네트워크 배포
npm run deploy:local

# Sepolia 배포
npm run deploy:sepolia

# Etherscan 검증
npm run verify
```

## 🚀 배포

### Production 체크리스트

- [ ] 환경변수 프로덕션 값으로 변경
- [ ] JWT_SECRET 강력한 키로 변경
- [ ] DATABASE_PASSWORD 강력한 비밀번호
- [ ] Vault Private Key 안전한 곳에 보관
- [ ] CORS 설정 프론트엔드 도메인만 허용
- [ ] Rate Limiting 강화
- [ ] HTTPS 적용
- [ ] 백업 전략 수립

### Kubernetes 배포 (선택)

```bash
kubectl apply -f k8s/
```

## 📝 라이선스

MIT License

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

- GitHub Issues: [프로젝트 이슈](https://github.com/yourusername/DongunCoinHub/issues)
- Email: contact@donguncoin.com

## ⚠️ 면책 조항

**이 프로젝트는 교육 목적으로만 제작되었습니다.**

- 실제 금융 거래가 아닙니다
- 실제 암호화폐를 취급하지 않습니다
- 투자 권유가 아닙니다
- 사용자는 자신의 책임 하에 사용합니다

## 🎓 학습 자료

- [Kotlin 공식 문서](https://kotlinlang.org/docs/)
- [Ktor 문서](https://ktor.io/docs/)
- [Next.js 문서](https://nextjs.org/docs)
- [Solidity 문서](https://docs.soliditylang.org/)
- [Hardhat 문서](https://hardhat.org/docs)
- [ERC-721 표준](https://eips.ethereum.org/EIPS/eip-721)

---

Made with ❤️ by DongunCoinHub Team
