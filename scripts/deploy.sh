#!/bin/bash
set -euo pipefail

# =============================================================================
# deploy.sh — Build, push et déclenchement du webhook Portainer
#
# Pré-requis :
#   - docker, curl installés sur le runner
#   - Un webhook activé dans Portainer pour le stack photopark
#     (Stacks > photopark > Webhooks > Enable)
#
# Usage :
#   bash scripts/deploy.sh
#
# Variables d'environnement :
#   PORTAINER_WEBHOOK_URL   — URL du webhook Portainer (requis)
#   REGISTRY                — Registry Docker (défaut: registry.local:5000)
#   IMAGE_TAG               — Tag de l'image (défaut: timestamp)
# =============================================================================

# --- Configuration -----------------------------------------------------------
REGISTRY="${REGISTRY:-registry.local:5000}"
IMAGE_NAME="photopark"
IMAGE_TAG="${IMAGE_TAG:-$(date +%Y%m%d%H%M%S)}"

# --- Couleurs ----------------------------------------------------------------
RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# --- Vérifications -----------------------------------------------------------
[ -z "${PORTAINER_WEBHOOK_URL:-}" ] && error "PORTAINER_WEBHOOK_URL is required"
command -v docker >/dev/null 2>&1   || error "docker is required"
command -v curl   >/dev/null 2>&1   || error "curl is required"

# --- Build -------------------------------------------------------------------
info "Build ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}..."
docker build -t "${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}" .
docker tag "${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}" "${REGISTRY}/${IMAGE_NAME}:latest"

# --- Push --------------------------------------------------------------------
info "Push vers le registry..."
docker push "${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
docker push "${REGISTRY}/${IMAGE_NAME}:latest"

# --- Webhook Portainer -------------------------------------------------------
info "Déclenchement du webhook Portainer..."
HTTP_CODE=$(curl -ks -o /tmp/photopark_webhook.log -w "%{http_code}" \
  -X POST "${PORTAINER_WEBHOOK_URL}")

if [ "${HTTP_CODE}" = "204" ]; then
  info "Webhook déclenché avec succès (HTTP ${HTTP_CODE})"
else
  error "Webhook échoué (HTTP ${HTTP_CODE}) : $(cat /tmp/photopark_webhook.log 2>/dev/null)"
fi

echo ""
info "══════════════════════════════════════════════════════════════"
info "  Déploiement terminé !"
info "  Image : ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
info "  Portainer va pull la nouvelle image et redéployer."
info "══════════════════════════════════════════════════════════════"
