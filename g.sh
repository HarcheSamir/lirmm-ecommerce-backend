tree -I "node_modules"

find . -type f \
  \( \
    -name "Jenkinsfile" -o \
    -name "Jenkinsfile-infrastructure" -o \
    -path "*/kind-deployment/*" \
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
