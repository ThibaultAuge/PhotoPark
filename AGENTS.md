# Photos Lens Manager - contexte agent

## Current State
Application Next.js 15 / TypeScript (`photos-lens-manager`) pour inventorier, visualiser et comparer du matériel photo, centrée sur les objectifs.

- **Architecture multi-pages** avec navigation. Toutes les routes authentifiées sont sous le groupe `(authenticated)/`. La racine `/` redirige vers `/lenses`.
- **Routes actuelles :**
  - `/lenses` — Liste des objectifs (tableau desktop, cartes mobile, filtres, sélection/comparaison)
  - `/lenses/chart` — Graphique focale/ouverture (filtres, sélection/comparaison)
  - `/bodies` — Page placeholder vide pour futur inventaire boîtiers
  - `/accessories` — Page placeholder vide pour futur inventaire accessoires
  - `/settings/brands` — CRUD marques
  - `/settings/mounts` — CRUD montures (avec `sensorType`)
  - `/settings/options` — CRUD options objectifs (code + description)
  - `/login` — Écran de connexion
- **Navigation :** `AppNav` (barre supérieure avec liens + bouton Déconnexion) et `SubNav` (sous-navigation réutilisable pour `/lenses` et `/settings`).
- **État partagé via LensProvider :** Contexte React (`useLensContext`) créé dans le layout `/lenses`, qui charge les données côté serveur (`listLenses()` + `listReferenceData()`). Le contexte expose : `filters`, `setFilters`, `resetFilters`, `selectedIds`, `toggleSelected`, `clearSelection`, `hiddenIds`, `hideLens`, `editingLens`, `setEditingLens`, `showCreate`, `setShowCreate`, `initialLenses`, `filteredLenses`, `referenceData`.
- **Persistance SQLite** via `better-sqlite3`, fichier par défaut `./data/photos.sqlite` ou `DATABASE_PATH`.
- **CRUD objectifs** avec référentiels séparés pour marques, montures et options.
- Les options sont une relation N-N (`lens_option_links`) et portent `code` + `description`.
- Les montures portent le `sensorType` (`FULL_FRAME` ou `APS_C`), utilisé pour calculer l'équivalent APS-C.
- **UI inventaire :** Filtres, tableau desktop, cartes mobile, graphique focale/ouverture, sélection et comparaison de 2 à 5 objectifs. Le tableau et les cartes affichent le type d'objectif dérivé (`Fixe` si `focalMinMm === focalMaxMm`, sinon `Zoom`) et évitent de répéter les plages identiques (ex. `7.8 mm`, `f/4`).
- Le formulaire objectif propose un import/aperçu client depuis un libellé : les marques, montures, focales, ouvertures max et options reconnues sont préremplies depuis les référentiels existants, puis l'aperçu est régénéré depuis les champs structurés. Après création ou modification réussie, le formulaire se ferme automatiquement ; il reste ouvert si l'action serveur échoue.
- Les pages de paramètres (marques, montures, options) chargent leurs propres données référentielles côté serveur — elles n'utilisent pas `LensProvider`.
- Tests Vitest sur validation, utilitaires métier, parsing de libellés, dépôt SQLite et formulaire.

## Relevant Files
- `src/app/page.tsx` — redirige vers `/lenses`.
- `src/app/login/page.tsx` — écran de connexion.
- `src/app/(authenticated)/layout.tsx` — vérifie `hasValidSession()`, rend `AppNav` + contenu.
- `src/app/(authenticated)/lenses/layout.tsx` — charge objectifs + référentiels côté serveur, rend `LensProvider` + `SubNav` + contenu.
- `src/app/(authenticated)/lenses/page.tsx` — rend `LensListPage`.
- `src/app/(authenticated)/lenses/chart/page.tsx` — rend `LensChartPage`.
- `src/app/(authenticated)/bodies/page.tsx` — placeholder boîtiers.
- `src/app/(authenticated)/accessories/page.tsx` — placeholder accessoires.
- `src/app/(authenticated)/settings/layout.tsx` — rend `SubNav` paramètres.
- `src/app/(authenticated)/settings/brands/page.tsx` — rend `BrandManager`.
- `src/app/(authenticated)/settings/mounts/page.tsx` — rend `MountManager`.
- `src/app/(authenticated)/settings/options/page.tsx` — rend `OptionManager`.
- `src/app/actions/auth-actions.ts` — login/logout serveur, rate limit, création session.
- `src/app/actions/lens-actions.ts` — actions serveur CRUD objectifs ET référentiels.
- `src/lib/auth/*.ts` — session cookie HMAC, CSRF same-origin, rate limit, vérification mot de passe.
- `src/lib/db/lens-repository.ts` — schéma SQLite, seed référentiels, migration/repair, CRUD.
- `src/lib/lens/types.ts` — types métier objectifs/référentiels/filtres.
- `src/lib/lens/lens-utils.ts` — libellés, équivalents APS-C, formatage.
- `src/lib/lens/label-parser.ts` — parsing client des libellés collés dans le formulaire.
- `src/lib/validation/lens.ts` — parsing/validation formulaire objectif.
- `src/lib/validation/reference.ts` — validation référentiels.
- `src/components/layout/AppNav.tsx` — barre de navigation principale avec liens + Déconnexion.
- `src/components/layout/SubNav.tsx` — sous-navigation réutilisable.
- `src/components/lens/LensProvider.tsx` — contexte React pour état partagé (filtres, sélection, masquage, formulaire) entre les pages `/lenses`.
- `src/components/lens/LensListPage.tsx` — consomme `LensProvider`, rend filtres, tableau, cartes, comparateur, formulaire.
- `src/components/lens/LensChartPage.tsx` — consomme `LensProvider`, rend filtres, graphique, comparateur, formulaire.
- `src/components/lens/*.tsx` — autres composants UI (formulaire, graphique, table, cartes, comparateur, etc.).
- `src/components/settings/BrandManager.tsx` — CRUD marques.
- `src/components/settings/MountManager.tsx` — CRUD montures avec `sensorType`.
- `src/components/settings/OptionManager.tsx` — CRUD options.
- `tests/**/*.test.ts(x)` — couverture Vitest existante.

## Usage
- **Pour tout affichage lié aux objectifs :** utiliser `useLensContext()` depuis `@/components/lens/LensProvider` pour accéder aux filtres, sélection, masquage et données. Ne pas dupliquer l'état.
- **Pour créer/modifier/supprimer un objectif :** utiliser les actions serveur dans `src/app/actions/lens-actions.ts` (`createLensAction`, `updateLensAction`, `deleteLensAction`). Elles appliquent auth, CSRF et `revalidatePath("/lenses", "layout")`.
- **Pour créer/modifier/supprimer une marque, monture ou option :** utiliser les actions correspondantes (`createBrandAction`, `updateMountAction`, `deleteOptionAction`, etc.). Ces actions `revalidatePath` la page concernée **et** `revalidatePath("/lenses", "layout")`.
- **Les pages de paramètres** (`/settings/brands`, `/settings/mounts`, `/settings/options`) chargent leurs propres données référentielles côté serveur — elles n'utilisent pas `LensProvider`.
- Réutiliser `lens-repository.ts` pour toute lecture/écriture SQLite au lieu d'accéder directement à la base depuis les composants.
- Réutiliser `parseLensFormData` / `lensSchema` pour accepter les champs numériques du formulaire : les nombres peuvent utiliser un point ou une virgule.
- Pour créer/modifier des objectifs, fournir des IDs de référentiels (`brandId`, `mountId`, `optionIds`) ; marque, monture, capteur, options, label et équivalents APS-C sont normalisés côté dépôt.
- Pour importer un objectif depuis un libellé collé, réutiliser `parseLensLabel` avec les référentiels chargés ; pour les libellés générés/aperçus, réutiliser `generateLensLabel`. Ne pas persister de libellé libre : le serveur dérive toujours `label` depuis les champs structurés.
- Pour la comparaison : sélection de 2 à 5 objectifs via `toggleSelected` du contexte ; utiliser `LensCompareTable` et `LensCompareTray`.
- Pour les calculs optiques, libellés, plages focale/ouverture affichées et type `Fixe`/`Zoom`, réutiliser `src/lib/lens/lens-utils.ts` ; ne dupliquer ni le facteur APS-C, ni la génération de label, ni les règles d'affichage des plages identiques.
- Pour étendre l'app à boîtiers ou accessoires : créer les pages sous `(authenticated)/` en suivant le pattern existant (layout avec SubNav, composant manager dédié).

## Notes
- L'ouverture max à focale max est optionnelle côté formulaire ; la validation remplace une valeur vide par l'ouverture max à focale min.
- `minAperture` doit rester supérieure ou égale aux ouvertures maximales, avec fallback sur l'ouverture max à focale min si celle à focale max est vide.
- `initializeSchema()` répare automatiquement `lens_option_links` si sa FK `lensId` pointe encore vers une table legacy `lenses_legacy_*` ; il faut redémarrer `npm run dev` pour déclencher cette réparation au démarrage du dépôt.
- Une migration legacy renomme l'ancienne table `lenses` en `lenses_legacy_<timestamp>` puis recrée le schéma actuel et transforme les anciennes chaînes `brand`, `mount`, `options` en référentiels.
- Variables importantes : `SESSION_SECRET` (32 caractères minimum), `APP_PASSWORD_HASH` de préférence, fallback `APP_PASSWORD`, `DATABASE_PATH`, `TRUST_PROXY`, `NEXT_PUBLIC_APSC_CROP_FACTOR`.
- Le cookie de session s'appelle `photos_session`, est signé HMAC SHA-256 et expire après 14 jours.
- Le dépôt Git n'a pas de remote connu dans le contexte fourni. Rappel demandé : vérifier avec `git remote -v` ; ajouter un remote avec `git remote add origin <url>` ; préparer un commit avec `git status`, `git add <fichiers>`, `git commit -m "message"`, puis pousser avec `git push -u origin <branche>`.

## Commands
- `npm run dev` — développement Next.js ; à redémarrer pour déclencher init/migration/repair SQLite.
- `npm run build` — build production.
- `npm run start` — serveur production après build.
- `npm run typecheck` — TypeScript sans émission.
- `npm run test` — suite Vitest.
- `npm run hash-password` — générer un hash PBKDF2 pour `APP_PASSWORD_HASH`.
