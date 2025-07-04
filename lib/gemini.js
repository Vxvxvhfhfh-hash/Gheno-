import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Images d'ambiance steampunk médiévale (à placer dans le dossier /media)
const STOCK_IMAGES = [
  "media/airship.jpg",
  "media/steam_city.jpg",
  "media/gear_tavern.jpg"
];

export async function generateGeminiResponse(userPrompt = "") {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const systemPrompt = `Tu es une intelligence artificielle vivant dans un univers steampunk médiéval utopique. Réponds toujours dans le style de cet univers, avec un langage raffiné et imagé. N'hésite pas à décrire des engrenages, de la vapeur, des dirigeables, des chevaliers mécaniques et des cités d'airain.`;

  const fullPrompt = `${systemPrompt}\n\nUtilisateur : ${userPrompt}`;

  const result = await model.generateContent(fullPrompt);
  const text = result?.response?.text?.() || "Bienvenue dans notre utopie steampunk médiévale !";

  // Choix pseudo-aléatoire d'une image immersive
  const imageRelPath = STOCK_IMAGES[Math.floor(Math.random() * STOCK_IMAGES.length)];
  const imagePath = path.join("..", imageRelPath); // chemin relatif depuis server.js

  return { text, imagePath };
}