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
import fs from "fs";

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

app.use(express.json({ limit: "5mb" }));

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
    io.emit("wa-message", { from: message.from, body: message.body });
    // Préfixe pour demander l'IA
    if (message.body.startsWith("!ai")) {
      const userPrompt = message.body.replace("!ai", "").trim();
      const { text: aiText, imagePath } = await generateGeminiResponse(userPrompt);

      // Envoi du texte généré
      await message.reply(aiText);
      io.emit("wa-message", { from: "bot", body: aiText });

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

// --- Endpoints API ---
app.post("/api/ai", async (req, res) => {
  const { prompt = "" } = req.body || {};
  if (!prompt.trim()) {
    return res.status(400).json({ error: "Prompt requis" });
  }
  try {
    const { text, imagePath } = await generateGeminiResponse(prompt);
    let imageBase64 = null;
    if (imagePath) {
      const abs = path.join(__dirname, imagePath);
      const buff = fs.readFileSync(abs);
      const mime = path.extname(abs) === ".png" ? "image/png" : "image/jpeg";
      imageBase64 = `data:${mime};base64,${buff.toString("base64")}`;
    }
    res.json({ text, image: imageBase64 });
  } catch (err) {
    console.error("/api/ai error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/api/send", async (req, res) => {
  const { to = "", text = "" } = req.body || {};
  if (!to || !text) {
    return res.status(400).json({ error: "Champ 'to' et 'text' requis" });
  }
  try {
    await waClient.sendMessage(to, text);
    res.json({ status: "sent" });
  } catch (err) {
    console.error("/api/send error:", err);
    res.status(500).json({ error: "Envoi échoué" });
  }
});

// --- Démarrage du serveur HTTP ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌐 Serveur web lancé sur http://localhost:${PORT}`);
  // Initialisation du client WhatsApp APRES que le serveur soit opérationnel.
  waClient.initialize();
});