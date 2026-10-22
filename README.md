# DTG simple

Application tablette et téléphone (iPad, iPhone, Android) pour réaliser un Diagnostic Technique Global de copropriété hors ligne, conforme au référentiel DTG 2026, avec export Word.

Tout reste sur l’appareil : pas de compte, pas de serveur.

## État actuel : étape 1

- Liste des DTG, création et suppression
- Fiche copropriété : adresse, n° dossier, année, lots, dates de visite, type de bâtiment, version du rapport (exhaustif, ancien, moderne)
- Intervenants : syndic, conseil syndical, architecte, BET, etc.
- Niveaux avec leur plan (photo, galerie ou fichier JPG/PNG)
- Export Word généré sur l’appareil, puis envoyé par le menu Partager (mail, Google Drive, OneDrive, Fichiers)

Prochaines étapes : photos localisées sur les plans, fiches par poste, projet de PPT, Word complet, sauvegarde et publication.

## Développement

```bash
npm install
npx expo start          # puis scanner le QR code avec Expo Go
npx tsc --noEmit        # vérification des types
npx expo lint
npx tsx scripts/sample-report.ts [plan.png]   # génère sample-report.docx sans appareil
```

Structure :

- `src/app/` écrans (Expo Router)
- `src/db/` base SQLite locale et migrations
- `src/export/` génération du Word (`report.ts` ne dépend pas de React Native) et partage
- `src/storage/` fichiers images par projet
