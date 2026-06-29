#!/bin/bash
set -euo pipefail

# =============================================================================
# deploy.sh — Fallback local pour builder et redéployer via docker compose
#
# NOTE : L'approche recommandée reste Portainer > Stacks > Git.
# Ce script sert de roue de secours quand on veut redéployer localement
# depuis un checkout du repo, sans GitHub Actions, sans registry et sans webhook.
#
# Pré-requis :
#   - docker installé
#   - les variables APP_PASSWORD_HASH et SESSION_SECRET exportées
#     (ou présentes dans un fichier .env local non versionné)
#
# Usage :
#   bash scripts/deploy.sh
# =============================================================================

# --- Couleurs ----------------------------------------------------------------
RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# --- Vérifications -----------------------------------------------------------
command -v docker >/dev/null 2>&1   || error "docker is required"

# --- Préparation -------------------------------------------------------------
info "Création du volume externe si nécessaire..."
docker volume create photopark-data >/dev/null

# --- Build & deploy ----------------------------------------------------------
info "Build de l'image via docker compose..."
docker compose build || error "docker compose build a échoué"

info "Redéploiement du stack local..."
docker compose up -d || error "docker compose up -d a échoué"

echo ""
info "══════════════════════════════════════════════════════════════"
info "  Déploiement local terminé !"
info "  Le stack photopark a été rebuild et redémarré."
info "══════════════════════════════════════════════════════════════"
