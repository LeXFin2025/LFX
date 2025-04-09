import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Current model name based on API version (1.0)
const MODEL_NAME = 'gemini-1.5-pro';

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
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });
    
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
  analysis: string[];
  risks: {title: string, description: string}[];
  recommendations: string[];
  references: {title: string, url?: string}[];
  lexIntuition: {
    predictions: string[],
    risks: {title: string, description: string}[],
    opportunities: {title: string, description: string}[]
  };
  reasoningLog: {step: string, reasoning: string}[];
}> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.2, // Lower temperature for more structured output
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192, // Allow for longer responses
        responseMimeType: "application/json", // Explicitly request JSON
      }
    });
    
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
6. Future predictions and potential opportunities

Format your response EXACTLY as JSON with the following structure:
{
  "analysis": ["Paragraph 1 of analysis", "Paragraph 2 of analysis", "Paragraph 3 of analysis"],
  "risks": [
    {"title": "Risk Title 1", "description": "Detailed description of risk 1"},
    {"title": "Risk Title 2", "description": "Detailed description of risk 2"}
  ],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "references": [
    {"title": "Reference Title 1", "url": "https://example.com/reference1"},
    {"title": "Reference Title 2"}
  ],
  "lexIntuition": {
    "predictions": ["Prediction paragraph 1", "Prediction paragraph 2"],
    "risks": [
      {"title": "Future Risk 1", "description": "Description of future risk 1"},
      {"title": "Future Risk 2", "description": "Description of future risk 2"}
    ],
    "opportunities": [
      {"title": "Opportunity 1", "description": "Description of opportunity 1"},
      {"title": "Opportunity 2", "description": "Description of opportunity 2"}
    ]
  },
  "reasoningLog": [
    {"step": "Document Analysis", "reasoning": "Explanation of how document was analyzed"},
    {"step": "Risk Assessment", "reasoning": "Explanation of the risk assessment process"}
  ]
}

Make sure your output is valid JSON that can be parsed directly. DO NOT include markdown code blocks, explanations, or any other text outside of the JSON structure.
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
          analysis: Array.isArray(parsed.analysis) ? parsed.analysis : [parsed.analysis || "Analysis unavailable"],
          risks: Array.isArray(parsed.risks) ? parsed.risks : [],
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
          references: Array.isArray(parsed.references) ? parsed.references : [],
          lexIntuition: {
            predictions: Array.isArray(parsed.lexIntuition?.predictions) ? parsed.lexIntuition.predictions : [],
            risks: Array.isArray(parsed.lexIntuition?.risks) ? parsed.lexIntuition.risks : [],
            opportunities: Array.isArray(parsed.lexIntuition?.opportunities) ? parsed.lexIntuition.opportunities : []
          },
          reasoningLog: Array.isArray(parsed.reasoningLog) ? parsed.reasoningLog : []
        };
      } catch (jsonError) {
        console.error('Error parsing JSON from Gemini response:', jsonError);
        // Create a fallback response with the correct structure
        const errorMessage = "We encountered an issue analyzing this document. Please try again.";
        return {
          analysis: [errorMessage],
          risks: [],
          recommendations: [],
          references: [],
          lexIntuition: {
            predictions: [],
            risks: [],
            opportunities: []
          },
          reasoningLog: []
        };
      }
    }
    
    // Fallback if JSON extraction fails
    return {
      analysis: ["Unable to analyze the document properly. Please try again later."],
      risks: [],
      recommendations: [],
      references: [],
      lexIntuition: {
        predictions: [],
        risks: [],
        opportunities: []
      },
      reasoningLog: []
    };
  } catch (error) {
    console.error('Error analyzing document with Gemini API:', error);
    throw new Error('Failed to analyze the document. Please try again later.');
  }
}