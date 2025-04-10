import express from 'express';
import multer from 'multer';
import path from 'path';
import { analyzeDocument } from './analyze';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper function to detect unrelated content (very basic for now)
function isUnrelatedContent(text: string, category: string): boolean {
  const normalized = text.toLowerCase();

  const keywords = {
    tax: ['tax', 'form 16', 'income', '80c', 'tds', 'deduction'],
    legal: ['agreement', 'contract', 'terms', 'law', 'jurisdiction'],
    forensic: ['transaction', 'audit', 'balance sheet', 'account', 'ledger']
  };

  const categoryKeywords = keywords[category.toLowerCase()] || [];

  // If none of the keywords are present, assume it's unrelated
  return !categoryKeywords.some(keyword => normalized.includes(keyword));
}

// POST /api/upload
router.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { category, userId, jurisdiction } = req.body;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

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

    // Check if result seems invalid (basic content check)
    const combinedText = analysisResult.analysis.join(' ').toLowerCase();

    if (
      isUnrelatedContent(combinedText, category)
    ) {
      return res.status(400).json({
        message: 'Invalid file type. Please upload a relevant document.'
      });
    }

    res.status(200).json({ success: true, data: analysisResult });
  } catch (error) {
    console.error('Upload analysis error:', error);
    res.status(500).json({ message: 'Error processing file.' });
  }
});

export default router;
