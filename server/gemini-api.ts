// POST /api/predict (LeXTime Machine using existing analyzeDocument)
router.post('/api/predict', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { category, jurisdiction, userId } = req.body;

    if (!file || !category || !jurisdiction || !userId) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const extractedText = (await pdfParse(file.buffer)).text.trim();

    if (!extractedText || extractedText.length < 100) {
      return res.status(400).json({ message: 'Invalid file content. Please upload a valid financial document.' });
    }

    const result = await analyzeDocument(
      extractedText,
      category,
      jurisdiction
    );

    res.status(200).json({
      success: true,
      predictions: result.lexIntuition.predictions,
      futureRisks: result.lexIntuition.risks,
      opportunities: result.lexIntuition.opportunities,
      reasoningLog: result.reasoningLog
    });
  } catch (err) {
    console.error('Time Machine error:', err);
    res.status(500).json({ message: 'Failed to generate predictive analysis.' });
  }
});
