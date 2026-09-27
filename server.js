/**
 * ScrapSetu backend
 * -------------------
 * Its one job right now: keep the Gemini API key off the frontend, and
 * turn an uploaded e-waste photo into { itemType, material, category }.
 * Also handles image uploads (scrap photos + recycler confirmation
 * photos) by forwarding them to Cloudinary and returning a URL.
 *
 * Run locally:   npm install   then   npm start   (needs a .env file, see .env.example)
 * Deploy free:   Render.com or Railway.app — see the README for steps.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
});

app.use(cors());

const GROQ_API_KEY = process.env.GROQ_API_KEY?.trim();
// Groq's current (and only) vision-capable model, per console.groq.com/docs/vision.
// Groq has renamed this a few times (llama-4-scout was retired 2026-07-17, then
// qwen3.6-27b was superseded) — if this ever breaks again with model_not_found,
// re-check that page for the current model ID.
const GROQ_MODEL = 'qwen/qwen3.8-27b';

if (!GROQ_API_KEY) {
  console.warn('⚠️  GROQ_API_KEY is not set. Add it to your .env file before starting for real.');
} else if (!GROQ_API_KEY.startsWith('gsk_')) {
  console.warn('⚠️  GROQ_API_KEY does not start with "gsk_" — double check it was copied correctly into .env.');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('⚠️  Cloudinary env vars are missing. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file before uploading images.');
}

app.get('/', (req, res) => {
  res.send('ScrapSetu backend is running.');
});

app.post('/classify', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded. Send it as multipart/form-data under the field name "image".' });
  }
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'Server is missing GROQ_API_KEY. Set it as an environment variable.' });
  }

  try {
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    const prompt = `You are looking at a photo of an item submitted for e-waste recycling.
Identify it and respond with ONLY valid JSON, no markdown fences, no extra text, in exactly this shape:
{"itemType": "<specific item name, e.g. 'Circuit board' or 'Laptop battery'>", "material": "<one of: PCB, Copper, Aluminium, Batteries, Plastic, Other>", "category": "E-Waste"}`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
            ]
          }
        ],
        temperature: 0.2,
        max_completion_tokens: 300
      })
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      console.error(`Groq API error (status ${groqRes.status}):`, JSON.stringify(data, null, 2));
      return res.status(502).json({
        error: 'Groq API request failed.',
        groqStatus: groqRes.status,
        details: data.error?.message || data
      });
    }

    const rawText = data?.choices?.[0]?.message?.content || '';
    let cleaned = rawText.replace(/```json|```/g, '').trim();

    // If the model added any preamble/explanation before or after the JSON,
    // pull out just the {...} block.
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Could not parse Groq response as JSON:', rawText);
      return res.status(502).json({ error: 'Could not parse classification result.', raw: rawText });
    }

    return res.json(parsed);
  } catch (err) {
    console.error('Classification failed:', err);
    return res.status(500).json({ error: 'Classification failed.', details: err.message });
  }
});

/**
 * Generic image upload — used by both collector.html (scrap photos)
 * and recycler-dashboard.html (confirmation photos). Takes the file,
 * pushes it to Cloudinary, and returns a public URL to store in Firestore.
 */
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded. Send it as multipart/form-data under the field name "image".' });
  }

  try {
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';
    const dataUri = `data:${mimeType};base64,${base64Image}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'scrapsetu'
    });

    return res.json({ url: result.secure_url });
  } catch (err) {
    console.error('Cloudinary upload failed:', err);
    return res.status(500).json({ error: 'Upload failed.', details: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`ScrapSetu backend listening on port ${PORT}`);
});