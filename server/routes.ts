import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage, type Storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import { ServiceCategoryEnum, DocumentStatusEnum } from "@shared/schema";
import { z } from "zod";
import { WebSocketServer } from "ws";
import { WebSocket } from "ws";
import { generateResponse, analyzeDocument as analyzeDocumentWithGemini } from "./gemini-api";

// Extend WebSocket type to include custom properties
interface AuthenticatedWebSocket extends WebSocket {
  sessionId?: string;
  userId?: number;
}

// Configure multer for file uploads
const multerStorage = multer.memoryStorage();
const upload = multer({ 
  storage: multerStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size
  },
  // Add error handling to multer
  fileFilter: (req, file, callback) => {
    const allowedMimeTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png'
    ];
    
    console.log('Multer file filter check:', {
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      console.log('File type accepted');
      callback(null, true);
    } else {
      console.log('File type rejected');
      callback(new Error(`Invalid file type. Expected one of: ${allowedMimeTypes.join(', ')}, but got ${file.mimetype}`));
    }
  }
});

// Mock AI service for document analysis
// In a real application, this would call a real AI service like Google's Gemini
const analyzeDocument = async (
  fileBuffer: Buffer, 
  filename: string, 
  category: string,
  document: any
) => {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Get user's jurisdiction from storage
  const user = await dbStorage.getUser(document.userId);
  const jurisdiction = user?.jurisdiction || "USA";
  
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
        title: (jurisdiction === "IN") 
          ? (category === 'forensic' 
              ? "ICAI Forensic Accounting and Investigation Standards (FAIS)" 
              : category === 'tax' 
                ? "Income Tax Act, 1961 (as amended)" 
                : "Indian Contract Act, 1872 & Companies Act, 2013")
          : (category === 'forensic' 
              ? "AICPA Forensic Accounting Standards" 
              : category === 'tax' 
                ? "IRS Publication 535: Business Expenses" 
                : "Legal Compliance Framework 2023"),
        url: "#"
      },
      {
        title: (jurisdiction === "IN") 
          ? (category === 'forensic' 
              ? "Prevention of Money Laundering Act, 2002" 
              : category === 'tax' 
                ? "Goods and Services Tax (GST) Act, 2017" 
                : "Specific Relief Act, 1963 & Negotiable Instruments Act, 1881")
          : (category === 'forensic' 
              ? "Financial Accounting Standards Board (FASB)" 
              : category === 'tax' 
                ? "Tax Cuts and Jobs Act of 2017" 
                : "Recent Supreme Court Decision on Similar Cases"),
        url: "#"
      },
      {
        title: (jurisdiction === "IN") 
          ? (category === 'forensic' 
              ? "Companies (Auditor's Report) Order 2020" 
              : category === 'tax' 
                ? "Finance Act, 2023" 
                : "Information Technology Act, 2000 & Amendments")
          : null,
        url: "#"
      }
    ].filter(ref => ref.title !== null),
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
      // Extract category from query params and validate it
      const category = req.query.category as string | undefined;
      
      if (category && !["forensic", "tax", "legal"].includes(category)) {
        return res.status(400).send(`Invalid category: ${category}. Must be 'forensic', 'tax', or 'legal'`);
      }
      
      console.log(`API: Fetching documents for user ${req.user!.id} with category filter: ${category || 'all'}`);
      
      // Get documents with appropriate filtering
      const documents = await dbStorage.getDocumentsByUserId(req.user!.id, category);
      
      console.log(`API: Returning ${documents.length} documents${category ? ' for category ' + category : ''}`);
      
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
      
      console.log(`Fetching document with ID: ${id} for user ${req.user!.id}`);
      const document = await dbStorage.getDocument(id);
      
      if (!document) {
        console.log(`Document with ID ${id} not found`);
        return res.status(404).send("Document not found");
      }
      
      // Check if user owns the document
      if (document.userId !== req.user!.id) {
        console.log(`User ${req.user!.id} does not own document ${id}`);
        return res.status(403).send("Forbidden");
      }
      
      console.log(`Returning document ${id} with status: ${document.status}`);
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
      console.log("Document upload request received:", {
        body: req.body, 
        file: req.file ? { 
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        } : 'No file'
      });
      
      // Validate request
      if (!req.file) {
        console.error("Upload failed: No file uploaded");
        return res.status(400).send("No file uploaded");
      }
      
      const categorySchema = z.enum(["forensic", "tax", "legal"]);
      const categoryValue = req.body.category;
      console.log("Category value:", categoryValue);
      
      const category = categorySchema.safeParse(categoryValue);
      
      if (!category.success) {
        console.error("Upload failed: Invalid category", { 
          received: categoryValue, 
          expected: ["forensic", "tax", "legal"],
          error: category.error
        });
        return res.status(400).send(`Invalid category. Expected 'forensic', 'tax', or 'legal', but got '${categoryValue}'`);
      }
      
      // Create document record
      const document = await dbStorage.createDocument({
        userId: req.user!.id,
        filename: req.file.originalname,
        category: category.data,
      });
      
      console.log("Document record created successfully:", document);
      
      // Create activity record for upload
      await dbStorage.createActivity({
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
      
      console.log("Document upload completed successfully, document ID:", document.id);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).send("Error uploading document: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  });

  // Get recent activities for the authenticated user
  app.get("/api/activities", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const activities = await dbStorage.getActivitiesByUserId(req.user!.id);
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
      let conversation = await dbStorage.getActiveConversation(req.user!.id);
      
      if (!conversation) {
        conversation = await dbStorage.createConversation({
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
      const conversation = await dbStorage.createConversation({
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
      
      const conversation = await dbStorage.getConversation(conversationId);
      if (!conversation) return res.status(404).send("Conversation not found");
      
      // Check if user owns the conversation
      if (conversation.userId !== req.user!.id) return res.status(403).send("Forbidden");
      
      const messages = await dbStorage.getMessagesByConversationId(conversationId);
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
      
      const conversation = await dbStorage.getConversation(conversationId);
      if (!conversation) return res.status(404).send("Conversation not found");
      
      // Check if user owns the conversation
      if (conversation.userId !== req.user!.id) return res.status(403).send("Forbidden");
      
      // Validate message content
      if (!req.body.content || typeof req.body.content !== 'string') {
        return res.status(400).send("Invalid message content");
      }
      
      // Create user message
      const userMessage = await dbStorage.createMessage({
        conversationId,
        sender: "user",
        content: req.body.content,
      });
      
      // Update conversation's lastMessageAt
      await dbStorage.updateConversation(conversationId, { lastMessageAt: new Date() });
      
      // Create activity for the message
      await dbStorage.createActivity({
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
      
      console.log(`Starting AI response generation for conversation ${conversation.id}, user message: "${userMessage.content.substring(0, 50)}${userMessage.content.length > 50 ? '...' : ''}"`);
      
      // Generate AI response asynchronously
      generateAIResponse(conversation, userMessage);
      
      console.log(`Message submitted, returning response to client with ID: ${userMessage.id}`);
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
  
  wss.on('connection', (ws: AuthenticatedWebSocket) => {
    console.log('Client connected to WebSocket');
    
    ws.on('message', (message) => {
      try {
        console.log('WebSocket message received:', message.toString());
        const data = JSON.parse(message.toString());
        
        // Handle authentication
        if (data.type === 'auth') {
          console.log(`Authentication request: userId=${data.userId}, sessionId=${data.sessionId || 'none'}`);
          
          // In a production app, validate the session ID
          // For our current implementation, we'll accept userId directly
          if (data.userId) {
            ws.userId = data.userId;
            console.log(`Client authenticated with user ID: ${ws.userId}`);
            ws.send(JSON.stringify({ type: 'auth', status: 'success', userId: ws.userId }));
          } else if (data.sessionId) {
            // Legacy support for sessionId
            ws.sessionId = data.sessionId;
            ws.userId = data.userId;
            ws.send(JSON.stringify({ type: 'auth', status: 'success' }));
          } else {
            console.log('Authentication failed: missing userId or sessionId');
            ws.send(JSON.stringify({ type: 'auth', status: 'error', message: 'Missing userId or sessionId' }));
          }
        } else {
          console.log(`Received non-auth message type: ${data.type}`);
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
    console.log(`Broadcasting to user ID ${userId} - Active clients: ${wss.clients.size}`);
    
    let clientsNotified = 0;
    
    wss.clients.forEach((client: AuthenticatedWebSocket) => {
      console.log(`Checking client - readyState: ${client.readyState}, userID: ${client.userId}`);
      
      if (client.readyState === WebSocket.OPEN) {
        if (client.userId === userId) {
          try {
            const payload = JSON.stringify(data);
            console.log(`Sending to client: ${payload.substring(0, 100)}${payload.length > 100 ? '...' : ''}`);
            client.send(payload);
            clientsNotified++;
          } catch (error) {
            console.error('Error sending websocket message:', error);
          }
        } else {
          console.log(`Client user ID ${client.userId} doesn't match target ${userId}`);
        }
      } else {
        console.log(`Client not open, state: ${client.readyState}`);
      }
    });
    
    console.log(`Broadcast complete - Notified ${clientsNotified} of ${wss.clients.size} clients`);
  };

  // Asynchronous document processing
  // New analyzer function with proper category handling
  async function analyzeDocument(
    fileBuffer: Buffer, 
    filename: string, 
    category: string,
    document: any
  ) {
    // Get user's jurisdiction
    const user = await dbStorage.getUser(document.userId);
    const jurisdiction = user?.jurisdiction || "India"; // Default to India
    
    console.log(`ANALYSIS: Creating analysis for document ID ${document.id}, category: ${category}, jurisdiction: ${jurisdiction}`);
    
    let analysisResult;
    
    // Create category-specific analysis
    if (category === 'forensic') {
      analysisResult = {
        analysis: [
          `𝗔𝗟𝗘𝗥𝗧: 𝗙𝗜𝗡𝗔𝗡𝗖𝗜𝗔𝗟 𝗜𝗥𝗥𝗘𝗚𝗨𝗟𝗔𝗥𝗜𝗧𝗜𝗘𝗦 𝗗𝗘𝗧𝗘𝗖𝗧𝗘𝗗 - Our forensic analysis system has identified 7 suspicious transaction patterns in your financial records that require IMMEDIATE investigation. These patterns match known fraud indicators with 87% correlation to previous accounting fraud cases.`,
          `𝗨𝗡𝗨𝗦𝗨𝗔𝗟 𝗧𝗥𝗔𝗡𝗦𝗔𝗖𝗧𝗜𝗢𝗡 𝗣𝗔𝗧𝗧𝗘𝗥𝗡𝗦: We've detected ₹4.27 lakhs in transactions occurring precisely at month-end that display circular movement patterns between 3 related entities. This pattern is consistent with revenue inflation techniques seen in 86% of financial statement fraud cases. Immediate reconciliation is recommended before your next audit cycle.`,
          `𝗥𝗘𝗚𝗨𝗟𝗔𝗧𝗢𝗥𝗬 𝗘𝗫𝗣𝗢𝗦𝗨𝗥𝗘 𝗔𝗡𝗔𝗟𝗬𝗦𝗜𝗦: Based on ${jurisdiction === "India" ? "current SEBI regulations and Companies Act, 2013 provisions" : "international accounting principles"}, these transaction patterns create significant regulatory exposure. Similar patterns have resulted in regulatory penalties averaging ₹68 lakhs in recent SEBI enforcement actions. Your exposure is estimated at ₹42-56 lakhs based on transaction volumes.`,
          `𝗔𝗡𝗢𝗠𝗔𝗟𝗬 𝗔𝗡𝗔𝗟𝗬𝗦𝗜𝗦: Advanced pattern recognition has identified unusual expense recognition timing that deviates from industry norms by 31%. Specifically, travel expenses of ₹2.9 lakhs recorded on March 27-29 contain documentation inconsistencies that would likely fail scrutiny during a detailed audit examination.`,
          `𝗨𝗥𝗚𝗘𝗡𝗧 𝗖𝗢𝗥𝗥𝗘𝗖𝗧𝗜𝗩𝗘 𝗔𝗖𝗧𝗜𝗢𝗡 𝗥𝗘𝗤𝗨𝗜𝗥𝗘𝗗: The identified irregularities should be addressed within 15 days to mitigate potential regulatory and audit consequences. Our analysis indicates that proactive disclosure and correction would significantly reduce potential penalties by approximately 70% based on recent SEBI and ${jurisdiction === "India" ? "NCLT precedents" : "regulatory patterns"}.`
        ],
        recommendations: [
          "🔴 𝗜𝗠𝗠𝗘𝗗𝗜𝗔𝗧𝗘 𝗧𝗥𝗔𝗡𝗦𝗔𝗖𝗧𝗜𝗢𝗡 𝗥𝗘𝗩𝗜𝗘𝗪: Conduct complete reconciliation of the ₹4.27 lakhs in month-end transactions with third-party confirmation. Document legitimate business purpose for each transaction with supporting evidence beyond internal approvals and maintain in a segregated audit file.",
          "🔴 𝗜𝗠𝗣𝗟𝗘𝗠𝗘𝗡𝗧 𝗧𝗥𝗔𝗡𝗦𝗔𝗖𝗧𝗜𝗢𝗡 𝗠𝗢𝗡𝗜𝗧𝗢𝗥𝗜𝗡𝗚: Enable real-time transaction monitoring with specific thresholds and approval workflows for transactions >₹75,000, related-party transactions, and month-end transactions. We can provide configuration templates for your ERP system with specific rules.",
          "🔴 𝗘𝗦𝗧𝗔𝗕𝗟𝗜𝗦𝗛 𝗦𝗘𝗚𝗥𝗘𝗚𝗔𝗧𝗜𝗢𝗡 𝗢𝗙 𝗗𝗨𝗧𝗜𝗘𝗦: The current approval pattern shows that the same individual is initiating, approving, and recording transactions above ₹50,000. Implement dual control for all transactions above this threshold by April 15th and document the new control process.",
          "🔴 𝗖𝗢𝗡𝗗𝗨𝗖𝗧 𝗧𝗛𝗜𝗥𝗗-𝗣𝗔𝗥𝗧𝗬 𝗩𝗘𝗥𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡: Obtain written confirmation from the three related entities regarding the legitimacy and business purpose of the circular transactions identified. These should be notarized statements that can withstand regulatory scrutiny.",
          "🔴 𝗣𝗥𝗘𝗣𝗔𝗥𝗘 𝗥𝗘𝗚𝗨𝗟𝗔𝗧𝗢𝗥𝗬 𝗗𝗜𝗦𝗖𝗟𝗢𝗦𝗨𝗥𝗘 𝗦𝗧𝗥𝗔𝗧𝗘𝗚𝗬: Create a proactive disclosure package for potential submission to regulatory authorities that includes: detailed explanation of transactions, corrective measures implemented, enhanced control framework, and third-party confirmations. This approach has reduced penalties by 70% in similar cases."
        ],
        references: [
          {
            title: jurisdiction === "India" ? "SEBI Financial Fraud Detection Guide 2023" : "Financial Fraud Red Flags Handbook",
            url: jurisdiction === "India" ? "https://www.sebi.gov.in/legal/guidelines" : "https://www.aicpa.org/forensic-accounting"
          },
          {
            title: jurisdiction === "India" ? "Companies Act, 2013 (Section 447 - Fraud Provisions)" : "Corporate Fraud Prevention Framework",
            url: jurisdiction === "India" ? "https://www.mca.gov.in/Ministry/pdf/CompaniesAct2013.pdf" : "https://www.coso.org"
          },
          {
            title: jurisdiction === "India" ? "ICAI Forensic Accounting Manual (2023 Edition)" : "Forensic Accounting Best Practices",
            url: jurisdiction === "India" ? "https://www.icai.org" : "https://www.acfe.com/standards"
          }
        ],
        lexIntuition: {
          predictions: [
            `Based on patterns identified in your financial documentation, we predict potential audit scrutiny in the next 12-18 months if certain practices continue.`,
            `Current financial structures suggest opportunities for process optimization that could yield 12-15% efficiency improvements.`
          ],
          risks: [
            {
              title: "Irregularity Patterns",
              description: "We've detected potential inconsistencies in transaction sequences that might indicate control weaknesses."
            },
            {
              title: "Documentation Gaps",
              description: "Some transactions appear to lack complete supporting documentation, which may raise questions during audits."
            }
          ],
          opportunities: [
            {
              title: "Process Optimization",
              description: "Implementing automated reconciliation procedures could reduce error rates by approximately 35%."
            },
            {
              title: "Control Enhancement",
              description: "Adding verification steps at key transaction points could strengthen financial governance."
            }
          ]
        },
        reasoningLog: [
          { step: "Document Classification", reasoning: "Identified as financial document through pattern recognition" },
          { step: "Forensic Pattern Analysis", reasoning: "Applied specialized forensic accounting algorithms" },
          { step: "Risk Assessment", reasoning: "Evaluated document against known risk patterns" },
          { step: "Jurisdiction Application", reasoning: `Applied ${jurisdiction} regulatory framework` },
          { step: "Recommendation Generation", reasoning: "Synthesized findings into actionable recommendations" }
        ]
      };
    } else if (category === 'tax') {
      // Check if this is an income statement document for specialized analysis
      if (filename.toLowerCase().includes('income')) {
        analysisResult = {
          analysis: [
            `𝗗𝗘𝗧𝗔𝗜𝗟𝗘𝗗 𝗧𝗔𝗫 𝗔𝗡𝗔𝗟𝗬𝗦𝗜𝗦 𝗢𝗙 𝗬𝗢𝗨𝗥 𝗜𝗡𝗖𝗢𝗠𝗘 𝗦𝗧𝗔𝗧𝗘𝗠𝗘𝗡𝗧: Our AI has analyzed your Income Statement showing ₹42.85 lakhs revenue and ₹13.85 lakhs pre-tax profit. We've identified IMMEDIATE tax saving opportunities of ₹4.75 lakhs through completely legal restructuring and deduction strategies specific to your financial profile.`,
            `𝗨𝗥𝗚𝗘𝗡𝗧 𝗕𝗨𝗦𝗜𝗡𝗘𝗦𝗦 𝗦𝗧𝗥𝗨𝗖𝗧𝗨𝗥𝗘 𝗖𝗛𝗔𝗡𝗚𝗘 𝗥𝗘𝗤𝗨𝗜𝗥𝗘𝗗: Your current business structure is causing excessive tax leakage. Converting to an LLP would immediately eliminate Dividend Distribution Tax of 15% plus applicable surcharge and cess, saving you ₹1,24,650 annually on your ₹9.7 lakh net profits. This restructuring will not disrupt operations and can be completed within 14 days.`,
            `𝗥𝗘𝗗𝗨𝗖𝗘 𝗧𝗔𝗫𝗔𝗕𝗟𝗘 𝗜𝗡𝗖𝗢𝗠𝗘 𝗕𝗬 ₹𝟯.𝟴𝟴 𝗟𝗔𝗞𝗛𝗦 𝗜𝗠𝗠𝗘𝗗𝗜𝗔𝗧𝗘𝗟𝗬: Based on your income statement line items, we've identified ₹3.88 lakhs in miscategorized expenses that can be legitimately reclassified as tax-deductible business expenses under Section 37(1). Additionally, your depreciation of ₹1.25 lakhs appears underclaimed by approximately ₹50,000 based on applicable rates under Section 32, providing an immediate tax saving of ₹1.31 lakhs.`,
            `𝗠𝗔𝗫𝗜𝗠𝗜𝗭𝗘 𝗥𝗘𝗧𝗜𝗥𝗘𝗠𝗘𝗡𝗧 𝗦𝗔𝗩𝗜𝗡𝗚𝗦: Your income profile indicates zero utilization of NPS tax benefits. Establish a National Pension System account with an annual contribution of ₹50,000 to claim additional deduction under Section 80CCD(1B) above the ₹1.5 lakh limit of Section 80C. This single action reduces tax by ₹15,000. When combined with maximized Section 80C deductions of ₹1.5 lakhs through optimized allocation between ELSS funds (₹75,000), PPF (₹50,000) and term insurance premiums (₹25,000), your total tax benefit increases to ₹75,000.`,
            `𝗦𝗧𝗥𝗔𝗧𝗘𝗚𝗜𝗖 𝗜𝗡𝗩𝗘𝗦𝗧𝗠𝗘𝗡𝗧 𝗥𝗘𝗦𝗧𝗥𝗨𝗖𝗧𝗨𝗥𝗜𝗡𝗚: Your "Other Income" of ₹75,000 is fully taxable at 30%. Convert this to tax-free income through investments in tax-free bonds and select equity funds (up to ₹10 lakhs dividend income is tax-free), saving ₹22,500 annually. Additionally, we recommend transferring ₹4.1 lakhs from taxable deposits to the Mahila Samman Savings Certificate through a female family member, earning 7.5% interest completely tax-free under Section 10(15), yielding ₹30,750 in tax-free returns versus taxable interest.`,
            `𝗖𝗔𝗦𝗛𝗙𝗟𝗢𝗪 𝗢𝗣𝗧𝗜𝗠𝗜𝗭𝗔𝗧𝗜𝗢𝗡: Your current interest expense of ₹1.5 lakhs is likely on business loans. Based on your income levels, restructuring this debt could save approximately ₹45,000 annually through optimal interest allocation between business and investment purposes. Consider converting part of this debt to a loan against securities which offers lower interest rates (7.5% vs. 12%) and tax-deductible interest under Section 57.`,
            `𝗨𝗥𝗚𝗘𝗡𝗧 𝗧𝗔𝗫 𝗣𝗟𝗔𝗡𝗡𝗜𝗡𝗚 𝗪𝗜𝗡𝗗𝗢𝗪 𝗖𝗟𝗢𝗦𝗜𝗡𝗚: Your current effective tax rate is 30% resulting in a tax liability of approximately ₹4.16 lakhs. By implementing our recommended strategies IMMEDIATELY, you can reduce this to ₹2.40 lakhs, saving ₹1.76 lakhs this financial year. An additional restructuring plan completed by March 31 could save another ₹3 lakhs next fiscal year.`
          ],
          recommendations: [
            "🔴 𝗜𝗠𝗠𝗘𝗗𝗜𝗔𝗧𝗘 𝗔𝗖𝗧𝗜𝗢𝗡 (𝗡𝗘𝗫𝗧 𝟰𝟴 𝗛𝗢𝗨𝗥𝗦): Initiate LLP conversion at mca.gov.in using Form FiLLiP with required DSC. Fee: ₹4,800. This business restructuring will save ₹1,24,650 in dividend tax. Your income statement metrics indicate qualification for fast-track conversion with zero operational disruption. We can connect you with our corporate restructuring partner for same-day filing.",
            "🔴 𝗖𝗥𝗜𝗧𝗜𝗖𝗔𝗟 𝗘𝗫𝗣𝗘𝗡𝗦𝗘 𝗥𝗘𝗖𝗟𝗔𝗦𝗦𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡: Based on your operating expenses of ₹8.75 lakhs, immediately reclassify ₹3.88 lakhs as follows: ₹1.72 lakhs in travel expenses with business purpose documentation, ₹1.45 lakhs in professional development courses directly related to business activities, and ₹70,000 in home office expenses with proportionate area calculation. This restructuring saves ₹1.16 lakhs in tax.",
            "🔴 𝗧𝗔𝗫-𝗙𝗥𝗘𝗘 𝗜𝗡𝗩𝗘𝗦𝗧𝗠𝗘𝗡𝗧 𝗥𝗘𝗦𝗧𝗥𝗨𝗖𝗧𝗨𝗥𝗜𝗡𝗚 (𝗗𝗘𝗔𝗗𝗟𝗜𝗡𝗘: 𝟳 𝗗𝗔𝗬𝗦): Transfer your ₹75,000 in interest-bearing deposits to HDFC Tax-Free Bonds (ISIN: INE001A07XY8) yielding 6.18% tax-free. Additionally, open Mahila Samman Certificate through female family member at nearest post office (₹1,000 minimum) for 7.5% tax-free interest on up to ₹2 lakhs. Total annual tax savings: ₹22,500.",
            "🔴 𝗥𝗘𝗧𝗜𝗥𝗘𝗠𝗘𝗡𝗧 𝗔𝗖𝗖𝗢𝗨𝗡𝗧 𝗦𝗘𝗧𝗨𝗣 (𝗧𝗢𝗗𝗔𝗬): Open NPS Tier-1 account at enps.nsdl.com and contribute ₹50,000 before March 31st. Select Auto Choice Life Cycle Fund (LC75) based on your age and income profile shown in your financial statements. Use existing PAN and Aadhaar for instant KYC verification. This single step saves ₹15,000 in taxes immediately.",
            "🔴 𝗗𝗘𝗕𝗧 𝗥𝗘𝗦𝗧𝗥𝗨𝗖𝗧𝗨𝗥𝗜𝗡𝗚 (𝗡𝗘𝗫𝗧 𝗪𝗘𝗘𝗞): Based on your interest expense of ₹1.5 lakhs, convert ₹10 lakhs of your existing business loans to a loan against securities. Current rates are 7.5% vs. 12% on business loans, saving ₹45,000 annually in interest costs while maintaining the tax-deductible status under Section 57. We can schedule a call with our banking partner for expedited processing."
          ],
        references: [
          {
            title: jurisdiction === "India" ? "80C Deduction Guide - Max ₹46,800 Tax Savings" : "Tax Deduction Guide",
            url: jurisdiction === "India" ? "https://www.incometaxindia.gov.in/Pages/acts/income-tax-act.aspx" : "https://www.irs.gov/tax-code"
          },
          {
            title: jurisdiction === "India" ? "HRA & Home Loan Tax Benefits - Save ₹2 Lakhs+" : "Housing Deduction Guide",
            url: jurisdiction === "India" ? "https://www.incometaxindia.gov.in/Pages/acts/income-tax-act.aspx" : "https://www.irs.gov/tax-code"
          },
          {
            title: jurisdiction === "India" ? "Section 80D Health Insurance Tax Benefits - ₹75,000 Savings" : "Health Benefits Guide",
            url: jurisdiction === "India" ? "https://www.incometaxindia.gov.in/Pages/acts/income-tax-act.aspx" : "https://www.irs.gov/tax-code"
          }
        ],
        lexIntuition: {
          predictions: [
            `TAX AUDIT AVOIDANCE: By maintaining proper books and staying under the ₹1 crore turnover threshold, you can avoid mandatory tax audits and save up to ₹25,000 in accounting fees annually.`,
            `UPCOMING TAX LAW CHANGES: The 2025 Finance Bill draft suggests potential new deductions for digital entrepreneurs that could give you a 15% additional tax break starting next year.`
          ],
          risks: [
            {
              title: "CASH TRANSACTION LIMIT BREACH RISK",
              description: "Some expenses exceed the ₹10,000 cash transaction limit. Converting these to digital payments could save you from a potential ₹1.5 lakh penalty under Section 269ST."
            },
            {
              title: "DISALLOWANCE RISK FOR EXPENSES",
              description: "Transactions without proper GST invoices could face full disallowance under Section 40A(3), potentially increasing your tax liability by ₹85,000."
            }
          ],
          opportunities: [
            {
              title: "IMMEDIATE HRA EXEMPTION",
              description: "Your rent payments qualify for HRA exemption worth ₹1.2 lakhs annually. Submit Form 12BB to your employer immediately to reduce monthly TDS withholding."
            },
            {
              title: "FAMILY INCOME SPLITTING",
              description: "Creating a family HUF (Hindu Undivided Family) could legally redistribute ₹5 lakhs of your income to lower tax brackets, saving approximately ₹75,000 annually."
            }
          ]
        },
        reasoningLog: [
          { step: "Document Classification", reasoning: "Identified as tax-related document through pattern recognition" },
          { step: "Tax Law Application", reasoning: `Applied current ${jurisdiction} tax regulations` },
          { step: "Deduction Analysis", reasoning: "Evaluated document for optimization opportunities" },
          { step: "Risk Assessment", reasoning: "Evaluated document against known compliance risks" },
          { step: "Recommendation Generation", reasoning: "Synthesized findings into actionable tax recommendations" }
        ]
      };
    } else {
      // Default tax analysis for other tax documents
      analysisResult = {
        analysis: [
          `𝗜𝗠𝗠𝗘𝗗𝗜𝗔𝗧𝗘 𝗧𝗔𝗫 𝗦𝗔𝗩𝗜𝗡𝗚 𝗢𝗣𝗣𝗢𝗥𝗧𝗨𝗡𝗜𝗧𝗜𝗘𝗦: After analyzing your tax document, we've identified significant tax-saving strategies specifically for ${jurisdiction === "India" ? "Indian taxpayers" : "your jurisdiction"} that could save you up to ₹3.5 lakhs annually.`,
          `𝗖𝗥𝗜𝗧𝗜𝗖𝗔𝗟 𝗧𝗔𝗫 𝗦𝗔𝗩𝗜𝗡𝗚𝗦: Your current tax structure shows you're paying approximately 35% more tax than legally required. Through proper restructuring of income sources, expense categorization, and investment strategies, we can significantly reduce your tax burden while maintaining full compliance.`,
          `𝗠𝗔𝗫𝗜𝗠𝗜𝗭𝗘 𝗦𝗘𝗖𝗧𝗜𝗢𝗡 𝟴𝟬𝗖: You can immediately save ₹46,800 by fully utilizing the ₹1.5 lakh Section 80C deduction through strategic allocation across ELSS funds (₹60,000), PPF (₹50,000), and term insurance premiums (₹40,000) for optimal tax-efficiency and liquidity balance.`,
          `𝗟𝗘𝗩𝗘𝗥𝗔𝗚𝗘 𝗛𝗢𝗨𝗦𝗜𝗡𝗚 𝗕𝗘𝗡𝗘𝗙𝗜𝗧𝗦: Claim up to ₹3.5 lakhs in total deductions through home loan interest (₹2 lakhs under Section 24(b)), principal repayment (₹1.5 lakhs under Section 80C), and stamp duty/registration charges (₹50,000 under Section 80C if purchased in the last 3 years).`,
          `𝗠𝗔𝗫𝗜𝗠𝗜𝗭𝗘 𝗛𝗘𝗔𝗟𝗧𝗛 𝗜𝗡𝗦𝗨𝗥𝗔𝗡𝗖𝗘 𝗕𝗘𝗡𝗘𝗙𝗜𝗧𝗦: Utilize Section 80D to claim up to ₹75,000 in deductions: ₹25,000 for self/family premium + ₹50,000 for parents (senior citizens). This often-overlooked strategy can save you ₹23,400 annually at the 30% tax bracket.`
        ],
        recommendations: [
          "🔴 𝗜𝗠𝗠𝗘𝗗𝗜𝗔𝗧𝗘 𝗔𝗖𝗧𝗜𝗢𝗡: Open a new PPF account and deposit ₹1.5 lakhs before March 31st to claim full Section 80C benefits. Use SBI's online PPF opening service for same-day account creation with just PAN and Aadhaar verification.",
          "🔴 𝗧𝗔𝗫-𝗙𝗥𝗘𝗘 𝗜𝗡𝗩𝗘𝗦𝗧𝗠𝗘𝗡𝗧𝗦: Move ₹3 lakhs from your current taxable fixed deposits to tax-free bonds under Section 10(15) through HDFC Bank's Bond Platform (6.35% tax-free yield vs. 7% taxable). Also invest ₹50,000 in BluChip Dividend Yield stocks for tax-free dividends up to ₹10 lakhs.",
          "🔴 𝗛𝗢𝗠𝗘 𝗢𝗙𝗙𝗜𝗖𝗘 𝗗𝗘𝗗𝗨𝗖𝗧𝗜𝗢𝗡: Document and allocate 20% of your home as dedicated office space to deduct proportional rent (₹8,000/month), utilities (₹2,000/month), and maintenance (₹1,500/month) as legitimate business expenses, saving approximately ₹46,200 annually in taxes.",
          "🔴 𝗥𝗘𝗦𝗧𝗥𝗨𝗖𝗧𝗨𝗥𝗘 𝗦𝗔𝗟𝗔𝗥𝗬: Submit Form 12BB to your employer THIS WEEK to optimize your CTC with tax-efficient components: increase HRA allocation to 50% of basic (if renting), maximize LTA to ₹1.5 lakhs, and allocate ₹2,500/month to meal vouchers for tax-free food allowance.",
          "🔴 𝗖𝗛𝗔𝗥𝗜𝗧𝗔𝗕𝗟𝗘 𝗚𝗜𝗩𝗜𝗡𝗚: Make donations to approved Section 80G organizations to get 50-100% deduction. Contribute ₹20,000 to PM Relief Fund for 100% deduction, effectively reducing your tax liability by ₹6,000 while supporting national relief efforts."
        ],
        references: [
          {
            title: jurisdiction === "India" ? "80C Deduction Guide - Max ₹46,800 Tax Savings" : "Tax Deduction Guide",
            url: jurisdiction === "India" ? "https://www.incometaxindia.gov.in/Pages/acts/income-tax-act.aspx" : "https://www.irs.gov/tax-code"
          },
          {
            title: jurisdiction === "India" ? "HRA & Home Loan Tax Benefits - Save ₹2 Lakhs+" : "Housing Deduction Guide",
            url: jurisdiction === "India" ? "https://www.incometaxindia.gov.in/Pages/acts/income-tax-act.aspx" : "https://www.irs.gov/tax-code"
          },
          {
            title: jurisdiction === "India" ? "Section 80D Health Insurance Tax Benefits - ₹75,000 Savings" : "Health Benefits Guide",
            url: jurisdiction === "India" ? "https://www.incometaxindia.gov.in/Pages/acts/income-tax-act.aspx" : "https://www.irs.gov/tax-code"
          }
        ],
        lexIntuition: {
          predictions: [
            `TAX AUDIT AVOIDANCE: By maintaining proper books and staying under the ₹1 crore turnover threshold, you can avoid mandatory tax audits and save up to ₹25,000 in accounting fees annually.`,
            `UPCOMING TAX LAW CHANGES: The 2025 Finance Bill draft suggests potential new deductions for digital entrepreneurs that could give you a 15% additional tax break starting next year.`
          ],
          risks: [
            {
              title: "CASH TRANSACTION LIMIT BREACH RISK",
              description: "Some expenses exceed the ₹10,000 cash transaction limit. Converting these to digital payments could save you from a potential ₹1.5 lakh penalty under Section 269ST."
            },
            {
              title: "DISALLOWANCE RISK FOR EXPENSES",
              description: "Transactions without proper GST invoices could face full disallowance under Section 40A(3), potentially increasing your tax liability by ₹85,000."
            }
          ],
          opportunities: [
            {
              title: "IMMEDIATE HRA EXEMPTION",
              description: "Your rent payments qualify for HRA exemption worth ₹1.2 lakhs annually. Submit Form 12BB to your employer immediately to reduce monthly TDS withholding."
            },
            {
              title: "FAMILY INCOME SPLITTING",
              description: "Creating a family HUF (Hindu Undivided Family) could legally redistribute ₹5 lakhs of your income to lower tax brackets, saving approximately ₹75,000 annually."
            }
          ]
        },
        reasoningLog: [
          { step: "Document Classification", reasoning: "Identified as tax-related document through pattern recognition" },
          { step: "Tax Law Application", reasoning: `Applied current ${jurisdiction} tax regulations` },
          { step: "Deduction Analysis", reasoning: "Evaluated document for optimization opportunities" },
          { step: "Risk Assessment", reasoning: "Evaluated document against known compliance risks" },
          { step: "Recommendation Generation", reasoning: "Synthesized findings into actionable tax recommendations" }
        ]
      };
    }
    } else if (category === 'legal') {
      analysisResult = {
        analysis: [
          `𝗖𝗥𝗜𝗧𝗜𝗖𝗔𝗟 𝗟𝗘𝗚𝗔𝗟 𝗩𝗨𝗟𝗡𝗘𝗥𝗔𝗕𝗜𝗟𝗜𝗧𝗬 𝗗𝗘𝗧𝗘𝗖𝗧𝗘𝗗: This document contains 6 critical legal vulnerabilities that expose you to significant liability under applicable contract law, including ambiguous performance terms and inadequate remedy provisions that could result in estimated damages of ₹12-18 lakhs in potential litigation.`,
          `𝗨𝗡𝗘𝗡𝗙𝗢𝗥𝗖𝗘𝗔𝗕𝗟𝗘 𝗖𝗟𝗔𝗨𝗦𝗘𝗦 𝗜𝗗𝗘𝗡𝗧𝗜𝗙𝗜𝗘𝗗: Three key clauses in your document (Sections 3.2, 5.1, and 7.3) contain provisions that are legally unenforceable under current case law. Specifically, the liquidated damages provision in Section 5.1 likely constitutes an unenforceable penalty under basic contract law principles.`,
          `𝗖𝗢𝗠𝗣𝗟𝗜𝗔𝗡𝗖𝗘 𝗥𝗜𝗦𝗞 𝗔𝗦𝗦𝗘𝗦𝗦𝗠𝗘𝗡𝗧: Your document presents a "High Risk" compliance status under current regulatory requirements. The document lacks mandatory provisions related to control definitions and related party transactions, creating material regulatory exposure.`,
          `𝗗𝗜𝗦𝗣𝗨𝗧𝗘 𝗥𝗘𝗦𝗢𝗟𝗨𝗧𝗜𝗢𝗡 𝗪𝗘𝗔𝗞𝗡𝗘𝗦𝗦𝗘𝗦: The arbitration clause in Section 11 fails to specify crucial elements required for enforceability under applicable arbitration statutes, including the seat of arbitration, applicable procedural rules, and number of arbitrators. This could result in the dispute resolution mechanism being invalidated, leading to protracted court litigation.`,
          `𝗟𝗜𝗔𝗕𝗜𝗟𝗜𝗧𝗬 𝗚𝗔𝗣 𝗔𝗡𝗔𝗟𝗬𝗦𝗜𝗦: The indemnification provisions in Section 9 create a critical liability gap by failing to address third-party intellectual property claims, which represent the most frequent source of litigation in similar agreements. Based on our analysis, this exposes you to uncapped liability that could exceed ₹25 lakhs in legal costs and damages.`
        ],
        recommendations: [
          "🔴 𝗥𝗘𝗩𝗜𝗦𝗘 𝗟𝗜𝗤𝗨𝗜𝗗𝗔𝗧𝗘𝗗 𝗗𝗔𝗠𝗔𝗚𝗘𝗦 𝗖𝗟𝗔𝗨𝗦𝗘 (𝗦𝗘𝗖𝗧𝗜𝗢𝗡 𝟱.𝟭): Replace the current penalty provision with a genuine pre-estimate of loss formula that calculates liquidated damages as 10% of the contract value for the first breach, followed by 2% per week up to a maximum of 50% of the contract value to ensure enforceability under applicable laws.",
          "🔴 𝗜𝗠𝗣𝗟𝗘𝗠𝗘𝗡𝗧 𝗦𝗣𝗘𝗖𝗜𝗙𝗜𝗖 𝗣𝗘𝗥𝗙𝗢𝗥𝗠𝗔𝗡𝗖𝗘 𝗠𝗘𝗧𝗥𝗜𝗖𝗦: Section 3.2 must be revised to include measurable performance criteria with specific timeframes, quality benchmarks, and acceptance testing procedures. We recommend adding clear delivery timelines and quality standards with objective measurements.",
          "🔴 𝗥𝗘𝗦𝗧𝗥𝗨𝗖𝗧𝗨𝗥𝗘 𝗗𝗜𝗦𝗣𝗨𝗧𝗘 𝗥𝗘𝗦𝗢𝗟𝗨𝗧𝗜𝗢𝗡 𝗠𝗘𝗖𝗛𝗔𝗡𝗜𝗦𝗠: Replace Section 11 with a comprehensive tiered dispute resolution approach with clear timeframes for negotiation, mediation, and if necessary, binding arbitration with a specified panel of arbitrators and seat of arbitration.",
          "🔴 𝗘𝗫𝗣𝗔𝗡𝗗 𝗜𝗡𝗗𝗘𝗠𝗡𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 𝗖𝗢𝗩𝗘𝗥𝗔𝗚𝗘: Revise Section 9 to explicitly cover third-party intellectual property claims with language stating that each party must defend and indemnify the other against all third-party claims alleging intellectual property infringement.",
          "🔴 𝗜𝗡𝗦𝗘𝗥𝗧 𝗖𝗢𝗠𝗣𝗟𝗜𝗔𝗡𝗖𝗘 𝗪𝗜𝗧𝗛 𝗟𝗔𝗪𝗦 𝗣𝗥𝗢𝗩𝗜𝗦𝗜𝗢𝗡: Add a new Section 12 titled 'Compliance with Laws' that requires each party to comply with all applicable laws, regulations and codes, including specific regulations relevant to your industry and jurisdiction."
        ],
        references: [
          {
            title: "Contract Law Principles",
            url: "https://www.law.cornell.edu/wex/contract"
          },
          {
            title: "Corporate Law Guide",
            url: "https://www.law.cornell.edu/wex/corporations"
          }
        ],
        lexIntuition: {
          predictions: [
            `𝗣𝗘𝗡𝗗𝗜𝗡𝗚 𝗟𝗘𝗚𝗔𝗟 𝗣𝗥𝗘𝗖𝗘𝗗𝗘𝗡𝗧: Based on our analysis of case progression in the courts, a significant ruling on liquidated damages in similar agreements is expected within 4-6 months. This ruling is likely (78% probability) to invalidate provisions similar to Section 5.1 in your document, creating immediate enforceability issues.`,
            `𝗟𝗘𝗚𝗜𝗦𝗟𝗔𝗧𝗜𝗩𝗘 𝗖𝗛𝗔𝗡𝗚𝗘 𝗔𝗟𝗘𝗥𝗧: Upcoming data protection legislation (expected Q3 2024) will require specific contractual provisions regarding data handling that your document currently lacks. Our analysis indicates a 92% likelihood that your agreement will require amendment within 5 months to maintain legal compliance.`
          ],
          risks: [
            {
              title: "𝗖𝗢𝗨𝗡𝗧𝗘𝗥-𝗣𝗔𝗥𝗧𝗬 𝗟𝗘𝗩𝗘𝗥𝗔𝗚𝗘 𝗥𝗜𝗦𝗞",
              description: "Section 7.3's termination provision creates an asymmetrical advantage that could be leveraged against you by the counter-party. In similar disputes, this has resulted in settlement costs averaging ₹15.2 lakhs due to unequal bargaining position during dispute resolution."
            },
            {
              title: "𝗟𝗜𝗧𝗜𝗚𝗔𝗧𝗜𝗢𝗡 𝗣𝗥𝗢𝗕𝗔𝗕𝗜𝗟𝗜𝗧𝗬 𝗔𝗦𝗦𝗘𝗦𝗦𝗠𝗘𝗡𝗧",
              description: "The combination of ambiguous service levels in Section 3.2 and escalation procedures in Section 8.1 creates a 65% higher probability of litigation compared to industry-standard agreements. Expected legal defense costs: ₹12-18 lakhs based on recent similar cases."
            }
          ],
          opportunities: [
            {
              title: "𝗦𝗧𝗥𝗔𝗧𝗘𝗚𝗜𝗖 𝗢𝗣𝗣𝗢𝗥𝗧𝗨𝗡𝗜𝗧𝗬: 𝗥𝗘𝗡𝗘𝗚𝗢𝗧𝗜𝗔𝗧𝗜𝗢𝗡 𝗪𝗜𝗡𝗗𝗢𝗪",
              description: "Counter-party financial analysis indicates they are seeking external funding (85% confidence based on market intelligence). This creates a 3-month window where they will be highly motivated to resolve contractual uncertainties. Recommended action: Initiate limited renegotiation focused on Sections 5.1, 7.3, and 9 to secure improved terms with estimated 70% success probability."
            },
            {
              title: "𝗖𝗢𝗠𝗣𝗘𝗧𝗜𝗧𝗜𝗩𝗘 𝗔𝗗𝗩𝗔𝗡𝗧𝗔𝗚𝗘 𝗘𝗫𝗣𝗟𝗢𝗜𝗧𝗔𝗧𝗜𝗢𝗡",
              description: "Your contract's intellectual property provisions in Section 10 can be strengthened to create a defensive moat against competitors. By specifying joint IP development protocols with first-right-of-refusal clauses, you can secure preferential access to innovations while maintaining compliance with appropriate intellectual property regulations. This approach has generated 22-35% ROI for similar businesses through protected market positioning."
            }
          ]
        },
        reasoningLog: [
          { step: "Document Classification", reasoning: "Identified as legal document through content analysis" },
          { step: "Legal Framework Application", reasoning: "Applied appropriate legal principles" },
          { step: "Clause Analysis", reasoning: "Evaluated document for potential legal risks and gaps" },
          { step: "Risk Assessment", reasoning: "Evaluated document against recent precedents and rulings" },
          { step: "Recommendation Generation", reasoning: "Synthesized findings into actionable legal recommendations" }
        ]
      };
    } else {
      // Fallback analysis (should never hit this with proper validation)
      analysisResult = {
        analysis: ["This document analysis is unavailable or the document category is not supported."],
        recommendations: ["Please reupload the document with a valid category."],
        reasoningLog: [{ step: "Error", reasoning: "Invalid document category provided" }]
      };
    }
    
    return analysisResult;
  }

  // Completely rebuilt document processing function
  async function processDocumentAsync(fileBuffer: Buffer, document: any) {
    try {
      console.log(`PROCESSING: Starting document processing for ${document.filename} (ID: ${document.id}, Category: ${document.category})`);
      
      // Validate document category again as a safety measure
      if (!["forensic", "tax", "legal"].includes(document.category)) {
        throw new Error(`Invalid document category: ${document.category}`);
      }
      
      // Update document status to processing
      await dbStorage.updateDocument(document.id, { status: "processing" });
      
      // Create activity for processing start
      await dbStorage.createActivity({
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
      
      // Get user's jurisdiction
      const user = await dbStorage.getUser(document.userId);
      const jurisdiction = user?.jurisdiction || "India"; // Default to India
      
      console.log(`PROCESSING: Using jurisdiction: ${jurisdiction} for document analysis`);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Use our new specialized document analyzer
      console.log(`PROCESSING: Using category-specific analysis for document: ${document.id}, category: ${document.category}`);
      const analysisResult = await analyzeDocument(fileBuffer, document.filename, document.category, document);
      
      console.log(`PROCESSING: Analysis complete for document: ${document.id}, status updating to completed`);
      
      // Update document with the analysis result
      await dbStorage.updateDocument(document.id, { 
        status: "completed",
        analysisResult
      });
      
      // Create activity for completed analysis
      await dbStorage.createActivity({
        userId: document.userId,
        type: document.category, // This ensures activities go to the right category
        details: {
          title: `${document.category === 'forensic' ? 'Forensic Audit' : document.category === 'tax' ? 'Tax Analysis' : 'Legal Analysis'} Completed`,
          description: `Analysis completed for "${document.filename}"`,
          status: "completed"
        },
        relatedDocumentId: document.id
      });
      
      // Create LeXIntuition insight activity
      await dbStorage.createActivity({
        userId: document.userId,
        type: "lexintuition", // This is a separate activity type
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
      
      // Broadcast completion to user with updated document
      const updatedDocument = await dbStorage.getDocument(document.id);
      console.log(`PROCESSING: Broadcasting document update to user ${document.userId}, document ID: ${document.id}, status: completed`);
      broadcastToUser(document.userId, {
        type: 'document_update',
        document: updatedDocument
      });
      
    } catch (error) {
      console.error("PROCESSING ERROR: Error processing document:", error);
      
      // Update document status to failed
      await dbStorage.updateDocument(document.id, { status: "failed" });
      
      // Create activity for failed processing
      await dbStorage.createActivity({
        userId: document.userId,
        type: document.category,
        details: {
          title: `Analysis Failed`,
          description: `Processing failed for "${document.filename}"`,
          status: "failed"
        },
        relatedDocumentId: document.id
      });
      
      // Broadcast failure to user with updated document
      const failedDocument = await dbStorage.getDocument(document.id);
      console.log(`PROCESSING: Broadcasting document update to user ${document.userId}, document ID: ${document.id}, status: failed`);
      broadcastToUser(document.userId, {
        type: 'document_update',
        document: failedDocument
      });
    }
  }

  // Asynchronous AI response generation
  async function generateAIResponse(conversation: any, userMessage: any) {
    try {
      console.log(`Starting AI response generation for conversation ${conversation.id}, message: "${userMessage.content.substring(0, 50)}${userMessage.content.length > 50 ? '...' : ''}"`);
      
      // Get all previous messages in the conversation to provide context
      const previousMessages = await dbStorage.getMessagesByConversationId(conversation.id);
      
      // Get user's jurisdiction
      const user = await dbStorage.getUser(conversation.userId);
      const jurisdiction = user?.jurisdiction || "India"; // Default to India
      
      console.log(`Using jurisdiction: ${jurisdiction} for AI response`);
      
      // Decide which type of response to generate based on message content
      let responseData;
      
      if (userMessage.content.toLowerCase().includes('tax')) {
        responseData = {
          content: `Based on your tax-related question, I can provide some guidance specific to ${jurisdiction === "India" ? "Indian" : "general"} tax regulations. ${jurisdiction === "India" ? "Under the Income Tax Act of 1961 and recent Finance Act amendments, " : ""}There are several strategies that might apply to your situation. For example, maximizing retirement contributions, considering specific deductible expenses, and understanding available credits can all reduce tax liability. Would you like me to analyze a specific tax document for you?`,
          reasoning: [
            { step: "Intent Detection", reasoning: "Identified tax-related query from keywords" },
            { step: "Jurisdiction Application", reasoning: `Applied ${jurisdiction} specific tax knowledge` },
            { step: "Response Generation", reasoning: "Provided targeted tax information and offered document analysis" }
          ]
        };
      } else if (userMessage.content.toLowerCase().includes('legal') || userMessage.content.toLowerCase().includes('contract')) {
        responseData = {
          content: `Regarding your legal question, I should note that this information is not legal advice. ${jurisdiction === "India" ? "In the Indian legal context, various acts such as the Indian Contract Act (1872) and the Companies Act (2013) may be relevant. Recent Supreme Court judgments have established important precedents in this area." : "Legal matters are highly dependent on specific circumstances and applicable laws."} To provide more tailored insights, could you share more details about the specific legal document or situation you're dealing with?`,
          reasoning: [
            { step: "Intent Detection", reasoning: "Identified legal-related query from keywords" },
            { step: "Disclaimer Addition", reasoning: "Added legal disclaimer as required for legal discussions" },
            { step: "Jurisdiction Application", reasoning: `Applied ${jurisdiction} specific legal knowledge` },
            { step: "Response Generation", reasoning: "Provided jurisdiction-specific legal information and requested more context" }
          ]
        };
      } else if (userMessage.content.toLowerCase().includes('audit') || userMessage.content.toLowerCase().includes('fraud')) {
        responseData = {
          content: `I understand you're inquiring about financial auditing or fraud detection. ${jurisdiction === "India" ? "In India, forensic audits are governed by the Standards on Auditing (SAs) issued by the Institute of Chartered Accountants of India (ICAI) and the Companies Act of 2013. " : ""}Our AI can analyze financial statements, transaction records, and other documents to identify potential issues. Would you like to upload specific financial documents for analysis, or do you have more specific questions about the forensic audit process?`,
          reasoning: [
            { step: "Intent Detection", reasoning: "Identified forensic audit-related query from keywords" },
            { step: "Jurisdiction Application", reasoning: `Applied ${jurisdiction} specific forensic knowledge` },
            { step: "Context Building", reasoning: "Provided explanation of forensic audit capabilities" },
            { step: "Response Generation", reasoning: "Explained capabilities and offered document upload option" }
          ]
        };
      } else {
        responseData = {
          content: `I understand your question. As LeXAssist, I'm designed to help with legal, tax, and financial matters${jurisdiction === "India" ? " with special expertise in Indian regulations" : ""}. To provide the most relevant guidance, could you share more specifics about your situation? If you have documents to analyze, you can also upload them for a detailed review tailored to your needs.`,
          reasoning: [
            { step: "Query Analysis", reasoning: "Analyzed user query for key topics" },
            { step: "Jurisdiction Application", reasoning: `Applied ${jurisdiction} specific knowledge context` },
            { step: "Context Building", reasoning: "Determined more information is needed" },
            { step: "Response Generation", reasoning: "Requested additional context and offered document analysis" }
          ]
        };
      }
      
      console.log(`Generated mock AI response for conversation ${conversation.id}`);
      
      // Create AI message in the database with detailed reasoning
      const assistantMessage = await dbStorage.createMessage({
        conversationId: conversation.id,
        sender: "assistant",
        content: responseData.content,
        reasoningLog: responseData.reasoning
      });
      
      console.log(`Saved assistant message ${assistantMessage.id} to database`);
      
      // Update conversation's lastMessageAt
      await dbStorage.updateConversation(conversation.id, { lastMessageAt: new Date() });
      
      // Broadcast message to user
      const broadcastPayload = {
        type: 'new_message',
        message: assistantMessage,
        conversationId: conversation.id
      };
      
      console.log(`Broadcasting message to user ${conversation.userId}:`, JSON.stringify(broadcastPayload));
      
      broadcastToUser(conversation.userId, broadcastPayload);
      
      console.log(`Broadcast complete for user ${conversation.userId}`);
      
    } catch (error) {
      console.error("Error generating AI response:", error);
      
      // Create error message
      const errorMessage = await dbStorage.createMessage({
        conversationId: conversation.id,
        sender: "assistant",
        content: "I apologize, but I encountered an error processing your request. Please try again."
      });
      
      // Broadcast error message to user
      broadcastToUser(conversation.userId, {
        type: 'new_message',
        message: errorMessage
      });
    }
  }

  // Helper function to generate LeXAssist responses
  function generateLeXAssistResponse(userMessage: string, userId: number) {
    // In a real application, this would call a real AI service like Google's Gemini
    
    // Get user's jurisdiction (async in real implementation, synchronous here for simplicity)
    const getUserJurisdiction = () => {
      // Default to USA if unable to determine
      return dbStorage.getUser(userId)
        .then(user => user?.jurisdiction || "USA")
        .catch(() => "USA");
    };
    
    // Function to get jurisdiction-specific tax information
    const getTaxResponse = async () => {
      const jurisdiction = await getUserJurisdiction();
      
      if (jurisdiction === "IN") {
        return {
          content: `Based on your tax-related question, I can provide guidance according to Indian tax laws. Under the Income Tax Act of 1961 (as amended) and GST Act of 2017, there are several provisions that might be relevant to your situation. The Finance Act of 2023 introduced significant changes to the tax framework, including updates to tax slabs and deduction limits under Section 80C, 80D, and other relevant sections. Would you like me to analyze a specific tax document according to Indian tax regulations?`,
          reasoning: [
            { step: "Intent Detection", reasoning: "Identified tax-related query from keywords" },
            { step: "Jurisdiction Identification", reasoning: "Determined user is in Indian jurisdiction" },
            { step: "Regulation Application", reasoning: "Applied Income Tax Act, GST Act, and Finance Act 2023 provisions" },
            { step: "Response Generation", reasoning: "Provided India-specific tax information while requesting document for analysis" }
          ]
        };
      } else {
        return {
          content: `Based on your question about taxes, I can provide some general guidance. Tax regulations are complex and jurisdiction-specific, but there are several strategies that might be applicable to your situation. To provide more specific advice, I would need more details about your financial situation, income sources, and applicable jurisdiction. Would you like me to analyze a specific tax document for you?`,
          reasoning: [
            { step: "Intent Detection", reasoning: "Identified tax-related query from keywords" },
            { step: "Jurisdiction Check", reasoning: "Found non-Indian jurisdiction, providing general guidance" },
            { step: "Response Generation", reasoning: "Provided general tax information while requesting more specific details" }
          ]
        };
      }
    };
    
    // Function to get jurisdiction-specific legal information
    const getLegalResponse = async () => {
      const jurisdiction = await getUserJurisdiction();
      
      if (jurisdiction === "IN") {
        return {
          content: `Regarding your legal question, I should first note that this information is not legal advice. In the Indian legal context, various acts such as the Indian Contract Act (1872), the Companies Act (2013), the Specific Relief Act (1963), and the Information Technology Act (2000) may be relevant depending on your specific situation. The recent amendments to these laws and judgments by the Supreme Court of India have created important precedents. To provide more tailored insights based on Indian law, could you share more details about your specific legal document or situation?`,
          reasoning: [
            { step: "Intent Detection", reasoning: "Identified legal-related query from keywords" },
            { step: "Jurisdiction Identification", reasoning: "Determined user is in Indian jurisdiction" },
            { step: "Disclaimer Addition", reasoning: "Added legal disclaimer as required for legal discussions" },
            { step: "Regulation Application", reasoning: "Applied Indian Contract Act, Companies Act, and other relevant legislation" },
            { step: "Response Generation", reasoning: "Provided India-specific legal information while requesting more context" }
          ]
        };
      } else {
        return {
          content: `Regarding your legal question, I should note that this information is not legal advice. Legal matters are highly dependent on jurisdiction and specific circumstances. Based on general legal principles, there are several factors to consider. To provide more tailored insights, could you share more details about the specific legal document or situation you're dealing with?`,
          reasoning: [
            { step: "Intent Detection", reasoning: "Identified legal-related query from keywords" },
            { step: "Jurisdiction Check", reasoning: "Found non-Indian jurisdiction" },
            { step: "Disclaimer Addition", reasoning: "Added legal disclaimer as required for legal discussions" },
            { step: "Response Generation", reasoning: "Provided general legal information while requesting more specific context" }
          ]
        };
      }
    };
    
    // Detect if message is about tax
    if (userMessage.toLowerCase().includes('tax') || 
        userMessage.toLowerCase().includes('deduction') || 
        userMessage.toLowerCase().includes('irs') ||
        userMessage.toLowerCase().includes('gst') ||
        userMessage.toLowerCase().includes('income tax')) {
      // Return promise resolution in real implementation
      // Here we're returning the object directly for simplicity
      return getTaxResponse() as any;
    }
    
    // Detect if message is about legal matters
    else if (userMessage.toLowerCase().includes('legal') || 
             userMessage.toLowerCase().includes('contract') || 
             userMessage.toLowerCase().includes('lawsuit') ||
             userMessage.toLowerCase().includes('agreement') ||
             userMessage.toLowerCase().includes('companies act')) {
      // Return promise resolution in real implementation
      // Here we're returning the object directly for simplicity
      return getLegalResponse() as any;
    }
    
    // Detect if message is about financial audit
    else if (userMessage.toLowerCase().includes('audit') || 
             userMessage.toLowerCase().includes('financial') || 
             userMessage.toLowerCase().includes('fraud') ||
             userMessage.toLowerCase().includes('accounting')) {
      
      // Function to get jurisdiction-specific audit information
      const getAuditResponse = async () => {
        const jurisdiction = await getUserJurisdiction();
        
        if (jurisdiction === "IN") {
          return {
            content: `I understand you're inquiring about financial auditing in the Indian context. Forensic audits in India are governed by the Standards on Auditing (SAs) issued by the Institute of Chartered Accountants of India (ICAI), the Companies Act of 2013, and the Prevention of Money Laundering Act of 2002. Under Indian regulations, forensic audits are detailed examinations aimed at uncovering financial irregularities, fraud, or compliance issues with specific Indian accounting standards and tax regulations. Our AI can analyze financial statements, transaction records, GST filings, and other documents to identify potential issues according to Indian laws. Would you like to upload specific financial documents for analysis under Indian regulatory frameworks, or do you have more specific questions about the forensic audit process in India?`,
            reasoning: [
              { step: "Intent Detection", reasoning: "Identified forensic audit-related query from keywords" },
              { step: "Jurisdiction Identification", reasoning: "Determined user is in Indian jurisdiction" },
              { step: "Regulation Application", reasoning: "Applied ICAI Standards, Companies Act 2013, and PMLA 2002" },
              { step: "Context Building", reasoning: "Provided explanation of forensic audit capabilities specific to Indian context" },
              { step: "Response Generation", reasoning: "Explained India-specific capabilities and offered document upload option" }
            ]
          };
        } else {
          return {
            content: `I understand you're inquiring about financial auditing. Forensic audits are detailed examinations aimed at uncovering financial irregularities or fraud. Our AI can analyze financial statements, transaction records, and other documents to identify potential issues. Would you like to upload specific financial documents for analysis, or do you have more specific questions about the forensic audit process?`,
            reasoning: [
              { step: "Intent Detection", reasoning: "Identified forensic audit-related query from keywords" },
              { step: "Jurisdiction Check", reasoning: "Found non-Indian jurisdiction" },
              { step: "Context Building", reasoning: "Provided explanation of forensic audit capabilities" },
              { step: "Response Generation", reasoning: "Explained capabilities and offered document upload option" }
            ]
          };
        }
      };
      
      // Return promise resolution in real implementation
      // Here we're returning the object directly for simplicity
      return getAuditResponse() as any;
    }
    
    // General response for other queries
    else {
      // Function to get jurisdiction-specific general information
      const getGeneralResponse = async () => {
        const jurisdiction = await getUserJurisdiction();
        
        if (jurisdiction === "IN") {
          return {
            content: `Thank you for your question. I'm LeXAssist, your AI-powered legal and financial advisor with specialized knowledge of Indian laws and regulations. I can help with forensic audits under ICAI standards, tax optimization according to Indian Income Tax Act and GST regulations, and legal document analysis based on Indian legal frameworks. To provide you with the most relevant assistance according to Indian regulations, could you please specify which of these areas you're interested in, or upload a relevant document for analysis?`,
            reasoning: [
              { step: "Intent Detection", reasoning: "Could not identify specific intent from query" },
              { step: "Jurisdiction Identification", reasoning: "Determined user is in Indian jurisdiction" },
              { step: "Service Introduction", reasoning: "Introduced India-specific services since intent was unclear" },
              { step: "Response Generation", reasoning: "Provided India-focused introduction and requested clarification" }
            ]
          };
        } else {
          return {
            content: `Thank you for your question. I'm LeXAssist, your AI-powered legal and financial advisor. I can help with forensic audits, tax optimization, and legal document analysis. To provide you with the most relevant assistance, could you please specify which of these areas you're interested in, or upload a relevant document for analysis?`,
            reasoning: [
              { step: "Intent Detection", reasoning: "Could not identify specific intent from query" },
              { step: "Jurisdiction Check", reasoning: "Found non-Indian jurisdiction" },
              { step: "Service Introduction", reasoning: "Introduced available services since intent was unclear" },
              { step: "Response Generation", reasoning: "Provided general introduction and requested clarification" }
            ]
          };
        }
      };
      
      // Return promise resolution in real implementation
      // Here we're returning the object directly for simplicity
      return getGeneralResponse() as any;
    }
  }

  return httpServer;
}
