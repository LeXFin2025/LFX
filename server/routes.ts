import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { Storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import { ServiceCategoryEnum, DocumentStatusEnum } from "@shared/schema";
import { z } from "zod";
import { WebSocketServer } from "ws";
import { WebSocket } from "ws";

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size
  } 
});

// Mock AI service for document analysis
// In a real application, this would call a real AI service like Google's Gemini
const analyzeDocument = async (
  fileBuffer: Buffer, 
  filename: string, 
  category: string
) => {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Return analysis result based on document category
  const analysisResult = {
    analysis: [
      `This document has been analyzed using our AI-powered ${category === 'forensic' ? 'forensic audit' : category === 'tax' ? 'tax optimization' : 'legal analysis'} system.`,
      `We've identified several important insights in this document that require your attention. The AI has processed all the content and detected relevant patterns for ${category} analysis.`,
      `Based on current regulatory frameworks and the latest ${category === 'forensic' ? 'accounting standards' : category === 'tax' ? 'tax regulations' : 'legal precedents'}, our analysis shows compliance in most areas with a few exceptions noted below.`,
      `Our AI has cross-referenced this document with thousands of similar cases to provide you with accurate and jurisdiction-specific insights tailored to your situation.`,
      `We recommend reviewing the detailed recommendations below to ensure full compliance and to take advantage of potential opportunities identified by the LeXIntuition engine.`
    ],
    recommendations: [
      "Review the highlighted sections to ensure compliance with current regulations.",
      "Consider implementing the suggested changes to optimize your position.",
      "Address potential risk areas proactively to prevent future complications.",
      `Consult with a ${category === 'forensic' ? 'certified forensic accountant' : category === 'tax' ? 'tax professional' : 'legal professional'} about the specific findings in sections 3.2 and 4.1.`
    ],
    references: [
      {
        title: category === 'forensic' ? "AICPA Forensic Accounting Standards" : category === 'tax' ? "IRS Publication 535: Business Expenses" : "Legal Compliance Framework 2023",
        url: "#"
      },
      {
        title: category === 'forensic' ? "Financial Accounting Standards Board (FASB)" : category === 'tax' ? "Tax Cuts and Jobs Act of 2017" : "Recent Supreme Court Decision on Similar Cases",
        url: "#"
      }
    ],
    lexIntuition: {
      predictions: [
        `Based on current trends and regulatory patterns, we predict that ${category === 'forensic' ? 'financial reporting requirements' : category === 'tax' ? 'tax deduction eligibility' : 'legal compliance standards'} in this area will become more stringent over the next 12-18 months.`,
        `Our predictive models suggest a ${category === 'forensic' ? '72%' : category === 'tax' ? '65%' : '78%'} likelihood of increased regulatory scrutiny in this specific domain by Q3 of next year.`,
        `The LeXIntuition engine has identified emerging patterns that suggest proactive adjustments now could prevent potential issues in the future.`
      ],
      risks: [
        {
          title: "Regulatory Changes",
          description: `Upcoming changes to ${category === 'forensic' ? 'accounting standards' : category === 'tax' ? 'tax legislation' : 'legal requirements'} may impact your current approach.`
        },
        {
          title: "Documentation Gaps",
          description: "Some supporting documentation appears to be incomplete, which could pose issues during an audit or review."
        }
      ],
      opportunities: [
        {
          title: category === 'forensic' ? "Process Improvement" : category === 'tax' ? "Tax Saving Opportunity" : "Legal Protection Enhancement",
          description: category === 'forensic' ? "Implementing better fraud prevention controls could strengthen your financial position." : category === 'tax' ? "Restructuring certain financial activities could yield substantial tax savings." : "Additional protective clauses could significantly strengthen your legal position."
        },
        {
          title: "Strategic Planning",
          description: `Early planning for ${category === 'forensic' ? 'next fiscal year' : category === 'tax' ? 'Q4 tax events' : 'upcoming regulatory changes'} could give you a competitive advantage.`
        }
      ]
    },
    reasoningLog: [
      {
        step: "Document Classification",
        reasoning: `The AI identified this as a ${category} document based on key terminology, structure, and content patterns.`
      },
      {
        step: "Regulatory Framework Identification",
        reasoning: `Applied relevant ${category === 'forensic' ? 'accounting standards' : category === 'tax' ? 'tax codes' : 'legal frameworks'} based on document content and jurisdiction detection.`
      },
      {
        step: "Pattern Recognition",
        reasoning: "Identified recurring patterns and compared them against our database of known issues and opportunities."
      },
      {
        step: "Risk Assessment",
        reasoning: "Calculated probability and potential impact of identified issues using historical data and predictive modeling."
      },
      {
        step: "Recommendation Generation",
        reasoning: "Generated actionable recommendations based on detected issues, applying jurisdiction-specific rules and best practices."
      }
    ]
  };
  
  return analysisResult;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Get all documents for the authenticated user
  app.get("/api/documents", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const category = req.query.category as string | undefined;
      const documents = await storage.getDocumentsByUserId(req.user!.id, category);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).send("Error fetching documents");
    }
  });

  // Get a specific document by ID
  app.get("/api/documents/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).send("Invalid document ID");
      
      const document = await storage.getDocument(id);
      if (!document) return res.status(404).send("Document not found");
      
      // Check if user owns the document
      if (document.userId !== req.user!.id) return res.status(403).send("Forbidden");
      
      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).send("Error fetching document");
    }
  });

  // Upload a new document
  app.post("/api/documents/upload", upload.single('file'), async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      // Validate request
      if (!req.file) return res.status(400).send("No file uploaded");
      
      const categorySchema = z.enum(["forensic", "tax", "legal"]);
      const category = categorySchema.safeParse(req.body.category);
      
      if (!category.success) return res.status(400).send("Invalid category");
      
      // Create document record
      const document = await storage.createDocument({
        userId: req.user!.id,
        filename: req.file.originalname,
        category: category.data,
      });
      
      // Create activity record for upload
      await storage.createActivity({
        userId: req.user!.id,
        type: "upload",
        details: {
          title: `Document Uploaded`,
          description: `You uploaded "${req.file.originalname}" for ${category.data} analysis`,
          status: "completed"
        },
        relatedDocumentId: document.id
      });
      
      // Process the document asynchronously
      processDocumentAsync(req.file.buffer, document);
      
      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).send("Error uploading document");
    }
  });

  // Get recent activities for the authenticated user
  app.get("/api/activities", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const activities = await storage.getActivitiesByUserId(req.user!.id);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).send("Error fetching activities");
    }
  });

  // Get or create active conversation
  app.get("/api/conversations/active", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      let conversation = await storage.getActiveConversation(req.user!.id);
      
      if (!conversation) {
        conversation = await storage.createConversation({
          userId: req.user!.id
        });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching active conversation:", error);
      res.status(500).send("Error fetching active conversation");
    }
  });

  // Create a new conversation
  app.post("/api/conversations", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const conversation = await storage.createConversation({
        userId: req.user!.id
      });
      
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).send("Error creating conversation");
    }
  });

  // Get messages for a conversation
  app.get("/api/conversations/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) return res.status(400).send("Invalid conversation ID");
      
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) return res.status(404).send("Conversation not found");
      
      // Check if user owns the conversation
      if (conversation.userId !== req.user!.id) return res.status(403).send("Forbidden");
      
      const messages = await storage.getMessagesByConversationId(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).send("Error fetching messages");
    }
  });

  // Send a message in a conversation
  app.post("/api/conversations/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) return res.status(400).send("Invalid conversation ID");
      
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) return res.status(404).send("Conversation not found");
      
      // Check if user owns the conversation
      if (conversation.userId !== req.user!.id) return res.status(403).send("Forbidden");
      
      // Validate message content
      if (!req.body.content || typeof req.body.content !== 'string') {
        return res.status(400).send("Invalid message content");
      }
      
      // Create user message
      const userMessage = await storage.createMessage({
        conversationId,
        sender: "user",
        content: req.body.content,
      });
      
      // Update conversation's lastMessageAt
      await storage.updateConversation(conversationId, { lastMessageAt: new Date() });
      
      // Create activity for the message
      await storage.createActivity({
        userId: req.user!.id,
        type: "lexassist",
        details: {
          title: "LeXAssist Conversation",
          description: req.body.content.length > 60 
            ? req.body.content.substring(0, 57) + '...' 
            : req.body.content,
          status: "completed"
        }
      });
      
      // Generate AI response asynchronously
      generateAIResponse(conversation, userMessage);
      
      res.status(201).json(userMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).send("Error sending message");
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Set up WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle authentication
        if (data.type === 'auth' && data.sessionId) {
          // In a real app, validate the session ID
          ws.sessionId = data.sessionId;
          ws.userId = data.userId;
          ws.send(JSON.stringify({ type: 'auth', status: 'success' }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  // Helper function to broadcast updates to connected clients
  const broadcastToUser = (userId: number, data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.userId === userId) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Asynchronous document processing
  async function processDocumentAsync(fileBuffer: Buffer, document: any) {
    try {
      // Update document status to processing
      await storage.updateDocument(document.id, { status: "processing" });
      
      // Create activity for processing start
      await storage.createActivity({
        userId: document.userId,
        type: document.category,
        details: {
          title: `${document.category === 'forensic' ? 'Forensic Audit' : document.category === 'tax' ? 'Tax Analysis' : 'Legal Analysis'} Started`,
          description: `Processing started for "${document.filename}"`,
          status: "processing"
        },
        relatedDocumentId: document.id
      });
      
      // Broadcast status update to user
      broadcastToUser(document.userId, {
        type: 'document_update',
        document: { ...document, status: "processing" }
      });
      
      // Call AI service to analyze document
      const analysisResult = await analyzeDocument(fileBuffer, document.filename, document.category);
      
      // Update document with analysis results
      await storage.updateDocument(document.id, { 
        status: "completed",
        analysisResult
      });
      
      // Create activity for completed analysis
      await storage.createActivity({
        userId: document.userId,
        type: document.category,
        details: {
          title: `${document.category === 'forensic' ? 'Forensic Audit' : document.category === 'tax' ? 'Tax Analysis' : 'Legal Analysis'} Completed`,
          description: `Analysis completed for "${document.filename}"`,
          status: "completed"
        },
        relatedDocumentId: document.id
      });
      
      // Create LeXIntuition insight activity
      await storage.createActivity({
        userId: document.userId,
        type: "lexintuition",
        details: {
          title: "LeXIntuition Alert",
          description: document.category === 'forensic' 
            ? "Potential irregularities detected in financial records" 
            : document.category === 'tax' 
              ? "Potential tax deduction opportunity identified in your filings" 
              : "Possible legal risk identified in contract terms",
          status: "action"
        },
        relatedDocumentId: document.id
      });
      
      // Broadcast completion to user
      broadcastToUser(document.userId, {
        type: 'document_update',
        document: { 
          ...document, 
          status: "completed",
          analysisResult 
        }
      });
      
    } catch (error) {
      console.error("Error processing document:", error);
      
      // Update document status to failed
      await storage.updateDocument(document.id, { status: "failed" });
      
      // Create activity for failed processing
      await storage.createActivity({
        userId: document.userId,
        type: document.category,
        details: {
          title: `Analysis Failed`,
          description: `Processing failed for "${document.filename}"`,
          status: "failed"
        },
        relatedDocumentId: document.id
      });
      
      // Broadcast failure to user
      broadcastToUser(document.userId, {
        type: 'document_update',
        document: { ...document, status: "failed" }
      });
    }
  }

  // Asynchronous AI response generation
  async function generateAIResponse(conversation: any, userMessage: any) {
    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate AI response based on user message
      const aiResponse = generateLeXAssistResponse(userMessage.content, conversation.userId);
      
      // Create AI message
      const assistantMessage = await storage.createMessage({
        conversationId: conversation.id,
        sender: "assistant",
        content: aiResponse.content,
        reasoningLog: aiResponse.reasoning
      });
      
      // Update conversation's lastMessageAt
      await storage.updateConversation(conversation.id, { lastMessageAt: new Date() });
      
      // Broadcast message to user
      broadcastToUser(conversation.userId, {
        type: 'message_update',
        conversationId: conversation.id,
        message: assistantMessage
      });
      
    } catch (error) {
      console.error("Error generating AI response:", error);
      
      // Create error message
      const errorMessage = await storage.createMessage({
        conversationId: conversation.id,
        sender: "assistant",
        content: "I apologize, but I encountered an error processing your request. Please try again."
      });
      
      // Broadcast error message to user
      broadcastToUser(conversation.userId, {
        type: 'message_update',
        conversationId: conversation.id,
        message: errorMessage
      });
    }
  }

  // Helper function to generate LeXAssist responses
  function generateLeXAssistResponse(userMessage: string, userId: number) {
    // In a real application, this would call a real AI service like Google's Gemini
    
    // Detect if message is about tax
    if (userMessage.toLowerCase().includes('tax') || 
        userMessage.toLowerCase().includes('deduction') || 
        userMessage.toLowerCase().includes('irs')) {
      return {
        content: `Based on your question about taxes, I can provide some general guidance. Tax regulations are complex and jurisdiction-specific, but there are several strategies that might be applicable to your situation. To provide more specific advice, I would need more details about your financial situation, income sources, and applicable jurisdiction. Would you like me to analyze a specific tax document for you?`,
        reasoning: [
          { step: "Intent Detection", reasoning: "Identified tax-related query from keywords" },
          { step: "Jurisdiction Check", reasoning: "No specific jurisdiction mentioned, defaulting to general guidance" },
          { step: "Response Generation", reasoning: "Provided general tax information while requesting more specific details" }
        ]
      };
    }
    
    // Detect if message is about legal matters
    else if (userMessage.toLowerCase().includes('legal') || 
             userMessage.toLowerCase().includes('contract') || 
             userMessage.toLowerCase().includes('lawsuit') ||
             userMessage.toLowerCase().includes('agreement')) {
      return {
        content: `Regarding your legal question, I should note that this information is not legal advice. Legal matters are highly dependent on jurisdiction and specific circumstances. Based on general legal principles, there are several factors to consider. To provide more tailored insights, could you share more details about the specific legal document or situation you're dealing with?`,
        reasoning: [
          { step: "Intent Detection", reasoning: "Identified legal-related query from keywords" },
          { step: "Disclaimer Addition", reasoning: "Added legal disclaimer as required for legal discussions" },
          { step: "Response Generation", reasoning: "Provided general legal information while requesting more specific context" }
        ]
      };
    }
    
    // Detect if message is about financial audit
    else if (userMessage.toLowerCase().includes('audit') || 
             userMessage.toLowerCase().includes('financial') || 
             userMessage.toLowerCase().includes('fraud') ||
             userMessage.toLowerCase().includes('accounting')) {
      return {
        content: `I understand you're inquiring about financial auditing. Forensic audits are detailed examinations aimed at uncovering financial irregularities or fraud. Our AI can analyze financial statements, transaction records, and other documents to identify potential issues. Would you like to upload specific financial documents for analysis, or do you have more specific questions about the forensic audit process?`,
        reasoning: [
          { step: "Intent Detection", reasoning: "Identified forensic audit-related query from keywords" },
          { step: "Context Building", reasoning: "Provided explanation of forensic audit capabilities" },
          { step: "Response Generation", reasoning: "Explained capabilities and offered document upload option" }
        ]
      };
    }
    
    // General response for other queries
    else {
      return {
        content: `Thank you for your question. I'm LeXAssist, your AI-powered legal and financial advisor. I can help with forensic audits, tax optimization, and legal document analysis. To provide you with the most relevant assistance, could you please specify which of these areas you're interested in, or upload a relevant document for analysis?`,
        reasoning: [
          { step: "Intent Detection", reasoning: "Could not identify specific intent from query" },
          { step: "Service Introduction", reasoning: "Introduced available services since intent was unclear" },
          { step: "Response Generation", reasoning: "Provided general introduction and requested clarification" }
        ]
      };
    }
  }

  return httpServer;
}
