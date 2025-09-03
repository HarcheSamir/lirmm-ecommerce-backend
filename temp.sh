tree -I "node_modules"

find . -type f \
  \( \
    -path "*/api-gateway/*"  -o \
    -path "*/auth-service/*"  -o \
    -path "*/order-service/*"  -o \
    -path "*/payment-service/*"  -o \
    -path "*/product-service/*"   \
  \) \
  ! -path "*/node_modules/*" \
  ! -path "*/ai-controller/*" \
  ! -path "*/__tests__/*" \
  ! -path "*/.git/*" \
  ! -path "*/migrations/*" \
  ! -name "package-lock.json" \
  ! -name "seed.js" \
  ! -name "all.sh" \
  -exec sh -c '
    for f; do
      echo -e "\033[1;34m\n===== FILE: $f =====\033[0m"
      cat "$f"
    done
  ' _ {} +
