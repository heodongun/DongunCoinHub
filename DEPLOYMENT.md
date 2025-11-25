# 🚀 배포 가이드

DongunCoinHub 프로젝트의 배포 방법을 단계별로 설명합니다.

## 📋 목차

1. [로컬 개발 환경](#로컬-개발-환경)
2. [Docker 배포](#docker-배포)
3. [프로덕션 배포](#프로덕션-배포)
4. [환경 변수 설정](#환경-변수-설정)
5. [데이터베이스 마이그레이션](#데이터베이스-마이그레이션)
6. [NFT 컨트랙트 배포](#nft-컨트랙트-배포)

## 로컬 개발 환경

### 1. PostgreSQL 실행

```bash
docker-compose up -d postgres
```

### 2. Backend 실행

```bash
cd backend
./gradlew run
```

Backend는 `http://localhost:8080`에서 실행됩니다.

### 3. Frontend 실행

```bash
cd frontend
npm install
npm run dev
```

Frontend는 `http://localhost:3000`에서 실행됩니다.

### 4. Hardhat Node 실행 (선택)

```bash
cd blockchain
npx hardhat node
```

## Docker 배포

### 전체 스택 한 번에 실행

```bash
# 빌드 및 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 특정 서비스만 재시작
docker-compose restart backend

# 중지
docker-compose down

# 볼륨까지 삭제
docker-compose down -v
```

### 개별 서비스 제어

```bash
# Backend만 재시작
docker-compose restart backend

# Frontend만 재시작
docker-compose restart frontend

# Database만 재시작
docker-compose restart postgres
```

## 프로덕션 배포

### 1. 환경 변수 설정

#### Backend (`backend/.env`)

```env
# Database
DB_HOST=postgres  # 프로덕션에서는 실제 DB 호스트
DB_PORT=5432
DB_NAME=donguncoin_hub
DB_USER=postgres
DB_PASSWORD=STRONG_PASSWORD_HERE

# JWT
JWT_SECRET=VERY_STRONG_SECRET_KEY_CHANGE_THIS
JWT_ACCESS_EXPIRATION=900000
JWT_REFRESH_EXPIRATION=604800000

# External APIs
COINGECKO_API_KEY=your_coingecko_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key

# Blockchain
WEB3_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
VAULT_PRIVATE_KEY=your_vault_private_key_without_0x
NFT_CONTRACT_ADDRESS=0x...
```

#### Frontend (`frontend/.env.production`)

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=11155111
```

### 2. 빌드

#### Backend

```bash
cd backend
./gradlew build
# JAR 파일이 build/libs/에 생성됨
```

#### Frontend

```bash
cd frontend
npm run build
# 빌드 결과가 .next/에 생성됨
```

### 3. Docker 이미지 빌드

```bash
# Backend
docker build -t donguncoin-hub-backend:latest ./backend

# Frontend
docker build -t donguncoin-hub-frontend:latest ./frontend
```

### 4. Docker Registry에 푸시

```bash
# Docker Hub
docker tag donguncoin-hub-backend:latest yourusername/donguncoin-hub-backend:latest
docker push yourusername/donguncoin-hub-backend:latest

docker tag donguncoin-hub-frontend:latest yourusername/donguncoin-hub-frontend:latest
docker push yourusername/donguncoin-hub-frontend:latest
```

### 5. 서버에서 실행

```bash
# docker-compose.prod.yml 사용
docker-compose -f docker-compose.prod.yml up -d
```

## 환경 변수 설정

### 필수 환경 변수

| 변수 | 설명 | 예시 |
|------|------|------|
| `DB_HOST` | PostgreSQL 호스트 | `localhost` |
| `DB_PASSWORD` | DB 비밀번호 | `강력한_비밀번호` |
| `JWT_SECRET` | JWT 서명 키 | `랜덤_문자열_64자_이상` |
| `WEB3_RPC_URL` | Ethereum RPC URL | Alchemy/Infura URL |
| `VAULT_PRIVATE_KEY` | Vault 지갑 Private Key | `0x` 제외 |

### 선택 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `PORT` | Backend 포트 | `8080` |
| `COINGECKO_API_KEY` | CoinGecko API Key | (선택) |
| `ETHERSCAN_API_KEY` | Etherscan API Key | (선택) |

## 데이터베이스 마이그레이션

### 초기 스키마 적용

```bash
# Docker를 사용하는 경우 자동 적용됨
docker-compose up -d postgres

# 수동 적용
psql -h localhost -U postgres -d donguncoin_hub -f database/init.sql
```

### 백업

```bash
# 백업 생성
docker-compose exec postgres pg_dump -U postgres donguncoin_hub > backup.sql

# 복원
docker-compose exec -T postgres psql -U postgres donguncoin_hub < backup.sql
```

## NFT 컨트랙트 배포

### 1. Hardhat 환경 설정

`blockchain/.env`:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_deployer_private_key_without_0x
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 2. 컨트랙트 배포

```bash
cd blockchain

# Sepolia 테스트넷에 배포
npx hardhat run scripts/deploy.js --network sepolia

# 출력 예시:
# OfficialDongunNFT deployed to: 0x1234...
```

### 3. Etherscan 검증

```bash
npx hardhat verify --network sepolia 0x1234... "Dongun Official NFT" "DNFT"
```

### 4. NFT 민팅

```bash
# 단일 민팅
npx hardhat run scripts/mint.js --network sepolia

# 배치 민팅
npx hardhat run scripts/batchMint.js --network sepolia
```

### 5. Backend 환경 변수 업데이트

배포된 컨트랙트 주소를 `backend/.env`에 업데이트:

```env
NFT_CONTRACT_ADDRESS=0x1234...
```

## 헬스 체크

### Backend

```bash
curl http://localhost:8080/api/market/tickers
```

### Frontend

```bash
curl http://localhost:3000
```

### Database

```bash
docker-compose exec postgres psql -U postgres -c "SELECT 1"
```

## 모니터링

### 로그 확인

```bash
# 전체 로그
docker-compose logs -f

# Backend만
docker-compose logs -f backend

# 최근 100줄
docker-compose logs --tail=100 backend
```

### 리소스 사용량

```bash
docker stats
```

## 트러블슈팅

### Backend가 시작되지 않음

```bash
# 로그 확인
docker-compose logs backend

# 환경 변수 확인
docker-compose exec backend env | grep DB_
```

### Database 연결 실패

```bash
# PostgreSQL 상태 확인
docker-compose ps postgres

# 연결 테스트
docker-compose exec postgres psql -U postgres -c "SELECT version()"
```

### Frontend 빌드 실패

```bash
# 의존성 재설치
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 롤백

### Docker 이미지 롤백

```bash
# 이전 버전으로 롤백
docker-compose down
docker-compose up -d donguncoin-hub-backend:v1.0.0
```

### 데이터베이스 롤백

```bash
# 백업 복원
docker-compose exec -T postgres psql -U postgres donguncoin_hub < backup_20240101.sql
```

## 성능 최적화

### Database

```sql
-- 인덱스 생성
CREATE INDEX idx_price_snapshots_coin_id ON price_snapshots(coin_id);
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_orders_status ON orders(status);
```

### Backend

```kotlin
// HikariCP 설정 조정 (DatabaseConfig.kt)
maximumPoolSize = 20  // 기본 10
connectionTimeout = 30000
```

### Frontend

```bash
# 프로덕션 빌드 최적화
npm run build
npm run start
```

## 보안 체크리스트

- [ ] JWT_SECRET 변경됨
- [ ] DB 비밀번호 강력함
- [ ] VAULT_PRIVATE_KEY 안전하게 관리됨
- [ ] CORS 설정 확인
- [ ] HTTPS 적용 (프로덕션)
- [ ] Rate Limiting 활성화
- [ ] 방화벽 설정
- [ ] 정기 백업 설정

## 추가 리소스

- [Hardhat 문서](https://hardhat.org/docs)
- [Ktor 문서](https://ktor.io/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [PostgreSQL 튜닝 가이드](https://wiki.postgresql.org/wiki/Tuning_Your_PostgreSQL_Server)
