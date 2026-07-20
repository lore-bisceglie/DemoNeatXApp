require("dotenv").config();
const { generateObject } = require("ai");
const { createGoogleGenerativeAI } = require("@ai-sdk/google");
const { z } = require("zod");

const STOCK_IMAGES = [
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200&auto=format&fit=crop"
];

async function test() {
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
  });

  const randomImage = STOCK_IMAGES[0];

  const { object } = await generateObject({
    model: google('gemini-2.5-flash'),
    schema: z.object({
      caption: z.string()
    }),
    messages: [
      {
        role: "user",
        content: "Scrivi un breve post ironico di prova per Instagram che dica 'Questo post è stato pubblicato da un robot per testare il nuovo Social AI Manager di NeatX'. Non mettere emoji."
      }
    ]
  });

  const captionText = object.caption;
  console.log("Caption generated:", captionText);

  const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const token = process.env.META_PERMANENT_TOKEN;

  // Step A
  const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media?image_url=${encodeURIComponent(randomImage)}&caption=${encodeURIComponent(captionText)}&access_token=${token}`, { method: "POST" });
  const mediaData = await mediaRes.json();
  
  if (mediaData.error) {
    console.error("Creation Error:", mediaData.error);
    return;
  }
  
  console.log("Container ID:", mediaData.id);
  const creationId = mediaData.id;

  // Step B
  const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish?creation_id=${creationId}&access_token=${token}`, { method: "POST" });
  const publishData = await publishRes.json();
  
  if (publishData.error) {
    console.error("Publish Error:", publishData.error);
  } else {
    console.log("Success! Published ID:", publishData.id);
  }
}

test();
