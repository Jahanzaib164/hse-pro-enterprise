#!/bin/bash
# HSE Pro Enterprise - Health Check Script
set -e

API_URL="${API_URL:-http://localhost:3001}"
FAILURES=0

echo "=== HSE Pro Enterprise Health Check ==="
echo "Time: $(date)"
echo ""

# 1. Check API
echo -n "Backend API:     "
if curl -sf "${API_URL}/health" > /dev/null 2>&1; then
  echo "✓ OK"
else
  echo "✗ FAILED"
  FAILURES=$((FAILURES+1))
fi

# 2. Check Database
echo -n "PostgreSQL:      "
if pg_isready -d "${DATABASE_URL}" > /dev/null 2>&1; then
  echo "✓ OK"
else
  echo "✗ FAILED"
  FAILURES=$((FAILURES+1))
fi

# 3. Check Redis
echo -n "Redis:           "
if redis-cli -u "${REDIS_URL:-redis://localhost:6379}" ping > /dev/null 2>&1; then
  echo "✓ OK"
else
  echo "✗ FAILED (non-critical)"
fi

echo ""
if [ $FAILURES -eq 0 ]; then
  echo "All systems operational ✓"
  exit 0
else
  echo "${FAILURES} critical system(s) failed"
  exit 1
fi
