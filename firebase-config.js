/* =====================================================================
   CONFIGURATION FIREBASE — mode en ligne
   =====================================================================
   1. Créez un projet sur https://console.firebase.google.com
   2. Ajoutez une application Web et copiez ici l'objet de configuration.
   3. Activez « Authentication → Sign-in method → Anonymous ».
   4. Créez une « Realtime Database » et collez le contenu de
      database.rules.json dans l'onglet « Règles ».
   Tant que apiKey vaut "REMPLACER_MOI", le mode en ligne reste désactivé
   et l'application fonctionne uniquement sur un seul téléphone.
   ===================================================================== */
window.FIREBASE_CONFIG = {
  apiKey: "REMPLACER_MOI",
  authDomain: "votre-projet.firebaseapp.com",
  databaseURL: "https://votre-projet-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "votre-projet",
  appId: "1:000000000000:web:0000000000000000000000"
};
