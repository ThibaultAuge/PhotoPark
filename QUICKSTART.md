# Quickstart — PhotoPark Deployment

## Principe

Portainer clone le dépôt GitHub et build l'image lui-même via le `Dockerfile`.
Pas besoin de registry Docker, de runner GitHub Actions, ni de webhook.

```
GitHub ──push──> Portainer (clone + docker build + docker compose up -d)
```

---

## 1. Créer le stack dans Portainer

1. Aller dans **Portainer > Stacks > Add stack**
2. Onglet **Git**
3. Remplir :

   | Champ | Valeur |
   |---|---|
   | Name | `photopark` |
   | Repository URL | `https://github.com/votre-org/photopark` |
   | Compose path | `docker-compose.yml` |
   | Branch | `main` |

4. Cliquer **Deploy the stack**

> Portainer clone le repo, build l'image via le `Dockerfile`, puis lance le container.

---

## 2. Configurer les variables d'env du stack

Une fois le stack créé, aller dans **Stacks > photopark > Environment variables**.

Ajouter :

| Variable | Valeur | Requis |
|---|---|---|
| `APP_PASSWORD_HASH` | Généré via `npm run hash-password -- "mon-mot-de-passe"` | ✅ |
| `SESSION_SECRET` | Chaîne de 32+ caractères aléatoires | ✅ |
| `APP_PORT` | `8085` | ❌ (défaut) |

> `APP_PASSWORD_HASH` et `SESSION_SECRET` sont les secrets applicatifs.
> Ne les committez jamais dans le dépôt.

---

## 3. Mettre à jour après un push

### Option A : Mise à jour manuelle (recommandé)

1. Aller dans **Portainer > Stacks > photopark**
2. Cliquer **Update** → **Pull and redeploy**
3. Portainer pull le dernier code, rebuild l'image, redéploie

### Option B : Mise à jour automatique (polling)

1. Aller dans **Stacks > photopark > Git settings**
2. Activer **Auto update**
3. Définir un intervalle (ex: toutes les 5 minutes)

> ⚠️ L'auto-update n'est pas instantané. Portainer vérifie GitHub à intervalle régulier.

### Option C : Webhook GitHub → Portainer (si le serveur est accessible)

Si un jour ton serveur est accessible depuis l'extérieur, tu peux activer le **webhook Git** dans Portainer. GitHub tappe l'URL à chaque push → déploiement instantané.

---

## 4. Premier déploiement

```bash
# 1. Pousser le code sur GitHub
git push origin main

# 2. Dans Portainer, Update le stack
#    Stacks > photopark > Update > Pull and redeploy

# 3. Vérifier
curl http://portainer.local:8085
```

---

## Vérifications

```bash
# Logs du container
docker logs photopark

# Base de données persistée
docker run --rm -v photopark-data:/data alpine ls -la /data

# Health check du container
docker inspect photopark --format '{{.State.Health.Status}}'
```

---

## Sauvegarde SQLite (cron sur le serveur)

```bash
# Ajouter dans crontab
0 2 * * * docker run --rm \
  -v photopark-data:/data \
  -v /srv/backups:/backups \
  alpine tar czf /backups/photopark-$(date +\%Y\%m\%d).tar.gz -C /data .
```

---

## Fichiers de déploiement

| Fichier | Utile ? | Rôle |
|---|---|---|
| `Dockerfile` | ✅ | Build multi-stage Node 20 Alpine |
| `.dockerignore` | ✅ | Exclusion des fichiers inutiles du build |
| `docker-compose.yml` | ✅ | Stack Portainer |
| `scripts/deploy.sh` | ❌ (optionnel) | Pour déploiement manuel en CLI |
| `scripts/setup-runner.sh` | ❌ (optionnel) | Pour installer un runner GH Actions |
| `.github/workflows/deploy.yml` | ❌ (optionnel) | Workflow GitHub Actions |
| `QUICKSTART.md` | ✅ | Ce guide |
