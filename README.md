# Undercover — Service spécial

Jeu de déduction sociale en français, jouable de deux façons :

- **Un seul téléphone** : l'appareil circule, chacun lit son mot en secret puis vote à son tour. Aucun serveur, aucune connexion requise.
- **En ligne** : un salon avec un code à quatre lettres, chaque joueur sur son propre téléphone. S'appuie sur Firebase (Realtime Database + connexion anonyme).

## Lancer l'application

Sans installation : ouvrez `index.html` dans un navigateur. Pour un test plus proche de la production :

```bash
node tools/serve.js
```

puis rendez-vous sur http://localhost:5173. Le site est entièrement statique : GitHub Pages, Netlify, Vercel ou Firebase Hosting conviennent tels quels.

### Déployer sur Render

Le dépôt contient un `package.json` dont le script `start` lance `tools/serve.js`, qui écoute sur le port fourni par Render (`PORT`). Dans le service Render (type **Web Service**) :

| Champ | Valeur |
| --- | --- |
| Root Directory | *(vide)* |
| Build Command | `npm install` |
| Start Command | `npm start` |

Aucune variable d'environnement n'est nécessaire : le mode en ligne repose sur Firebase, lu directement par le navigateur via `firebase-config.js`. La clé `apiKey` Firebase n'est pas un secret : elle identifie le projet, et ce sont les règles de `database.rules.json` qui protègent les données. Elle peut donc être commise dans le dépôt.

### Déployer sur Firebase Hosting (recommandé)

Le dépôt contient déjà `firebase.json` et `.firebaserc` (projet `under-cover-fcdc6`). Seuls les 11 fichiers du site sont envoyés : `index.html`, `firebase-config.js`, `css/` et `js/`.

```bash
npx firebase-tools login
```

```bash
npx firebase-tools deploy --only hosting
```

Le site sort sur `https://under-cover-fcdc6.web.app`, domaine déjà autorisé par défaut dans Authentication, donc rien à configurer côté connexion anonyme.

`firebase deploy` sans `--only hosting` publie **aussi** les règles de `database.rules.json`. Utile pour versionner les règles, mais cela écrase ce qui est dans la console : ne le faites que si le fichier du dépôt est bien la version de référence.

Comparé à Render : pas de mise en veille (donc pas d'attente de 30 à 60 secondes au premier chargement), diffusion par CDN, même console que la base. En contrepartie, le déploiement n'est pas automatique à chaque `git push` ; `npx firebase-tools init hosting:github` met en place une action GitHub qui s'en charge.

### Faut-il MongoDB ?

Non. Toutes les données de jeu (salons, joueurs, parties, scores, historique) sont stockées dans la Realtime Database de Firebase, qui sert aussi de canal temps réel entre les téléphones. Un serveur Node ne fait ici que distribuer les fichiers statiques. Une base MongoDB ne serait utile que si le mode en ligne était réécrit autour d'un serveur Socket.io, ce qui n'est pas le cas.

## Activer le mode en ligne (Firebase)

1. Créez un projet sur https://console.firebase.google.com.
2. **Authentication → Sign-in method** : activez **Anonymous**.
3. **Realtime Database** : créez une base (région au choix), puis collez le contenu de `database.rules.json` dans l'onglet **Règles** et publiez.
4. **Paramètres du projet → Vos applications → Web** : créez une application et copiez l'objet de configuration dans `firebase-config.js`.
5. Si vous hébergez le site sur un domaine, ajoutez-le dans **Authentication → Settings → Authorized domains**.

Tant que `apiKey` vaut `REMPLACER_MOI`, les boutons « Créer un salon » et « Rejoindre » restent désactivés et le mode local fonctionne normalement.

### Ce que garantissent les règles

- Chaque joueur ne peut lire que **sa** carte (`private/{uid}`).
- Seul l'hôte lit l'état complet (`full`) et écrit l'état public (`game`), les scores et l'historique.
- Les joueurs n'écrivent que leurs propres actions (`actions/*`) et leur propre présence (`members/{uid}`).
- Si l'hôte se déconnecte plus de cinq secondes, le joueur connecté le plus ancien reprend la main automatiquement.

## Règles implémentées

- 3 joueurs minimum, 20 maximum. Civils, Undercover (1 à N) et Mr White (0 à N) ; les civils doivent rester majoritaires.
- Tour de description dans l'ordre affiché, avec minuteur optionnel (0 à 180 s). Le mot secret ne peut pas apparaître dans une description.
- Premier vote au choix : dès le premier tour de description, ou seulement après deux tours. Ensuite, on vote après chaque tour.
- Carte secrète à bouton : « Voir mon mot » affiche le mot, « Cacher et passer » le masque avant de passer le téléphone (ou de se déclarer prêt en ligne).
- Vote secret, un vote par joueur (un second vote remplace le premier). Le vote se clôt quand tout le monde a voté ; en ligne, l'hôte peut le clore sans attendre les absents.
- Égalité : au choix « second vote entre ex æquo, puis personne n'est éliminé » ou « personne n'est éliminé ».
- Mr White éliminé propose un mot : s'il trouve celui des civils, les intrus gagnent aussitôt (désactivable).
- Victoire des civils quand tous les intrus sont éliminés ; victoire des intrus à parité (ou en majorité stricte, selon le réglage).
- Joueur qui quitte : retiré de la partie, ses votes annulés, son tour passé ; la partie s'arrête s'il reste moins de trois joueurs.
- Reconnexion : en local, la partie en cours est sauvegardée sur l'appareil ; en ligne, l'identité anonyme et le code du salon sont conservés, l'écran d'accueil propose de rejoindre.

## Structure

| Fichier | Rôle |
| --- | --- |
| `index.html` | Tous les écrans (accueil, configuration, salon, cartes, partie, fin, paramètres) |
| `css/style.css` | Thème sombre/clair, mise en page mobile et bureau (deux colonnes à partir de 960 px) |
| `js/words.js` | **Banque de mots** : 472 paires « Tout public » étiquetées par niveau, 19 séries d'anime, 169 duos croisés, 4 thèmes |
| `js/wordbank.js` | Tirage d'une paire selon la sélection et la difficulté |
| `js/engine.js` | Moteur de jeu pur (rôles, tours, votes, égalités, Mr White, victoire, départs) |
| `js/ui.js` | Rendu partagé des écrans de partie |
| `js/local.js` | Contrôleur « un seul téléphone » |
| `js/online.js` | Contrôleur Firebase (salon, présence, migration d'hôte, file d'actions) |
| `js/app.js` | Accueil, configuration, paramètres, câblage des boutons |
| `js/store.js` | Accès à localStorage |
| `firebase-config.js` | Clés Firebase (à remplir) |
| `database.rules.json` | Règles de sécurité de la Realtime Database |
| `tests/engine.test.js` | Tests du moteur |
| `tools/serve.js` | Serveur statique minimal (utilisé par Render via `npm start`) |
| `tools/mock-firebase.js` | Faux Firebase en mémoire pour tester le mode en ligne sans clés |
| `legacy/service-special.html` | Version d'origine, conservée pour référence |

## Ajouter des mots

Modifiez `js/words.js`. Dans n'importe quel groupe (thème, anime ou duo croisé), une paire s'écrit `["Mot A","Mot B"]` ou `["Mot A","Mot B", niveau]` avec un niveau de 1 (facile) à 3 (hardcore). Un duo étiqueté ne sort qu'à son niveau ; un duo sans niveau sort à tous les niveaux. Pour un duo croisé, le niveau est le cinquième élément : `["Nom A","Série A","Nom B","Série B", 3]`.

## Tests

```bash
node --test tests/engine.test.js
```
