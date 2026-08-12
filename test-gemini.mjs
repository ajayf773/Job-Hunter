import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const keys = process.env.GEMINI_API_KEYS.split(',');
const genAI = new GoogleGenerativeAI(keys[0]);
const model = genAI.getGenerativeModel({
  model: 'gemini-3.5-flash-lite',
});

async function run() {
  try {
    console.log("Testing gemini-3.5-flash-lite without tools...");
    const res = await model.generateContent("Hello, world!");
    console.log("Success:", res.response.text());
  } catch (err) {
    console.error("Error without tools:", err.message);
  }

  try {
    console.log("\nTesting gemini-3.5-flash-lite WITH tools...");
    const modelWithTools = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash-lite',
      tools: [{ googleSearch: {} }]
    });
    const res2 = await modelWithTools.generateContent("Hello, world!");
    console.log("Success:", res2.response.text());
  } catch (err) {
    console.error("Error WITH tools:", err.message);
  }
}
run();
