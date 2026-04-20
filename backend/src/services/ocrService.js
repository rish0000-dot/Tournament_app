// services/ocrService.js
const axios = require('axios');
const logger = require('../utils/logger');

// Google Cloud Vision OCR
const verifyScreenshot = async (imageUrl) => {
  try {
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_KEY}`,
      {
        requests: [{
          image: { source: { imageUri: imageUrl } },
          features: [{ type: 'TEXT_DETECTION', maxResults: 50 }]
        }]
      }
    );

    const text = response.data.responses[0]?.fullTextAnnotation?.text || '';

    // Parse Free Fire result screen
    const kills = extractKills(text);
    const rank = extractRank(text);
    const playerName = extractPlayerName(text);

    return { kills, rank, playerName, raw_text: text, verified: kills !== null && rank !== null };
  } catch (error) {
    logger.error('OCR error:', error.message);
    // Return null values — will go to manual review
    return { kills: null, rank: null, playerName: null, verified: false };
  }
};

const extractKills = (text) => {
  // Free Fire shows "KILLS" followed by number
  const patterns = [
    /KILLS?\s*:?\s*(\d+)/i,
    /(\d+)\s*KILLS?/i,
    /K\s*(\d+)/,
  ];
  for (const p of patterns) {
    const match = text.match(p);
    if (match) return parseInt(match[1]);
  }
  return null;
};

const extractRank = (text) => {
  const patterns = [
    /#(\d+)/,
    /RANK\s*:?\s*(\d+)/i,
    /(\d+)\s*\/\s*\d+/,
    /BOOYAH/i, // Booyah = rank 1
  ];
  if (/BOOYAH/i.test(text)) return 1;
  for (const p of patterns) {
    const match = text.match(p);
    if (match) return parseInt(match[1]);
  }
  return null;
};

const extractPlayerName = (text) => {
  // Basic name extraction — improve per FF UI
  const lines = text.split('\n');
  return lines[0]?.trim() || null;
};

module.exports = { verifyScreenshot };
