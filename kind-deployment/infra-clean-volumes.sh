#!/usr/bin/env bash
set -euo pipefail

APP_NAMESPACE="${APP_NAMESPACE:-lirmm-services}"

log() { echo -e "\n--- $*"; }

if ! kubectl get namespace "${APP_NAMESPACE}" &> /dev/null; then
  log "Namespace ${APP_NAMESPACE} does not exist - nothing to clean."
  exit 0
fi

log "Listing PVCs in namespace ${APP_NAMESPACE}..."
PVCs=$(kubectl -n "${APP_NAMESPACE}" get pvc -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' || true)

if [ -z "${PVCs}" ]; then
  log "No PVCs found in ${APP_NAMESPACE}. Nothing to delete."
else
  log "Deleting PVCs (this will remove persistent data):"
  echo "${PVCs}"
  for pvc in ${PVCs}; do
    log "Deleting PVC: ${pvc}"
    kubectl -n "${APP_NAMESPACE}" delete pvc "${pvc}" --ignore-not-found=true || true
  done
fi

# Delete PVs that are bound to these PVCs (cleanup cluster-scoped PVs)
log "Checking for PVs claimed by namespace ${APP_NAMESPACE}..."
PVs=$(kubectl get pv -o jsonpath="{range .items[?(@.spec.claimRef.namespace=='${APP_NAMESPACE}')]}{.metadata.name}{'\n'}{end}" || true)

if [ -n "${PVs}" ]; then
  for pv in ${PVs}; do
    log "Deleting PV: ${pv}"
    kubectl delete pv "${pv}" --ignore-not-found=true || true
  done
else
  log "No PVs found that reference namespace ${APP_NAMESPACE}."
fi

log "Waiting short moment for Kubernetes to reconcile resources..."
sleep 5

log "Volume cleanup finished. If you have hostPath PVs, clean the host directories manually if needed."
