# Photos Lens Manager - contexte agent

## Current State
Application Next.js 15 / TypeScript (`photos-lens-manager`) pour inventorier, visualiser et comparer du matériel photo, centrée sur les objectifs.

- **Architecture multi-pages** avec navigation. Toutes les routes authentifiées sont sous le groupe `(authenticated)/`. La racine `/` redirige vers `/lenses`.
- **Routes actuelles :**
  - `/lenses` — Liste des objectifs (tableau desktop, cartes mobile, filtres, sélection/comparaison)
  - `/lenses/chart` — Graphique focale/ouverture interactif avec zoom D3.js (molette, pan tactile, bouton réinitialiser) à gauche (4/5), sidebar droite (1/5) avec filtres + liste d'objectifs filtrable. Deux contrôles par objectif : **checkbox** (cocher/décocher, visibilité sur le graphique, sans limite) et **bouton étoile** (ajouter/retirer de la comparaison, max 5). Le graphique reçoit `checkedLenses` (filtrés des `initialLenses` par `checkedIds`, pas de limite) et `selectedIds` pour le surlignage orange des objectifs en comparaison. Clic sur une ligne/cercle du graphique → `onToggleSelected` (ajoute ou retire de la comparaison). Comparaison via popup flottant + modal.
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
- Tests Vitest sur validation, utilitaires métier, parsing de libellés, dépôt SQLite, formulaire, page chart et popup comparaison (couvrant compteurs toolbar, classes checked/selected, interactions checkbox/étoile/libellé, props transmises à LensChart/LensCompareTable/LensComparePopup, formulaires modaux).

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
- `src/components/lens/LensListPage.tsx` — consomme `LensProvider`, rend filtres, tableau, cartes, `LensComparePopup`, formulaire.
- `src/components/lens/LensChartPage.tsx` — consomme `LensProvider`, rend layout horizontal flex : chart area (4/5) avec `LensChart` recevant `checkedLenses` (filtrés de `initialLenses` par `checkedIds`, état local `useState`, pas de limite) + `selectedIds` (pour surlignage orange) + `onToggleSelected` (clic sur graphique pour ajouter/retirer de la comparaison, max 5). Sidebar (1/5) avec `LensFiltersBar` + liste filtrable à deux contrôles par ligne : **checkbox** (visibilité sur le graphique, `toggleChecked`) et **bouton étoile** (comparaison, `toggleSelected` du contexte). Puis `LensComparePopup` en bas (flottant). Utilise `useMemo` pour `checkedLenses`, `selectedLenses`, `checkedSet`, `selectedSet`. Le compteur en toolbar utilise `checkedLenses.length`.
- `src/components/lens/LensChart.tsx` — Graphique SVG interactif D3.js avec navigation zoom (contre-échelle des cercles), bouton réinitialiser. Reçoit `lenses` (checkedLenses pour l'affichage), `selectedIds` (pour surlignage orange), `onToggleSelected` (clic sur ligne/cercle → ajoute ou retire de la comparaison).
- `src/components/lens/LensComparePopup.tsx` — Popup flottant (fixe en bas) quand des objectifs sont sélectionnés, avec compteur, libellés, bouton "Comparer" (ouvre une modale contenant `LensCompareTable`) et "Vider". Gère Escape, verrouillage scroll, focus management.
- `src/components/lens/*.tsx` — autres composants UI (formulaire, table, cartes, comparateur, etc.).
- `src/components/settings/BrandManager.tsx` — CRUD marques.
- `src/components/settings/MountManager.tsx` — CRUD montures avec `sensorType`.
- `src/components/settings/OptionManager.tsx` — CRUD options.
- `tests/**/*.test.ts(x)` — couverture Vitest existante.

## Usage
- **Pour tout affichage lié aux objectifs :** utiliser `useLensContext()` depuis `@/components/lens/LensProvider` pour accéder aux filtres, sélection, masquage et données. Ne pas dupliquer l'état.
- **Pour créer/modifier/supprimer un objectif :** utiliser les actions serveur dans `src/app/actions/lens-actions.ts` (`createLensAction`, `updateLensAction`, `deleteLensAction`). Elles appliquent auth, CSRF et `revalidatePath("/lenses", "layout")`.
- **Pour créer/modifier/supprimer une marque, monture ou option :** utiliser les actions correspondantes (`createBrandAction`, `updateMountAction`, `deleteOptionAction`, etc.). Ces actions `revalidatePath` la page concernée **et** `revalidatePath("/lenses", "layout")`.
- **Les pages de paramètres** (`/settings/brands`, `/settings/mounts`, `/settings/options`) chargent leurs propres données référentielles côté serveur — elles n'utilisent pas `LensProvider`.
- **Le zoom D3.js dans LensChart :** navigation zoom (pas loupe). Les traits utilisent `vectorEffect="non-scaling-stroke"` pour une épaisseur constante. Les rayons des cercles sont contre-échelonnés via la fonction `counterScaleCircles(root, k)`. Le zoom/pan est initialisé une seule fois dans un `useEffect(() => {}, [])` ; la transformation D3 est appliquée directement au DOM — aucune re-render React pendant les gestes. L'instance D3 zoom est stockée dans `zoomRef`. `counterScaleCircles` est appelée depuis le handler D3 (tous les événements de zoom) et depuis un `useLayoutEffect` qui re-synchronise en amont du rendu quand `lenses` ou `selectedIds` changent (pour éviter un flash de rayons non contre-échelonnés après un re-render React en zoom). Ne pas remplacer ce pattern par un état React.
- **Contre-échelle des cercles :** une seule constante contrôle le comportement : `MIN_CIRCLE_R` (2). La formule appliquée est `Math.max(MIN_CIRCLE_R, base / k)` avec un plancher. Les cercles restent à une taille visuelle constante à tout niveau de zoom (rayon visuel = `k × (base/k)` = **base constant**). Les cercles portent un attribut `data-base-r` contenant le rayon de base. Pour modifier le rendu du zoom, éditer le `MIN_CIRCLE_R` et/ou `base / k` dans `counterScaleCircles`.
- **Le graphique montre uniquement les objectifs cochés :** `LensChart` reçoit `checkedLenses` (filtrés depuis `initialLenses` par `checkedIds`, état local `useState` dans `LensChartPage`, pas de limite) — rien n'apparaît par défaut tant qu'au moins un objectif n'est pas coché dans la sidebar. Les filtres (`LensFiltersBar`) et `hiddenIds` n'affectent que la liste de la sidebar (pour faciliter le choix), pas le jeu d'objectifs disponibles pour la sélection. Le clic sur une ligne/cercle du graphique appelle `onToggleSelected` (ajoute ou retire de la comparaison, max 5). Les objectifs en comparaison sont surlignés en orange via `selectedIds`. La sidebar a deux contrôles par ligne : **checkbox** (`toggleChecked`, visibilité, pas de limite) et **bouton étoile** (`toggleSelected`, comparaison, max 5). Le clic sur le libellé déclenche aussi `toggleChecked`.
- **Bouton Réinitialiser :** utiliser `resetZoom()` (mémorisée via `useCallback`) pour une transition fluide de 500ms vers `d3.zoomIdentity`. Le bouton est toujours rendu, même dans l'état vide.
- Réutiliser `lens-repository.ts` pour toute lecture/écriture SQLite au lieu d'accéder directement à la base depuis les composants.
- Réutiliser `parseLensFormData` / `lensSchema` pour accepter les champs numériques du formulaire : les nombres peuvent utiliser un point ou une virgule.
- Pour créer/modifier des objectifs, fournir des IDs de référentiels (`brandId`, `mountId`, `optionIds`) ; marque, monture, capteur, options, label et équivalents APS-C sont normalisés côté dépôt.
- Pour importer un objectif depuis un libellé collé, réutiliser `parseLensLabel` avec les référentiels chargés ; pour les libellés générés/aperçus, réutiliser `generateLensLabel`. Ne pas persister de libellé libre : le serveur dérive toujours `label` depuis les champs structurés.
- Pour la comparaison : sélection de 2 à 5 objectifs via `toggleSelected` du contexte ; utiliser `LensComparePopup` (qui contient `LensCompareTable` dans sa modale).
- Pour les calculs optiques, libellés, plages focale/ouverture affichées et type `Fixe`/`Zoom`, réutiliser `src/lib/lens/lens-utils.ts` ; ne dupliquer ni le facteur APS-C, ni la génération de label, ni les règles d'affichage des plages identiques.
- Pour étendre l'app à boîtiers ou accessoires : créer les pages sous `(authenticated)/` en suivant le pattern existant (layout avec SubNav, composant manager dédié).

## Notes
- **Layout de la page chart :** `LensChartPage` utilise `.chart-page-layout` (flex horizontal), `.chart-page-main` (flex: 4) pour la zone graphique + toolbar, `.chart-page-sidebar` (flex: 1) pour les filtres + liste à cocher. La comparaison s'affiche via `LensComparePopup` (flottant fixe en bas).
- **CSS sidebar chart :** `.chart-lens-item.checked` (fond bleu pour objectifs visibles), `.chart-lens-item.checked.selected` (fond ambre quand coché ET en comparaison), `.chart-lens-compare-btn` / `.chart-lens-compare-btn.active` (bouton étoile).
- **Filtres et sidebar :** les filtres (`LensFiltersBar`) et `hiddenIds` (via `hideLens`) n'affectent que la liste de la sidebar — pas le graphique. Le graphique reçoit `initialLenses` et montre uniquement les objectifs cochés (`checkedLenses` filtré par `checkedIds`). Le clic sur une ligne/cercle du graphique appelle `onToggleSelected` (ajoute/retire comparaison). Les checkboxes de la sidebar contrôlent la visibilité sur le graphique. Les boutons étoile contrôlent la comparaison.
- L'ouverture max à focale max est optionnelle côté formulaire ; la validation remplace une valeur vide par l'ouverture max à focale min.
- `minAperture` doit rester supérieure ou égale aux ouvertures maximales, avec fallback sur l'ouverture max à focale min si celle à focale max est vide.
- `initializeSchema()` répare automatiquement `lens_option_links` si sa FK `lensId` pointe encore vers une table legacy `lenses_legacy_*` ; il faut redémarrer `npm run dev` pour déclencher cette réparation au démarrage du dépôt.
- Une migration legacy renomme l'ancienne table `lenses` en `lenses_legacy_<timestamp>` puis recrée le schéma actuel et transforme les anciennes chaînes `brand`, `mount`, `options` en référentiels.
- `LensChart.tsx` utilise des constantes module-level (`CHART_WIDTH`, `CHART_HEIGHT`, `MARGIN`, `PALETTE`, `ZOOM_SCALE_EXTENT`, `MIN_CIRCLE_R`) pour la configuration du graphique et du zoom.
- Le `useEffect` de zoom D3 nettoie ses écouteurs au démontage : `svg.on(".zoom", null)` pour l'SVG et `d3.select(window).on(".zoom", null)` pour les écouteurs gestuels au niveau fenêtre (pinch-to-zoom).
- `import React from "react"` est requis pour le transform JSX classique utilisé par Vitest (le mock de `react` dans les tests l'exige).
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
