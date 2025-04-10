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

    const prompt = `You are a professional AI system analyzing a ${category} document. 
Provide 5 paragraphs of detailed analysis with risks, savings, or legal gaps, based on Indian regulations and ${jurisdiction} compliance:

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
    console.error('❌ Error analyzing document:', error);
    return {
      analysis: ['Analysis failed due to internal error.'],
      recommendations: [],
      references: []
    };
  }
}
