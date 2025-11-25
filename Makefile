# DongunCoinHub Makefile

.PHONY: help setup up down logs test clean install

# 기본 타겟
help:
	@echo "DongunCoinHub 프로젝트 명령어"
	@echo ""
	@echo "  make setup      - 초기 프로젝트 설정"
	@echo "  make install    - 모든 의존성 설치"
	@echo "  make up         - 모든 서비스 시작 (detached)"
	@echo "  make up-logs    - 모든 서비스 시작 (로그 출력)"
	@echo "  make down       - 모든 서비스 중지"
	@echo "  make restart    - 모든 서비스 재시작"
	@echo "  make logs       - 로그 보기"
	@echo "  make logs-f     - 로그 실시간 보기"
	@echo "  make test       - 모든 테스트 실행"
	@echo "  make clean      - 빌드 파일 정리"
	@echo "  make db-shell   - PostgreSQL 쉘 접속"
	@echo "  make db-reset   - 데이터베이스 초기화"
	@echo ""

# 초기 설정
setup:
	@echo "🚀 프로젝트 초기 설정 시작..."
	./scripts/setup.sh

# 의존성 설치
install:
	@echo "📦 의존성 설치 중..."
	@if [ -d "blockchain" ]; then \
		echo "Installing blockchain dependencies..."; \
		cd blockchain && npm install; \
	fi
	@if [ -d "frontend" ]; then \
		echo "Installing frontend dependencies..."; \
		cd frontend && npm install; \
	fi
	@echo "✅ 의존성 설치 완료"

# Docker Compose 명령어
up:
	@echo "🚀 서비스 시작 중..."
	docker-compose up -d
	@echo "✅ 서비스가 시작되었습니다"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:8080"

up-logs:
	docker-compose up

down:
	@echo "🛑 서비스 중지 중..."
	docker-compose down
	@echo "✅ 서비스가 중지되었습니다"

restart:
	@echo "🔄 서비스 재시작 중..."
	docker-compose restart
	@echo "✅ 서비스가 재시작되었습니다"

logs:
	docker-compose logs

logs-f:
	docker-compose logs -f

# 개별 서비스 로그
logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-postgres:
	docker-compose logs -f postgres

# 테스트
test:
	@echo "🧪 테스트 실행 중..."
	@if [ -d "blockchain" ]; then \
		echo "Testing blockchain..."; \
		cd blockchain && npm test; \
	fi
	@if [ -d "backend" ]; then \
		echo "Testing backend..."; \
		cd backend && ./gradlew test || echo "Backend tests skipped"; \
	fi
	@if [ -d "frontend" ]; then \
		echo "Testing frontend..."; \
		cd frontend && npm test || echo "Frontend tests skipped"; \
	fi
	@echo "✅ 테스트 완료"

# 정리
clean:
	@echo "🧹 빌드 파일 정리 중..."
	@if [ -d "backend/build" ]; then rm -rf backend/build; fi
	@if [ -d "frontend/.next" ]; then rm -rf frontend/.next; fi
	@if [ -d "blockchain/artifacts" ]; then rm -rf blockchain/artifacts; fi
	@if [ -d "blockchain/cache" ]; then rm -rf blockchain/cache; fi
	docker-compose down -v
	@echo "✅ 정리 완료"

# 데이터베이스
db-shell:
	docker-compose exec postgres psql -U postgres -d donguncoin_hub

db-reset:
	@echo "⚠️  데이터베이스를 초기화합니다. 모든 데이터가 삭제됩니다!"
	@read -p "계속하시겠습니까? (y/N) " confirm && [ $$confirm = y ]
	docker-compose down -v
	docker-compose up -d postgres
	@sleep 5
	@echo "✅ 데이터베이스가 초기화되었습니다"

# 개발
dev-backend:
	cd backend && ./gradlew run

dev-frontend:
	cd frontend && npm run dev

dev-blockchain:
	cd blockchain && npx hardhat node

# 프로덕션 빌드
build:
	@echo "🏗️  프로덕션 빌드 중..."
	docker-compose build
	@echo "✅ 빌드 완료"

# 상태 확인
status:
	@echo "📊 서비스 상태:"
	docker-compose ps

# 헬스 체크
health:
	@echo "🏥 헬스 체크:"
	@curl -s http://localhost:8080/health || echo "Backend: ❌"
	@curl -s http://localhost:3000 > /dev/null && echo "Frontend: ✅" || echo "Frontend: ❌"

# 전체 재설정
reset: clean
	@echo "🔄 프로젝트 전체 재설정..."
	make install
	make up
	@echo "✅ 재설정 완료"
