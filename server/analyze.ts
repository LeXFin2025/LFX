// server/analyze.ts

import pdfParse from 'pdf-parse';
import { generateContent } from './utils/gemini';
 // Adjust path if needed

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
    // Extract text from PDF
    const parsed = await pdfParse(fileBuffer);
    const extractedText = parsed.text.trim();

    // Create a prompt for Gemini
    const prompt = `You are an expert in ${category} analysis. The following document belongs to a user in ${jurisdiction}.
Analyze the document in detail and provide 5 paragraphs including risks, saving opportunities, or legal gaps:

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
      analysis: ['Analysis failed. Please try again later.'],
      recommendations: [],
      references: []
    };
  }
}
