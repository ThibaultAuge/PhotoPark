# Quickstart — Déploiement PhotoPark

## Principe

Le flux recommandé utilise une image Docker prébuildée.

```text
GitHub push
  -> GitHub Actions build + test + publish sur GHCR
  -> Portainer pull l'image
  -> Portainer redéploie le stack
```

`docker-compose.portainer.yml` sert pour Portainer avec `PHOTOPARK_IMAGE`.
`docker-compose.yml` reste le compose local avec `build: .`.

Il n'existe plus de workflow `.github/workflows/deploy.yml` ni de script `scripts/deploy.sh`.
Pour un usage manuel, lancez directement `docker compose`.

## 1. Publier une image depuis GitHub Actions

Le workflow `.github/workflows/publish-image.yml` :

- se déclenche sur push vers `main` et en manuel ;
- lance `npm ci`, `npm run typecheck` et `npm run test` ;
- publie l'image sur GHCR ;
- applique une `concurrency` par ref pour éviter qu'une ancienne exécution republie `latest` après une plus récente.

Tags publiés :

- `ghcr.io/<owner>/photopark:sha-<commit>`

`latest` est aussi publié, mais uniquement sur les pushes vers `main`.

Pour la production, préférez `sha-<commit>`.
Pour une référence immuable, préférez un digest `@sha256:...`.

## 2. Préparer Portainer

Avant le premier déploiement, créez le volume Docker `photopark-data`.

- Via Portainer : **Volumes > Add volume > Name = `photopark-data`**
- Ou en CLI :

```bash
docker volume create photopark-data
```

Ajoutez ensuite le registry GHCR dans Portainer si l'image n'est pas publique.

- **Package public** : pas d'identifiant nécessaire.
- **Package privé** : configurez un compte GitHub avec accès lecture au package.

> N'utilisez pas `APP_PASSWORD_HASH` ni `SESSION_SECRET` comme identifiants registry.

## 3. Créer le stack dans Portainer

1. Aller dans **Portainer > Stacks > Add stack**
2. Coller le contenu de `docker-compose.portainer.yml` ou importer ce fichier
3. Renseigner les variables d'environnement du stack

| Variable | Valeur | Requis |
|---|---|---|
| `PHOTOPARK_IMAGE` | `ghcr.io/votre-org/photopark:sha-abcdef1` | ✅ |
| `APP_PASSWORD_HASH` | Généré via `npm run hash-password -- "mon-mot-de-passe"` | ✅ |
| `SESSION_SECRET` | Chaîne de 32+ caractères aléatoires | ✅ |
| `APP_PORT` | `8085` | ❌ |
| `NEXT_PUBLIC_APSC_CROP_FACTOR` | `1.5` | ❌ |
| `TRUST_PROXY` | `false` | ❌ |

4. Déployer le stack

## 4. Mettre à jour après un push

1. Poussez le code sur `main`
2. Attendez la fin du workflow GitHub Actions
3. Dans Portainer, forcez un pull puis redéployez le stack avec la nouvelle valeur de `PHOTOPARK_IMAGE`

Exemple :

```text
ghcr.io/votre-org/photopark:sha-abcdef1
```

`latest` reste possible, mais il est moins traçable et plus fragile pour les rollbacks.

## 5. Rollback

Remplacez `PHOTOPARK_IMAGE` par une image connue :

```text
ghcr.io/votre-org/photopark:sha-anciencommit
```

Ou mieux :

```text
ghcr.io/votre-org/photopark@sha256:...
```

## 6. Usage local avec Docker Compose

Si vous lancez l'application localement depuis le dépôt, utilisez `docker-compose.yml`.
Ce fichier est réservé au build local ou aux tests manuels, pas au flux Portainer de production.

```bash
docker volume create photopark-data
docker compose -f docker-compose.yml up -d --build
```

Si vous utilisez `docker-compose.portainer.yml` en CLI avec une image GHCR privée, connectez d'abord l'hôte à GHCR :

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u <github-user> --password-stdin
docker compose -f docker-compose.portainer.yml pull
docker compose -f docker-compose.portainer.yml up -d
```

## Vérifications

```bash
docker logs photopark
docker inspect photopark --format '{{.State.Health.Status}}'
docker run --rm -v photopark-data:/data alpine ls -la /data
```

## Fichiers de déploiement

| Fichier | Rôle |
|---|---|
| `.github/workflows/publish-image.yml` | Build, tests et publication sur GHCR |
| `docker-compose.portainer.yml` | Stack Portainer basée sur `PHOTOPARK_IMAGE` |
| `docker-compose.yml` | Compose local basé sur `build: .` |
| `README.md` | Documentation complète |
| `QUICKSTART.md` | Guide de déploiement court |
