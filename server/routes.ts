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
      
      const document = await dbStorage.getDocument(id);
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
  
  wss.on('connection', (ws: AuthenticatedWebSocket) => {
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
    wss.clients.forEach((client: AuthenticatedWebSocket) => {
      if (client.readyState === WebSocket.OPEN && client.userId === userId) {
        client.send(JSON.stringify(data));
      }
    });
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
          `This document has been analyzed using our forensic audit system specialized for ${jurisdiction === "India" ? "Indian" : "international"} accounting standards.`,
          `We've identified several patterns in this financial document that require your attention. Our AI has processed the content and detected relevant indicators for forensic analysis.`,
          `Based on current regulatory frameworks and ${jurisdiction === "India" ? "Indian accounting standards (Ind AS)" : "IFRS/GAAP"}, our analysis shows general compliance with a few exceptions noted below.`,
          `The document has been cross-referenced with similar cases to provide insights tailored to your situation.`,
          `We recommend reviewing the detailed recommendations to identify potential irregularities and ensure compliance.`
        ],
        recommendations: [
          "Review transaction patterns for unusual activities or divergence from standard procedures.",
          "Examine accounting treatments for complex transactions to ensure proper classification.",
          "Verify supporting documentation for high-value or unusual transactions.",
          "Consider implementing additional control mechanisms for areas flagged by our analysis.",
          "Schedule a follow-up review in 3 months to track implementation of recommended changes."
        ],
        references: [
          {
            title: jurisdiction === "India" ? "ICAI Forensic Accounting and Investigation Standards" : "AICPA Forensic & Valuation Services",
            url: jurisdiction === "India" ? "https://www.icai.org/forensic-standards" : "https://www.aicpa.org/forensic-valuation"
          },
          {
            title: jurisdiction === "India" ? "Companies Act, 2013 (Section 143)" : "Sarbanes-Oxley Act",
            url: jurisdiction === "India" ? "https://www.mca.gov.in/Ministry/pdf/CompaniesAct2013.pdf" : "https://www.sec.gov/about/laws/soa2002.pdf"
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
      analysisResult = {
        analysis: [
          `This document has been analyzed using our tax optimization system specialized for ${jurisdiction === "India" ? "Indian tax regulations" : "international taxation"}.`,
          `We've identified several tax-related insights in this document. Our AI has processed the content and detected relevant patterns for tax planning opportunities.`,
          `Based on current ${jurisdiction === "India" ? "Indian tax laws including Income Tax Act of 1961 and GST regulations" : "tax regulations"}, our analysis shows multiple opportunities for optimization.`,
          `The document has been cross-referenced with thousands of similar cases to provide insights tailored to your situation.`,
          `We recommend reviewing the detailed recommendations to ensure full compliance and to take advantage of potential tax saving opportunities.`
        ],
        recommendations: [
          "Consider restructuring certain expense classifications to maximize deduction potential.",
          "Review existing tax asset depreciation schedules for optimization opportunities.",
          "Examine potential tax credits that may apply to your specific situation.",
          "Implement quarterly tax planning reviews to proactively identify saving opportunities.",
          "Consider consultation with a tax specialist on specific items flagged in our analysis."
        ],
        references: [
          {
            title: jurisdiction === "India" ? "Income Tax Act, 1961 (As Amended)" : "Internal Revenue Code",
            url: jurisdiction === "India" ? "https://www.incometaxindia.gov.in/Pages/acts/income-tax-act.aspx" : "https://www.irs.gov/tax-code"
          },
          {
            title: jurisdiction === "India" ? "GST Act, 2017" : "Sales Tax Regulations",
            url: jurisdiction === "India" ? "https://www.gst.gov.in" : "https://www.tax.gov/sales-tax"
          }
        ],
        lexIntuition: {
          predictions: [
            `Based on your current tax structure, we predict potential for 10-15% tax savings through strategic restructuring and timing of transactions.`,
            `Future tax rate changes in ${jurisdiction === "India" ? "upcoming Finance Bills" : "proposed legislation"} could impact your current strategy within the next 18 months.`
          ],
          risks: [
            {
              title: "Documentation Completeness",
              description: "Some claimed deductions may require additional supporting documentation to withstand scrutiny."
            },
            {
              title: "Classification Consistency",
              description: "Inconsistent expense classifications could trigger questions during tax reviews."
            }
          ],
          opportunities: [
            {
              title: "Deduction Optimization",
              description: "Restructuring certain business expenses could increase deduction eligibility by approximately 8-12%."
            },
            {
              title: "Tax Credit Utilization",
              description: "You may qualify for additional tax credits based on business activities reflected in your documentation."
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
    } else if (category === 'legal') {
      analysisResult = {
        analysis: [
          `This document has been analyzed using our legal analysis system specialized for ${jurisdiction === "India" ? "Indian legal framework" : "international legal standards"}.`,
          `We've identified several legal insights in this document. Our AI has processed the content and detected relevant patterns and terms that require attention.`,
          `Based on current ${jurisdiction === "India" ? "Indian legal framework including Contract Act (1872) and Companies Act (2013)" : "legal precedents and practices"}, our analysis shows several areas for consideration.`,
          `The document has been cross-referenced with similar cases to provide insights tailored to your situation.`,
          `We recommend reviewing the detailed recommendations to ensure legal compliance and to address potential concerns in the document.`
        ],
        recommendations: [
          "Review key contract terms for ambiguities that could lead to interpretation disputes.",
          "Consider strengthening language around obligations and performance criteria.",
          "Examine liability clauses to ensure they provide adequate protection.",
          "Update language to reflect current legal standards and precedents.",
          "Add specific definitions for technical terms to prevent misunderstandings."
        ],
        references: [
          {
            title: jurisdiction === "India" ? "Indian Contract Act, 1872" : "Contract Law Principles",
            url: jurisdiction === "India" ? "https://www.indiacode.nic.in/handle/123456789/2187" : "https://www.law.cornell.edu/wex/contract"
          },
          {
            title: jurisdiction === "India" ? "Companies Act, 2013" : "Corporate Law Guide",
            url: jurisdiction === "India" ? "https://www.mca.gov.in/Ministry/pdf/CompaniesAct2013.pdf" : "https://www.law.cornell.edu/wex/corporations"
          }
        ],
        lexIntuition: {
          predictions: [
            `Based on current legal trends, similar documents have faced challenges in enforceability of certain clauses within the next 12-24 months.`,
            `Future legislative changes could impact the effectiveness of certain provisions outlined in this document.`
          ],
          risks: [
            {
              title: "Ambiguous Language",
              description: "Several key provisions contain language that could be subject to multiple interpretations."
            },
            {
              title: "Enforceability Concerns",
              description: "Some clauses may not be fully enforceable under current precedents and statutes."
            }
          ],
          opportunities: [
            {
              title: "Clarification Enhancements",
              description: "Adding specific performance metrics could reduce dispute potential by approximately 40%."
            },
            {
              title: "Modernization Updates",
              description: "Updating language to reflect current legal standards could strengthen the document's resilience."
            }
          ]
        },
        reasoningLog: [
          { step: "Document Classification", reasoning: "Identified as legal document through content analysis" },
          { step: "Legal Framework Application", reasoning: `Applied ${jurisdiction} legal principles` },
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
      broadcastToUser(conversation.userId, {
        type: 'message_update',
        conversationId: conversation.id,
        message: assistantMessage
      });
      
      console.log(`Broadcast message to user ${conversation.userId}`);
      
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
        type: 'message_update',
        conversationId: conversation.id,
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
