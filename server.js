// server.js
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
import qrcode from "qrcode";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { generateGeminiResponse } from "./lib/gemini.js";

// Chargement des variables d'environnement
dotenv.config();

// Résolution du __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Mise en place du serveur HTTP & Socket.IO ---
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Servir les fichiers statiques (public/index.html, etc.)
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --- Initialisation du client WhatsApp ---
const waClient = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  }
});

waClient.on("qr", async (qr) => {
  // Convertir le QR brut en Data-URL pour le front-end
  const qrDataUrl = await qrcode.toDataURL(qr);
  io.emit("qr", qrDataUrl);
  console.log("QR Code généré et envoyé au front-end");
});

waClient.on("ready", () => {
  console.log("✅ Client WhatsApp prêt !");
  io.emit("ready");
});

waClient.on("authenticated", () => {
  console.log("🔒 Authentifié sur WhatsApp.");
});

waClient.on("auth_failure", (msg) => {
  console.error("❌ Échec d'authentification :", msg);
});

// --- Gestion des messages entrants ---
waClient.on("message", async (message) => {
  try {
    // Préfixe pour demander l'IA
    if (message.body.startsWith("!ai")) {
      const userPrompt = message.body.replace("!ai", "").trim();
      const { text: aiText, imagePath } = await generateGeminiResponse(userPrompt);

      // Envoi du texte généré
      await message.reply(aiText);

      // Envoi d'une image thématique, si disponible
      if (imagePath) {
        const media = MessageMedia.fromFilePath(path.join(__dirname, imagePath));
        await waClient.sendMessage(message.from, media);
      }
    }
  } catch (err) {
    console.error("Erreur lors du traitement du message :", err);
  }
});

// --- Démarrage du serveur HTTP ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌐 Serveur web lancé sur http://localhost:${PORT}`);
  // Initialisation du client WhatsApp APRES que le serveur soit opérationnel.
  waClient.initialize();
});