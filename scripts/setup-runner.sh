#!/bin/bash
set -euo pipefail

# =============================================================================
# setup-runner.sh — Installation du GitHub Actions self-hosted runner
#
# Ce script propose deux modes :
#   1. Docker container (RECOMMANDÉ) — Le runner tourne dans un container,
#      gérable depuis Portainer. C'est l'approche la plus propre.
#
#   2. Installation directe sur l'hôte — Le runner est installé en tant que
#      service systemd sur le serveur.
#
# Pré-requis :
#   - Accès Internet sortant (le runner "pull" depuis GitHub)
#   - Docker installé sur le serveur
#   - Un token d'enregistrement depuis GitHub :
#     Settings > Actions > Runners > New self-hosted runner
#
# Usage :
#   # Mode 1 : Docker (RECOMMANDÉ)
#   bash scripts/setup-runner.sh --docker --org "votre-org" --repo "photopark" --token "xxx"
#
#   # Mode 2 : Installation directe
#   bash scripts/setup-runner.sh --host --org "votre-org" --repo "photopark" --token "xxx"
#
#   # Afficher l'aide
#   bash scripts/setup-runner.sh --help
# =============================================================================

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# --- Parse arguments ---------------------------------------------------------
MODE=""
ORG=""
REPO=""
TOKEN=""
RUNNER_NAME="portainer-runner"

usage() {
  echo "Usage: $0 [--docker|--host] --org <org> --repo <repo> --token <token> [--name <name>]"
  echo ""
  echo "  --docker         Installer le runner dans un container Docker (RECOMMANDÉ)"
  echo "  --host           Installer le runner directement sur l'hôte (service systemd)"
  echo "  --org <org>      Organisation GitHub (ex: 'votre-org')"
  echo "  --repo <repo>    Nom du dépôt GitHub (ex: 'photopark')"
  echo "  --token <token>  Token d'enregistrement du runner"
  echo "  --name <name>    Nom du runner (défaut: portainer-runner)"
  echo "  --help           Affiche cette aide"
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --docker) MODE="docker"; shift ;;
    --host)   MODE="host";   shift ;;
    --org)    ORG="$2";  shift 2 ;;
    --repo)   REPO="$2"; shift 2 ;;
    --token)  TOKEN="$2"; shift 2 ;;
    --name)   RUNNER_NAME="$2"; shift 2 ;;
    --help)   usage ;;
    *) error "Argument inconnu: $1. Utilisez --help pour l'aide." ;;
  esac
done

# --- Vérifications -----------------------------------------------------------
[ -z "$MODE" ]  && error "Indiquez --docker ou --host"
[ -z "$ORG" ]   && error "--org est requis"
[ -z "$REPO" ]  && error "--repo est requis"
[ -z "$TOKEN" ] && error "--token est requis"

# =============================================================================
# MODE 1 — Docker container (RECOMMANDÉ)
# =============================================================================
if [ "$MODE" = "docker" ]; then
  command -v docker >/dev/null 2>&1 || error "Docker n'est pas installé"

  info "Mode Docker container sélectionné"
  info "Organisation : ${ORG}"
  info "Dépôt : ${REPO}"
  info "Nom du runner : ${RUNNER_NAME}"

  # Pull de l'image officielle du runner
  info "Téléchargement de l'image myoung34/github-runner:latest..."
  docker pull myoung34/github-runner:latest

  # Arrêt et suppression d'un éventuel container existant
  docker rm -f github-runner 2>/dev/null || true

  # Lancement du runner
  info "Lancement du runner GitHub Actions..."
  docker run -d \
    --name github-runner \
    --restart unless-stopped \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v github-runner-tmp:/tmp \
    -e RUNNER_NAME="${RUNNER_NAME}" \
    -e RUNNER_REPO_URL="https://github.com/${ORG}/${REPO}" \
    -e RUNNER_TOKEN="${TOKEN}" \
    -e RUNNER_LABELS="self-hosted,linux,portainer,docker" \
    -e RUNNER_WORK_DIRECTORY="/_work" \
    -e RUNNER_GROUP="default" \
    -e EPHEMERAL="false" \
    myoung34/github-runner:latest

  echo ""
  info "══════════════════════════════════════════════════════════════"
  info "  Runner GitHub Actions installé avec succès !"
  info "  Nom     : ${RUNNER_NAME}"
  info "  Dépôt   : ${ORG}/${REPO}"
  info ""
  info "  Commandes utiles :"
  info "  - Logs : docker logs -f github-runner"
  info "  - Arrêt: docker stop github-runner"
  info "  - Suppr: docker rm -f github-runner"
  info ""
  info "  Le runner est automatiquement redémarré par Docker."
  info "  Pour le gérer depuis Portainer, ajouter le container"
  info "  github-runner dans l'interface Portainer."
  info "══════════════════════════════════════════════════════════════"

  # Option : créer un docker-compose pour Portainer
  echo ""
  warn "Alternative : tu peux aussi déployer ce runner via Portainer"
  warn "en utilisant le fichier docker-compose.runner.yml généré :"

  # Générer docker-compose.runner.yml
  cat > docker-compose.runner.yml << RUNNERCOMPOSE
version: '3.8'

services:
  github-runner:
    image: myoung34/github-runner:latest
    container_name: github-runner
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - github-runner-tmp:/tmp
    environment:
      - RUNNER_NAME=${RUNNER_NAME}
      - RUNNER_REPO_URL=https://github.com/${ORG}/${REPO}
      - RUNNER_TOKEN=${TOKEN}
      - RUNNER_LABELS=self-hosted,linux,portainer,docker
      - RUNNER_WORK_DIRECTORY=/_work
      - RUNNER_GROUP=default
      - EPHEMERAL=false

volumes:
  github-runner-tmp:
RUNNERCOMPOSE

  info "Fichier généré : docker-compose.runner.yml"
  info "Importe-le dans Portainer > Stacks > Add stack > Upload"
  info "(Attention : le token expire après 1h, régénère-le si nécessaire)"

fi

# =============================================================================
# MODE 2 — Installation directe sur l'hôte (système)
# =============================================================================
if [ "$MODE" = "host" ]; then
  info "Mode installation directe sur l'hôte sélectionné"

  # Détection du gestionnaire de paquets
  if command -v apt-get &>/dev/null; then
    PKG_MANAGER="apt-get"
  elif command -v yum &>/dev/null; then
    PKG_MANAGER="yum"
  elif command -v apk &>/dev/null; then
    PKG_MANAGER="apk"
  else
    error "Gestionnaire de paquets non supporté (apt/yum/apk)"
  fi

  # Installation des dépendances (jq nécessaire pour la version API)
  info "Installation des dépendances (${PKG_MANAGER})..."
  case "$PKG_MANAGER" in
    apt-get)
      sudo apt-get update
      sudo apt-get install -y curl jq
      ;;
    yum)
      sudo yum install -y curl jq
      ;;
    apk)
      sudo apk add --no-cache curl jq
      ;;
  esac

  # Récupération de la dernière version du runner
  RUNNER_VERSION=$(curl -s https://api.github.com/repos/actions/runner/releases/latest \
    | jq -r '.tag_name' \
    | sed 's/^v//')

  [ -z "$RUNNER_VERSION" ] && RUNNER_VERSION="2.322.0"

  RUNNER_DIR="/opt/actions-runner"

  info "Téléchargement de GitHub Actions Runner v${RUNNER_VERSION}..."
  sudo mkdir -p "$RUNNER_DIR"

  curl -o "/tmp/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz" -L \
    "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"

  sudo tar xzf "/tmp/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz" -C "$RUNNER_DIR"
  rm "/tmp/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"

  # Création de l'utilisateur runner
  info "Création de l'utilisateur github-runner..."
  sudo useradd -m -d "$RUNNER_DIR" -s /bin/bash github-runner 2>/dev/null || true
  sudo chown -R github-runner:github-runner "$RUNNER_DIR"

  # Configuration du runner
  info "Configuration du runner..."
  cd "$RUNNER_DIR"
  sudo -u github-runner ./config.sh \
    --url "https://github.com/${ORG}/${REPO}" \
    --token "$TOKEN" \
    --name "$RUNNER_NAME" \
    --labels "self-hosted,linux,portainer" \
    --replace \
    --unattended

  # Installation du service systemd
  info "Installation du service systemd..."
  sudo ./svc.sh install github-runner
  sudo ./svc.sh start

  echo ""
  info "══════════════════════════════════════════════════════════════"
  info "  Runner installé sur l'hôte avec succès !"
  info "  Nom     : ${RUNNER_NAME}"
  info "  Dépôt   : ${ORG}/${REPO}"
  info "  Répertoire : ${RUNNER_DIR}"
  info ""
  info "  Commandes utiles :"
  info "  - Statut : sudo ${RUNNER_DIR}/svc.sh status"
  info "  - Logs   : sudo ${RUNNER_DIR}/svc.sh logs"
  info "  - Arrêt  : sudo ${RUNNER_DIR}/svc.sh stop"
  info "  - Start  : sudo ${RUNNER_DIR}/svc.sh start"
  info "══════════════════════════════════════════════════════════════"
fi
