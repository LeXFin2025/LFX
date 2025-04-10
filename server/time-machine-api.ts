// POST /api/predict (LeXTime Machine)
router.post('/api/predict', upload.single('file'), async (req, res) => {
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
    console.error('Time Machine error:', err);
    res.status(500).json({ message: 'Failed to generate predictive analysis.' });
  }
});
