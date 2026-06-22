# Photos Lens Manager - contexte agent

## Current State
Application Next.js 15 / TypeScript (`photos-lens-manager`) pour inventorier, visualiser et comparer du matériel photo, centrée sur les objectifs.

- App Router avec page principale protégée par authentification à mot de passe unique.
- Persistance SQLite via `better-sqlite3`, fichier par défaut `./data/photos.sqlite` ou `DATABASE_PATH`.
- CRUD objectifs avec référentiels séparés pour marques, montures et options.
- Les options sont une relation N-N (`lens_option_links`) et portent `code` + `description`.
- Les montures portent le `sensorType` (`FULL_FRAME` ou `APS_C`), utilisé pour calculer l'équivalent APS-C.
- UI inventaire: filtres, tableau desktop, cartes mobile, graphique focale/ouverture, sélection et comparaison de 2 à 5 objectifs. Le tableau et les cartes affichent aussi le type d'objectif dérivé (`Fixe` si `focalMinMm === focalMaxMm`, sinon `Zoom`) et évitent de répéter les plages identiques (ex. `7.8 mm`, `f/4`).
- Le formulaire objectif propose un import/aperçu client depuis un libellé: les marques, montures, focales, ouvertures max et options reconnues sont préremplies depuis les référentiels existants, puis l'aperçu est régénéré depuis les champs structurés. Après création ou modification réussie, le formulaire se ferme automatiquement; il reste ouvert si l'action serveur échoue.
- Tests Vitest sur validation, utilitaires métier, parsing de libellés, dépôt SQLite et formulaire.

## Relevant Files
- `src/app/page.tsx` - garde session, charge objectifs + référentiels, rend `LensManager`.
- `src/app/login/page.tsx` - écran de connexion.
- `src/app/actions/auth-actions.ts` - login/logout serveur, rate limit, création session.
- `src/app/actions/lens-actions.ts` - actions serveur CRUD objectifs et référentiels.
- `src/lib/auth/*.ts` - session cookie HMAC, CSRF same-origin, rate limit, vérification mot de passe.
- `src/lib/db/lens-repository.ts` - schéma SQLite, seed référentiels, migration/repair, CRUD.
- `src/lib/lens/types.ts` - types métier objectifs/référentiels/filtres.
- `src/lib/lens/lens-utils.ts` - libellés, équivalents APS-C, formatage.
- `src/lib/lens/label-parser.ts` - parsing client des libellés collés dans le formulaire.
- `src/lib/validation/lens.ts` - parsing/validation formulaire objectif.
- `src/lib/validation/reference.ts` - validation référentiels.
- `src/components/lens/*.tsx` - UI inventaire, formulaire, référentiels, graphique, comparaison.
- `tests/**/*.test.ts(x)` - couverture Vitest existante.

## Usage
- Réutiliser `lens-repository.ts` pour toute lecture/écriture SQLite au lieu d'accéder directement à la base depuis les composants.
- Réutiliser les actions serveur dans `src/app/actions/lens-actions.ts` pour les mutations UI; elles appliquent auth, CSRF et `revalidatePath("/")`.
- Réutiliser `parseLensFormData` / `lensSchema` pour accepter les champs numériques du formulaire: les nombres peuvent utiliser un point ou une virgule.
- Pour créer/modifier des objectifs, fournir des IDs de référentiels (`brandId`, `mountId`, `optionIds`); marque, monture, capteur, options, label et équivalents APS-C sont normalisés côté dépôt.
- Pour importer un objectif depuis un libellé collé, réutiliser `parseLensLabel` avec les référentiels chargés; pour les libellés générés/aperçus, réutiliser `generateLensLabel`. Ne pas persister de libellé libre: le serveur dérive toujours `label` depuis les champs structurés.
- Pour la comparaison, conserver la règle UI actuelle: sélection de 2 à 5 objectifs (`LensManager`, `LensCompareTable`, `LensCompareTray`).
- Pour les calculs optiques, libellés, plages focale/ouverture affichées et type `Fixe`/`Zoom`, réutiliser `src/lib/lens/lens-utils.ts`; ne dupliquer ni le facteur APS-C, ni la génération de label, ni les règles d'affichage des plages identiques.

## Notes
- L'ouverture max à focale max est optionnelle côté formulaire; la validation remplace une valeur vide par l'ouverture max à focale min.
- `minAperture` doit rester supérieure ou égale aux ouvertures maximales, avec fallback sur l'ouverture max à focale min si celle à focale max est vide.
- `initializeSchema()` répare automatiquement `lens_option_links` si sa FK `lensId` pointe encore vers une table legacy `lenses_legacy_*`; il faut redémarrer `npm run dev` pour déclencher cette réparation au démarrage du dépôt.
- Une migration legacy renomme l'ancienne table `lenses` en `lenses_legacy_<timestamp>` puis recrée le schéma actuel et transforme les anciennes chaînes `brand`, `mount`, `options` en référentiels.
- Variables importantes: `SESSION_SECRET` (32 caractères minimum), `APP_PASSWORD_HASH` de préférence, fallback `APP_PASSWORD`, `DATABASE_PATH`, `TRUST_PROXY`, `NEXT_PUBLIC_APSC_CROP_FACTOR`.
- Le cookie de session s'appelle `photos_session`, est signé HMAC SHA-256 et expire après 14 jours.
- Le dépôt Git n'a pas de remote connu dans le contexte fourni. Rappel demandé: vérifier avec `git remote -v`; ajouter un remote avec `git remote add origin <url>`; préparer un commit avec `git status`, `git add <fichiers>`, `git commit -m "message"`, puis pousser avec `git push -u origin <branche>`.

## Commands
- `npm run dev` - développement Next.js; à redémarrer pour déclencher init/migration/repair SQLite.
- `npm run build` - build production.
- `npm run start` - serveur production après build.
- `npm run typecheck` - TypeScript sans émission.
- `npm run test` - suite Vitest.
- `npm run hash-password` - générer un hash PBKDF2 pour `APP_PASSWORD_HASH`.
