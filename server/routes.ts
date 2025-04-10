import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import pdfParse from 'pdf-parse';
import { analyzeDocument } from './analyze';
import { generateContent } from './utils/gemini';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

function isUnrelatedContent(text: string, category: string): boolean {
  const normalized = text.toLowerCase();
  const keywords = {
    tax: ['tax', 'form 16', 'income', '80c', 'tds', 'deduction'],
    legal: ['agreement', 'contract', 'terms', 'law', 'jurisdiction'],
    forensic: ['transaction', 'audit', 'balance sheet', 'account', 'ledger']
  };
  const categoryKeywords = keywords[category.toLowerCase()] || [];
  return !categoryKeywords.some(keyword => normalized.includes(keyword));
}

// POST /api/upload
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { category, userId, jurisdiction } = req.body;

    if (!file) return res.status(400).json({ message: 'No file uploaded.' });
    if (!category || !userId || !jurisdiction) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const analysisResult = await analyzeDocument(
      file.buffer,
      file.originalname,
      category,
      userId,
      jurisdiction
    );

    const combinedText = analysisResult.analysis.join(' ').toLowerCase();
    if (isUnrelatedContent(combinedText, category)) {
      return res.status(400).json({ message: 'Invalid file type. Please upload a relevant document.' });
    }

    res.status(200).json({ success: true, data: analysisResult });
  } catch (error) {
    console.error('❌ Upload analysis error:', error);
    res.status(500).json({ message: 'Error processing file.' });
  }
});

// POST /api/predict (LeXTime Machine)
router.post('/predict', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { category, jurisdiction } = req.body;

    if (!file || !category || !jurisdiction) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const parsed = await pdfParse(file.buffer);
    const extractedText = parsed.text.trim();

    if (!extractedText || extractedText.length < 100) {
      return res.status(400).json({ message: 'Invalid file content. Please upload a valid financial document.' });
    }

    const prompt = `You are a financial AI engine. Based on the following document and trends in the ${jurisdiction} region, predict the user’s likely financial or legal risks and opportunities in the next 12–18 months:

"""
${extractedText}
"""

Provide 3–5 future insights with timeframe, risk level, and potential impact.`;

    const geminiResponse = await generateContent(prompt);

    res.status(200).json({
      success: true,
      predictions: geminiResponse
    });
  } catch (err) {
    console.error('❌ Time Machine error:', err);
    res.status(500).json({ message: 'Failed to generate predictive analysis.' });
  }
});

// 🔁 Register route handler for index.ts
export async function registerRoutes(app: express.Express) {
  app.use('/api', router);
}
