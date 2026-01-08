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


Leta Ai for the context awareness


UI for the SWOT analysis inspiration
<img width="1726" height="877" alt="Screenshot 2026-01-08 at 8 59 06 PM" src="https://github.com/user-attachments/assets/cc73bafd-98ec-4225-b974-c95745e29db2" />
