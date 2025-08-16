tree -I "node_modules"

find . -type f \
  \( \
    -name "docker-compose.yml" -o \
    -path "*/api-gateway/*"  -o \
    -path "*/auth-service/*"  -o \
    -path "*/product-service/*"  -o \
    -path "*/order-service/*"  -o \
    -path "*/notification-service/*"  -o \
    -path "*/stats-service/*"  -o \
    -path "*/search-service/*"   \
  \) \
  ! -path "*/node_modules/*" \
  ! -path "*/ai-controller/*" \
  ! -path "*/__tests__/*" \
  ! -path "*/.git/*" \
  ! -path "*/migrations/*" \
  ! -name "package-lock.json" \
  ! -name "all.sh" \
  -exec sh -c '
    for f; do
      echo -e "\033[1;34m\n===== FILE: $f =====\033[0m"
      cat "$f"
    done
  ' _ {} +
