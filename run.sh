#!/bin/bash

# DongunCoinHub 실행 스크립트
# Usage: ./run.sh

set -e

echo "🚀 DongunCoinHub 시작 중..."
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Docker 확인
echo -e "${BLUE}📦 Docker 확인 중...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker가 설치되어 있지 않습니다.${NC}"
    echo "Docker를 먼저 설치해주세요: https://www.docker.com/get-started"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose가 설치되어 있지 않습니다.${NC}"
    echo "Docker Compose를 먼저 설치해주세요."
    exit 1
fi

echo -e "${GREEN}✅ Docker 확인 완료${NC}"
echo ""

# 2. 환경 변수 확인
echo -e "${BLUE}🔧 환경 변수 확인 중...${NC}"

# Backend 환경 변수
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  backend/.env 파일이 없습니다. 생성 중...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✅ backend/.env 생성 완료${NC}"
    echo -e "${YELLOW}⚠️  backend/.env 파일을 편집하여 NFT_CONTRACT_ADDRESS를 설정하세요!${NC}"
fi

# Frontend 환경 변수
if [ ! -f "frontend/.env.local" ]; then
    echo -e "${YELLOW}⚠️  frontend/.env.local 파일이 없습니다. 생성 중...${NC}"
    cp frontend/.env.example frontend/.env.local
    echo -e "${GREEN}✅ frontend/.env.local 생성 완료${NC}"
    echo -e "${YELLOW}⚠️  frontend/.env.local 파일을 편집하여 설정을 확인하세요!${NC}"
fi

echo -e "${GREEN}✅ 환경 변수 확인 완료${NC}"
echo ""

# 3. 기존 컨테이너 정리 (선택)
echo -e "${BLUE}🧹 기존 컨테이너 확인 중...${NC}"
if docker-compose ps | grep -q "Up"; then
    echo -e "${YELLOW}⚠️  실행 중인 컨테이너가 있습니다. 재시작합니다...${NC}"
    docker-compose down
fi
echo ""

# 4. Docker Compose 실행
echo -e "${BLUE}🐳 Docker Compose 실행 중...${NC}"
docker-compose up -d

echo ""
echo -e "${GREEN}✅ Docker 컨테이너가 시작되었습니다!${NC}"
echo ""

# 5. 서비스 상태 확인
echo -e "${BLUE}📊 서비스 상태 확인 중...${NC}"
sleep 3

docker-compose ps

echo ""

# 6. 헬스 체크
echo -e "${BLUE}🏥 헬스 체크 중...${NC}"

# PostgreSQL 체크
echo -n "PostgreSQL: "
if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 실행 중${NC}"
else
    echo -e "${RED}❌ 연결 실패${NC}"
fi

# Backend 체크 (최대 30초 대기)
echo -n "Backend: "
for i in {1..30}; do
    if curl -s http://localhost:8080/api/market/tickers > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 실행 중${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}⚠️  응답 없음 (로그 확인 필요)${NC}"
    fi
    sleep 1
done

# Frontend 체크
echo -n "Frontend: "
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 실행 중${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}⚠️  응답 없음 (로그 확인 필요)${NC}"
    fi
    sleep 1
done

echo ""

# 7. 접속 정보 출력
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 DongunCoinHub가 실행되었습니다!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}📍 접속 URL:${NC}"
echo -e "   Frontend:  ${YELLOW}http://localhost:3000${NC}"
echo -e "   Backend:   ${YELLOW}http://localhost:8080${NC}"
echo -e "   Database:  ${YELLOW}localhost:5432${NC}"
echo ""
echo -e "${BLUE}🔑 테스트 계정:${NC}"
echo -e "   이메일:    ${YELLOW}test@donguncoin.com${NC}"
echo -e "   비밀번호:  ${YELLOW}test1234${NC}"
echo -e "   초기 자금: ${YELLOW}10,000,000 KRW${NC}"
echo ""
echo -e "${BLUE}📋 유용한 명령어:${NC}"
echo -e "   로그 확인:     ${YELLOW}docker-compose logs -f${NC}"
echo -e "   Backend 로그:  ${YELLOW}docker-compose logs -f backend${NC}"
echo -e "   Frontend 로그: ${YELLOW}docker-compose logs -f frontend${NC}"
echo -e "   서비스 중지:   ${YELLOW}docker-compose down${NC}"
echo -e "   서비스 재시작: ${YELLOW}docker-compose restart${NC}"
echo ""
echo -e "${BLUE}📚 문서:${NC}"
echo -e "   빠른 시작: ${YELLOW}cat QUICKSTART.md${NC}"
echo -e "   배포 가이드: ${YELLOW}cat DEPLOYMENT.md${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo ""

# 8. 로그 따라가기 옵션
echo -e "${YELLOW}로그를 실시간으로 확인하시겠습니까? (y/N)${NC}"
read -t 10 -n 1 answer
echo ""

if [[ $answer == "y" || $answer == "Y" ]]; then
    echo -e "${BLUE}📜 로그를 출력합니다 (Ctrl+C로 종료)...${NC}"
    echo ""
    docker-compose logs -f
fi
