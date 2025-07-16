tree -I "node_modules"

find ./kind-deployment -type f \
  ! -name "package-lock.json" \
  ! -name "docker-compose.dev" \
  ! -name "all.sh" \
  -exec sh -c '
    for f; do
      echo -e "\033[1;34m\n===== FILE: $f =====\033[0m"
      cat "$f"
    done
  ' _ {} +
