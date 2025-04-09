import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type GenerateResponseOptions = {
  userMessage: string;
  chatHistory?: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  systemPrompt?: string;
  jurisdiction?: string;
};

/**
 * Generate a response from the Gemini API
 */
export async function generateResponse(options: GenerateResponseOptions): Promise<string> {
  const { userMessage, chatHistory = [], systemPrompt, jurisdiction = 'USA' } = options;

  try {
    // Create a conversation model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Prepare chat history in the format expected by Gemini
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));
    
    // Start a chat session
    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    // Add system prompt if provided
    const defaultPrompt = `You are LeXAssist, an AI legal and financial advisor specializing in ${jurisdiction} jurisdiction.
Your purpose is to help users with legal and financial questions by providing helpful, accurate information.
Always be professional, clear, and concise in your responses.
When you don't know something, be transparent about your limitations and suggest alternative resources.
When discussing legal matters, reference specific laws or regulations when applicable.
When discussing financial matters, explain the reasoning behind your suggestions.
Remember that all information needs to be jurisdiction-appropriate for ${jurisdiction}.`;

    const finalSystemPrompt = systemPrompt || defaultPrompt;
    
    // Generate the response
    const result = await chat.sendMessage(finalSystemPrompt + "\n\nUser question: " + userMessage);
    const response = result.response;
    
    return response.text();
  } catch (error) {
    console.error('Error generating response from Gemini API:', error);
    throw new Error('Failed to generate a response. Please try again later.');
  }
}

/**
 * Analyze a document using Gemini API
 */
export async function analyzeDocument(documentText: string, documentType: string, jurisdiction: string): Promise<{
  analysis: string;
  risks: string[];
  recommendations: string[];
}> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
You are LeXIntuition, an AI-powered legal and financial analysis engine specialized in ${jurisdiction} jurisdiction.

Analyze the following ${documentType} document text:

"""
${documentText}
"""

Provide a comprehensive analysis including:
1. A summary of the document's purpose and key terms
2. Legal implications and potential risks
3. Financial implications
4. Compliance considerations specific to ${jurisdiction}
5. Recommendations for improving the document or addressing potential issues

Format your response as JSON with the following structure:
{
  "analysis": "Detailed analysis of the document",
  "risks": ["Risk 1", "Risk 2", "Risk 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
}
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{\s*"analysis"[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        return {
          analysis: parsed.analysis || "Analysis unavailable",
          risks: parsed.risks || [],
          recommendations: parsed.recommendations || []
        };
      } catch (jsonError) {
        console.error('Error parsing JSON from Gemini response:', jsonError);
        return {
          analysis: text,
          risks: [],
          recommendations: []
        };
      }
    }
    
    // Fallback if JSON extraction fails
    return {
      analysis: text,
      risks: [],
      recommendations: []
    };
  } catch (error) {
    console.error('Error analyzing document with Gemini API:', error);
    throw new Error('Failed to analyze the document. Please try again later.');
  }
}