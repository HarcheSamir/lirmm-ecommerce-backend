tree -I "node_modules"

find . -type f \
  \( \
    -name "docker-compose.yml" -o \
    -name "Jenkinsfile" -o \
    -name "Jenkinsfile-infrastructure" -o \
    -name "app.js" -o \
    -name "index.js" -o \
    -name "order.controller.js" -o \
    -name "review.controller.js" -o \
    -name "Dockerfile" -o \
    -path "*/kind-deployment/*" -o \
    -path "*/middlewares/*" \
  \) \
  ! -path "*/node_modules/*" \
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
