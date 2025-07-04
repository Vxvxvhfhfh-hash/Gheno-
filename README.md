# 🤖 Bot WhatsApp Steampunk Utopique

Ce projet met en place un bot **WhatsApp Web.js** contrôlé par **Gemini IA**. Le QR-Code nécessaire à la connexion WhatsApp s'affiche en temps réel sur un site statique que vous pouvez déployer sur **Vercel**.

## Pré-requis

- Node.js 18+
- Un compte Google Cloud avec **Gemini API** activée
- Un compte Vercel (facultatif pour un déploiement local)

## Installation

```bash
# Clone
git clone <repo>
cd whatsapp-gemini-steampunk-bot

# Dépendances
npm install

# Variables d'environnement
cp .env.example .env
# ↪️ Ajoutez votre clé GEMINI_API_KEY dans le .env
```

## Lancement en local

```bash
npm run dev
```

Ouvrez ensuite `http://localhost:3000` pour scanner le QR-Code.

## Utilisation

Dans WhatsApp, envoyez :

```
!ai Ton message ici
```

Le bot répondra avec un texte *steampunk médiéval* et une image immersive choisie aléatoirement dans le dossier `media/`.

## Déploiement sur Vercel

1. Poussez ce dépôt sur GitHub.
2. Connectez-vous à Vercel et créez un nouveau projet depuis ce repo.
3. Ajoutez votre variable **GEMINI_API_KEY** dans *Project Settings → Environment Variables*.
4. Déployez 🎉.

Le site affichera automatiquement le QR-Code quand le bot démarrera.

## Personnalisation

- Ajoutez vos propres images dans le dossier `media/`.
- Modifiez le prompt dans `lib/gemini.js` pour changer le style ou la tonalité.

---

© 2024 – Steampunk Utopia