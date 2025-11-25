#!/bin/bash

# DongunCoinHub 통합 테스트 스크립트

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════╗"
echo "║  DongunCoinHub 통합 테스트            ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# 테스트 카운터
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 테스트 함수
run_test() {
    local test_name=$1
    local test_command=$2

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -e "\n${YELLOW}[TEST $TOTAL_TESTS] $test_name${NC}"

    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# 1. 환경 확인
echo -e "\n${BLUE}=== 1. 환경 확인 ===${NC}"

run_test "Docker 설치 확인" "command -v docker"
run_test "Docker Compose 설치 확인" "command -v docker-compose"
run_test "Node.js 설치 확인" "command -v node"

# 2. 프로젝트 구조 확인
echo -e "\n${BLUE}=== 2. 프로젝트 구조 ===${NC}"

run_test "backend 디렉토리 존재" "[ -d backend ]"
run_test "frontend 디렉토리 존재" "[ -d frontend ]"
run_test "blockchain 디렉토리 존재" "[ -d blockchain ]"
run_test "database 디렉토리 존재" "[ -d database ]"
run_test "docker-compose.yml 존재" "[ -f docker-compose.yml ]"
run_test "README.md 존재" "[ -f README.md ]"

# 3. 설정 파일 확인
echo -e "\n${BLUE}=== 3. 설정 파일 ===${NC}"

run_test ".env.example 존재" "[ -f .env.example ]"
run_test "database/init.sql 존재" "[ -f database/init.sql ]"

# 4. 데이터베이스 초기화 스크립트 검증
echo -e "\n${BLUE}=== 4. 데이터베이스 스크립트 ===${NC}"

run_test "init.sql에 users 테이블 정의" "grep -q 'CREATE TABLE.*users' database/init.sql"
run_test "init.sql에 coins 테이블 정의" "grep -q 'CREATE TABLE.*coins' database/init.sql"
run_test "init.sql에 nft_tokens 테이블 정의" "grep -q 'CREATE TABLE.*nft_tokens' database/init.sql"
run_test "init.sql에 초기 코인 데이터" "grep -q 'INSERT INTO coins' database/init.sql"

# 5. Docker Compose 설정 검증
echo -e "\n${BLUE}=== 5. Docker Compose 설정 ===${NC}"

run_test "postgres 서비스 정의" "grep -q 'postgres:' docker-compose.yml"
run_test "backend 서비스 정의" "grep -q 'backend:' docker-compose.yml"
run_test "frontend 서비스 정의" "grep -q 'frontend:' docker-compose.yml"

# 6. Docker 서비스 테스트 (실제 시작)
echo -e "\n${BLUE}=== 6. Docker 서비스 테스트 ===${NC}"

echo -e "${YELLOW}PostgreSQL 시작 중...${NC}"
docker-compose up -d postgres

sleep 5

run_test "PostgreSQL 컨테이너 실행 중" "docker-compose ps postgres | grep -q Up"
run_test "PostgreSQL 포트 5432 리스닝" "nc -z localhost 5432"

# 7. 데이터베이스 연결 테스트
echo -e "\n${BLUE}=== 7. 데이터베이스 연결 ===${NC}"

run_test "PostgreSQL 접속 가능" "docker-compose exec -T postgres psql -U postgres -d donguncoin_hub -c 'SELECT 1;'"
run_test "users 테이블 존재" "docker-compose exec -T postgres psql -U postgres -d donguncoin_hub -c '\d users'"
run_test "coins 테이블 존재" "docker-compose exec -T postgres psql -U postgres -d donguncoin_hub -c '\d coins'"
run_test "초기 코인 데이터 존재" "docker-compose exec -T postgres psql -U postgres -d donguncoin_hub -c 'SELECT COUNT(*) FROM coins;' | grep -q '[1-9]'"

# 8. 정리
echo -e "\n${BLUE}=== 정리 중 ===${NC}"
docker-compose down -v
echo -e "${GREEN}✓ 정리 완료${NC}"

# 결과 출력
echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}           테스트 결과 요약             ${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "전체 테스트: ${TOTAL_TESTS}"
echo -e "${GREEN}통과: ${PASSED_TESTS}${NC}"
echo -e "${RED}실패: ${FAILED_TESTS}${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

# 성공률 계산
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "\n성공률: ${SUCCESS_RATE}%"

    if [ $SUCCESS_RATE -eq 100 ]; then
        echo -e "${GREEN}🎉 모든 테스트를 통과했습니다!${NC}"
        exit 0
    elif [ $SUCCESS_RATE -ge 80 ]; then
        echo -e "${YELLOW}⚠️  일부 테스트가 실패했습니다${NC}"
        exit 1
    else
        echo -e "${RED}❌ 많은 테스트가 실패했습니다${NC}"
        exit 1
    fi
else
    echo -e "${RED}테스트가 실행되지 않았습니다${NC}"
    exit 1
fi
