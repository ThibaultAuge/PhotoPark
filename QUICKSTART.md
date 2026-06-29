# Quickstart — PhotoPark Deployment

## Pré-requis

- Git, Docker, npm installés sur votre machine de dev
- Un serveur avec :
  - Docker Engine
  - Portainer (avec API HTTPS)
  - Un registry Docker local (port 5000)
- Accès Internet sortant depuis ce serveur (pour le runner GitHub)

---

## 1. Fichiers de déploiement

| Fichier | À faire |
|---|---|
| `Dockerfile` | ✅ Prêt — build multi-stage Node 20 Alpine |
| `.dockerignore` | ✅ Prêt — exclusion des fichiers inutiles |
| `docker-compose.yml` | ✅ Prêt — stack Portainer + volume SQLite |
| `scripts/deploy.sh` | ✅ Prêt — build → push → webhook (3 commandes) |
| `scripts/setup-runner.sh` | ✅ Prêt — installation du runner auto-hébergé |
| `.github/workflows/deploy.yml` | ✅ Prêt — workflow GitHub Actions |

---

## 2. Créer le stack Portainer

1. Connectez-vous à Portainer (`https://portainer.local:9443`)
2. **Stacks > Add stack**
3. Nom : `photopark`
4. Copier le contenu de `docker-compose.yml`
5. Définir les variables d'environnement du stack :

   | Variable | Valeur |
   |---|---|
   | `APP_PASSWORD_HASH` | Généré via `npm run hash-password -- "mon-mot-de-passe"` |
   | `SESSION_SECRET` | Chaîne de 32+ caractères aléatoires |
    | `REGISTRY` | `registry.local:5000` |
    | `APP_PORT` | `8085` |

6. Cliquer **Deploy the stack**
7. Vérifier que le container tourne : `curl http://portainer.local:8085`

---

## 3. Activer le webhook Portainer

1. Dans Portainer, aller sur le stack **photopark**
2. Onglet **Webhooks** → cliquer **Enable**
3. Copier l'URL générée (type : `https://portainer.local:9443/api/stacks/webhook/abc123...`)
4. Tester : `curl -X POST "URL_COPIEE"` → réponse HTTP **204**

> ⚠️ Cette URL est la clé qui permet à GitHub de déclencher le redéploiement
> sans avoir les identifiants Portainer. Gardez-la secrète.

---

## 4. Installer le runner GitHub Actions

### Option A : Docker (recommandé)

Depuis le serveur :

```bash
# 1. Aller dans GitHub > Settings > Actions > Runners > New runner
# 2. Copier le token affiché
# 3. Sur le serveur :
bash scripts/setup-runner.sh \
  --docker \
  --org "votre-organisation" \
  --repo "photopark" \
  --token "TOKEN_RECUPERE"
```

Vérifier : `docker logs github-runner` → "Runner connected"

### Option B : Installation directe sur l'hôte

```bash
bash scripts/setup-runner.sh \
  --host \
  --org "votre-organisation" \
  --repo "photopark" \
  --token "TOKEN_RECUPERE"
```

Vérifier : `sudo /opt/actions-runner/svc.sh status` → "active"

---

## 5. Configurer GitHub

1. Aller dans **GitHub > Settings > Secrets and variables > Actions**
2. Ajouter un **secret** :

   | Nom | Valeur |
   |---|---|
   | `PORTAINER_WEBHOOK_URL` | L'URL copiée à l'étape 3 |

3. Ajouter une **variable** (optionnelle) :

   | Nom | Valeur par défaut |
   |---|---|
    | `REGISTRY` | `registry.local:5000` |

4. Vérifier que le runner apparaît en ligne dans **Settings > Actions > Runners**

---

## 6. Premier déploiement

### Manuel (via GitHub)

1. Aller dans **GitHub > Actions > Deploy PhotoPark**
2. Cliquer **Run workflow** (branche `main`)
3. Suivre les logs en direct

### Manuel (via terminal sur le serveur)

```bash
export REGISTRY="registry.local:5000"
export PORTAINER_WEBHOOK_URL="https://portainer.local:9443/api/stacks/webhook/abc123..."
bash scripts/deploy.sh
```

---

## 7. Automatisation

Dès que vous pushez sur `main`, le workflow se déclenche automatiquement :

```bash
git add .
git commit -m "feat: ajout d'un objectif"
git push origin main
# → GitHub Actions build + deploy automatique
```

---

## Vérifications

```bash
# L'application répond
curl http://portainer.local:8085

# Logs du container
docker logs photopark

# Logs du runner
docker logs -f github-runner

# Base de données persistée
docker run --rm -v photopark-data:/data alpine ls -la /data
```

---

## Sauvegarde SQLite (cron)

```bash
# Ajouter dans crontab (s'exécute à 2h du matin)
0 2 * * * docker run --rm \
  -v photopark-data:/data \
  -v /srv/backups:/backups \
  alpine tar czf /backups/photopark-$(date +\%Y\%m\%d).tar.gz -C /data .
```

---

## En cas de problème

| Problème | Solution |
|---|---|
| Le runner ne se connecte pas | Le token expire après 1h → regénérer et réexécuter `setup-runner.sh` |
| Portainer webhook échoue | Vérifier que l'URL est correcte + que le stack existe |
| L'image Docker ne se build pas | Vérifier que `npm ci` passe (package-lock.json à jour) |
| La base SQLite est vide | Les données sont dans le volume `photopark-data` → les backups sont essentiels |
| Le registry n'est pas accessible | `docker login registry.local:5000` sur le runner d'abord |
