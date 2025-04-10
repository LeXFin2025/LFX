import express, { Request, Response } from 'express';
import multer from 'multer';
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

// 📥 POST /api/upload — Analyze Tax/Legal/Forensic Docs
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { category, userId, jurisdiction } = req.body;

    if (!file || !category || !userId || !jurisdiction) {
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
      return res.status(400).json({
        message: '❌ Invalid file type. Please upload a document related to the selected category.'
      });
    }

    res.status(200).json({ success: true, data: analysisResult });
  } catch (error) {
    console.error('❌ /api/upload error:', error);
    res.status(500).json({ message: 'Internal server error while analyzing the document.' });
  }
});

// 🧠 POST /api/predict — LeXTime Machine (12–18 Month Forecast)
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
      return res.status(400).json({
        message: '❌ Document too short or empty. Please upload a valid financial/legal file.'
      });
    }

    const prompt = `You are LeXTime Machine — an AI engine for forecasting risks and savings.

Based on this document and trends in ${jurisdiction}, provide 3–5 clear future insights for the next 12–18 months.
Include:
- Predicted events
- Risk level (Low/Medium/High)
- Estimated financial/legal impact

Here is the document:
"""
${extractedText}
"""`;

    const geminiResponse = await generateContent(prompt);

    res.status(200).json({
      success: true,
      predictions: geminiResponse
    });
  } catch (err) {
    console.error('❌ /api/predict error:', err);
    res.status(500).json({ message: 'Prediction failed. Please try again.' });
  }
});

// 🔗 Register routes into app
export async function registerRoutes(app: express.Express) {
  app.use('/api', router);
}
