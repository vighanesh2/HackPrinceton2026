# Rontzen Prototype

Prototype,
Market Insights,
SWOT insights,
Brand Kit Generator,
Pricing Model


Market Insights--> search bar (user inputs keywords) ---> our app scraps people and shows ---> user photo, name, email or linkedin link

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Explain how AI works in a few words",
  });
  console.log(response.text);
}

await main();


Le Ai for the context awareness
