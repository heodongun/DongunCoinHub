#!/bin/bash

echo "🚀 DongunCoinHub 프로젝트 초기 설정"
echo "======================================"

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. 환경 변수 파일 복사
echo -e "\n${YELLOW}1. 환경 변수 설정...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ .env 파일이 생성되었습니다${NC}"
    echo -e "${YELLOW}⚠ .env 파일을 편집하여 실제 값을 입력하세요${NC}"
else
    echo -e "${GREEN}✓ .env 파일이 이미 존재합니다${NC}"
fi

# 2. Docker 확인
echo -e "\n${YELLOW}2. Docker 확인...${NC}"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker가 설치되어 있습니다${NC}"
    docker --version
else
    echo -e "${RED}✗ Docker가 설치되어 있지 않습니다${NC}"
    echo "https://www.docker.com/get-started 에서 Docker를 설치하세요"
    exit 1
fi

if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✓ Docker Compose가 설치되어 있습니다${NC}"
    docker-compose --version
else
    echo -e "${RED}✗ Docker Compose가 설치되어 있지 않습니다${NC}"
    exit 1
fi

# 3. Node.js 확인
echo -e "\n${YELLOW}3. Node.js 확인...${NC}"
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓ Node.js가 설치되어 있습니다${NC}"
    node --version

    # blockchain 디렉토리 의존성 설치
    if [ -d "blockchain" ]; then
        echo -e "\n${YELLOW}Blockchain 의존성 설치 중...${NC}"
        cd blockchain
        npm install
        cd ..
        echo -e "${GREEN}✓ Blockchain 의존성 설치 완료${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Node.js가 설치되어 있지 않습니다 (blockchain 개발 시 필요)${NC}"
fi

# 4. JDK 확인
echo -e "\n${YELLOW}4. JDK 확인...${NC}"
if command -v java &> /dev/null; then
    echo -e "${GREEN}✓ Java가 설치되어 있습니다${NC}"
    java -version
else
    echo -e "${YELLOW}⚠ Java가 설치되어 있지 않습니다 (backend 개발 시 필요)${NC}"
fi

# 5. 프로젝트 구조 확인
echo -e "\n${YELLOW}5. 프로젝트 구조 생성...${NC}"
mkdir -p backend/src/main/kotlin
mkdir -p backend/src/main/resources
mkdir -p backend/src/test/kotlin
mkdir -p frontend/app
mkdir -p frontend/components
mkdir -p frontend/lib
mkdir -p blockchain/contracts
mkdir -p blockchain/scripts
mkdir -p blockchain/test
mkdir -p database
mkdir -p docs
echo -e "${GREEN}✓ 프로젝트 디렉토리 구조 생성 완료${NC}"

# 6. 데이터베이스 초기화
echo -e "\n${YELLOW}6. Docker Compose로 데이터베이스 시작...${NC}"
echo "Docker Compose를 시작하시겠습니까? (y/n)"
read -r response
if [[ "$response" == "y" || "$response" == "Y" ]]; then
    docker-compose up -d postgres
    echo -e "${GREEN}✓ PostgreSQL 시작 완료${NC}"

    echo -e "\n${YELLOW}데이터베이스가 준비될 때까지 대기 중...${NC}"
    sleep 10

    echo -e "${GREEN}✓ 데이터베이스 초기화 완료${NC}"
else
    echo -e "${YELLOW}⚠ 나중에 'docker-compose up -d' 명령으로 시작하세요${NC}"
fi

# 7. 완료 메시지
echo -e "\n${GREEN}======================================"
echo "✓ 초기 설정이 완료되었습니다!"
echo "======================================${NC}"

echo -e "\n${YELLOW}다음 단계:${NC}"
echo "1. .env 파일을 편집하여 실제 값을 입력하세요"
echo "2. 전체 스택을 시작하려면: docker-compose up -d"
echo "3. 프론트엔드 접속: http://localhost:3000"
echo "4. 백엔드 API: http://localhost:8080"
echo ""
echo "테스트 계정:"
echo "  Email: test@donguncoin.com"
echo "  Password: test1234"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
