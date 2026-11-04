#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# TVT Cloud Ecosystem — Health Check All Services
# ============================================================

BASE_URL="${API_BASE_URL:-http://localhost}"
TIMEOUT=5
PASS=0
FAIL=0

check_service() {
    local name="$1"
    local url="$2"
    local status

    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>/dev/null || echo "000")

    if [ "$status" -ge 200 ] && [ "$status" -lt 400 ]; then
        printf "  %-15s %-40s %s\n" "$name" "$url" "[OK] ($status)"
        PASS=$((PASS + 1))
    else
        printf "  %-15s %-40s %s\n" "$name" "$url" "[FAIL] ($status)"
        FAIL=$((FAIL + 1))
    fi
}

check_redis() {
    local status
    status=$(docker compose exec -T redis redis-cli ping 2>/dev/null || echo "FAIL")

    if [ "$status" = "PONG" ]; then
        printf "  %-15s %-40s %s\n" "Redis" "redis-cli ping" "[OK] (PONG)"
        PASS=$((PASS + 1))
    else
        printf "  %-15s %-40s %s\n" "Redis" "redis-cli ping" "[FAIL] ($status)"
        FAIL=$((FAIL + 1))
    fi
}

echo "============================================"
echo "  TVT Cloud Ecosystem — Health Check"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""
printf "  %-15s %-40s %s\n" "SERVICE" "ENDPOINT" "STATUS"
printf "  %-15s %-40s %s\n" "-------" "--------" "------"

check_service "Gateway" "$BASE_URL/health" &
check_service "Scanner" "$BASE_URL/scanner/health" &
check_service "Billing" "$BASE_URL/billing/health" &
check_service "Concierge" "$BASE_URL/concierge/health" &
check_service "Review" "$BASE_URL/review/health" &
wait

check_redis

echo ""
echo "--------------------------------------------"
echo "  Total: $((PASS + FAIL)) | Pass: $PASS | Fail: $FAIL"
echo "============================================"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
