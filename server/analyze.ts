import pdfParse from 'pdf-parse';
import { generateContent } from './utils/gemini';

interface AnalysisResult {
  analysis: string[];
  recommendations: string[];
  references: string[];
}

export async function analyzeDocument(
  fileBuffer: Buffer,
  filename: string,
  category: string,
  userId: string,
  jurisdiction: string
): Promise<AnalysisResult> {
  try {
    const parsed = await pdfParse(fileBuffer);
    const extractedText = parsed.text.trim();

    if (!extractedText || extractedText.length < 100) {
      return {
        analysis: ['⚠️ Document is too short or empty. Please upload a valid financial or legal document.'],
        recommendations: [],
        references: []
      };
    }

    const prompt = `You are a professional AI assistant for financial and legal analysis.

A user from ${jurisdiction} has uploaded a document related to the category: ${category}.
Please analyze the document content and give a detailed report of 5 paragraphs covering the following:
- Key issues or risks
- Loopholes or saving opportunities (if any)
- Applicable laws or regulations
- Actionable recommendations
- Estimated potential savings or exposures (if possible)

Here is the document content:
"""
${extractedText}
"""`;

    const geminiResponse = await generateContent(prompt);

    return {
      analysis: [geminiResponse],
      recommendations: [],
      references: []
    };
  } catch (error) {
    console.error('❌ Error in analyzeDocument:', error);
    return {
      analysis: ['❌ AI failed to analyze the file. Please try again or check the format.'],
      recommendations: [],
      references: []
    };
  }
}
