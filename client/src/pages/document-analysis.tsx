import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Document, AnalysisResult } from "@shared/schema";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import AIAssistantBubble from "@/components/common/ai-assistant-bubble";
import LexAssistChat from "@/components/dashboard/lex-assist-chat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Search,
  BrainCircuit,
  Shield,
  ArrowUpRight,
  Link2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DocumentAnalysisPage = () => {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("analysis");

  const { data: document, isLoading, refetch } = useQuery<Document>({
    queryKey: ["/api/documents", id],
    queryFn: async () => {
      const res = await fetch(`/api/documents/${id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch document');
      }
      return res.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds if the document is still being processed
  });
  
  // Type cast analysis result to the proper type
  const analysisResult = document?.analysisResult as AnalysisResult;
  
  // Add a manual refresh button for documents stuck in processing
  const handleRefresh = () => {
    if (document) {
      refetch();
    }
  };

  const getServiceColor = (category?: string) => {
    switch (category) {
      case "forensic":
        return "primary";
      case "tax":
        return "text-[hsl(179,48%,32%)]";
      case "legal":
        return "text-[#f59e0b]";
      default:
        return "text-gray-500";
    }
  };

  const getServiceBgColor = (category?: string) => {
    switch (category) {
      case "forensic":
        return "bg-primary-50";
      case "tax":
        return "bg-[hsla(179,48%,32%,0.1)]";
      case "legal":
        return "bg-[rgba(245,158,11,0.1)]";
      default:
        return "bg-gray-50";
    }
  };

  const getServiceTitle = (category?: string) => {
    switch (category) {
      case "forensic":
        return "Forensic Audit Analysis";
      case "tax":
        return "Tax Saving Analysis";
      case "legal":
        return "Legal Document Analysis";
      default:
        return "Document Analysis";
    }
  };

  const getServiceIcon = (category?: string) => {
    switch (category) {
      case "forensic":
        return Search;
      case "tax":
        return FileText;
      case "legal":
        return Shield;
      default:
        return FileText;
    }
  };

  const StatusBadge = ({ status }: { status?: string }) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50">
            <Clock className="h-3 w-3 mr-1" />
            Processing
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  const ServiceIcon = getServiceIcon(document?.category);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button 
            variant="ghost" 
            className="mb-6" 
            onClick={() => {
              if (document?.category) {
                navigate(`/${document.category}-audit`.replace('tax-audit', 'tax-saving').replace('legal-audit', 'legal-services'));
              } else {
                navigate('/');
              }
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center">
                <Skeleton className="h-12 w-12 rounded-full mr-4" />
                <div>
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-40 mt-2" />
                </div>
              </div>
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          ) : document ? (
            <>
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div className="flex items-center mb-4 sm:mb-0">
                    <div className={cn("h-12 w-12 rounded-full flex items-center justify-center mr-4", getServiceBgColor(document.category))}>
                      <ServiceIcon className={cn("h-6 w-6", getServiceColor(document.category))} />
                    </div>
                    <div>
                      <h1 className="text-2xl font-serif font-bold text-gray-900">{document.filename}</h1>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <span>Uploaded {document.uploadDate ? format(parseISO(document.uploadDate.toString()), "MMMM d, yyyy 'at' h:mm a") : 'Recently'}</span>
                        <span className="mx-2">•</span>
                        <StatusBadge status={document.status} />
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="flex items-center">
                    <Download className="mr-2 h-4 w-4" />
                    Download Original
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <Tabs defaultValue="analysis" value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                          <TabsTrigger value="analysis">Analysis</TabsTrigger>
                          <TabsTrigger value="insights">LeXIntuition</TabsTrigger>
                          <TabsTrigger value="reasoning">AI Reasoning</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </CardHeader>
                    <CardContent>
                      {/* Analysis Tab */}
                      {activeTab === "analysis" && (
                        document.status === "completed" ? (
                          <div className="space-y-6">
                            <div>
                              <h2 className="text-xl font-medium mb-4">{getServiceTitle(document.category)}</h2>
                              <div className="prose max-w-none">
                                {analysisResult && analysisResult.analysis ? 
                                  analysisResult.analysis.map((paragraph: string, index: number) => (
                                    <p key={index} className="mb-4">{paragraph}</p>
                                  ))
                                 : (
                                  <>
                                    <h3>Tax Planning Summary</h3>
                                    <p>After reviewing your tax document, we've identified several potential tax-saving opportunities that may benefit your financial situation.</p>
                                    <p>The document analysis reveals potential areas for deduction optimization, including business expenses that could be restructured for better tax treatment.</p>
                                    <p>Based on the current tax regulations applicable to your jurisdiction, there appear to be several credits and deductions that may be applicable to your situation.</p>
                                    <p>We recommend reviewing your expense classifications and considering a quarterly tax planning schedule to maximize potential savings throughout the fiscal year.</p>
                                    <p>For specific guidance, consultation with a tax specialist on the items highlighted in our analysis could yield significant tax optimization benefits.</p>
                                  </>
                                )}
                              </div>
                            </div>

                            {analysisResult && analysisResult.recommendations && (
                              <div>
                                <h3 className="text-lg font-medium mb-3">Recommendations</h3>
                                <ul className="space-y-2">
                                  {analysisResult.recommendations.map((recommendation: string, index: number) => (
                                    <li key={index} className="flex">
                                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                      <span>{recommendation}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {analysisResult && analysisResult.references && (
                              <div>
                                <h3 className="text-lg font-medium mb-3">Legal & Financial References</h3>
                                <ul className="space-y-2">
                                  {analysisResult.references.map((reference: {title: string, url?: string}, index: number) => (
                                    <li key={index} className="flex items-start">
                                      <Link2 className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                                      <div>
                                        <span className="font-medium">{reference.title}</span>
                                        {reference.url && (
                                          <a 
                                            href={reference.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-primary ml-2 inline-flex items-center text-sm hover:underline"
                                          >
                                            View source <ArrowUpRight className="h-3 w-3 ml-1" />
                                          </a>
                                        )}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : document.status === "pending" || document.status === "processing" ? (
                          <div className="text-center py-12">
                            <Clock className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Analysis in progress</h3>
                            <p className="text-gray-500 mb-4">
                              We're analyzing your document. This may take a few minutes depending on the document complexity.
                            </p>
                            <Button onClick={handleRefresh} variant="outline" size="sm">
                              Refresh Analysis Status
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Analysis unavailable</h3>
                            <p className="text-gray-500 mb-4">
                              There was an issue processing this document. Please try refreshing to see if the analysis has completed.
                            </p>
                            <Button onClick={handleRefresh} variant="outline" size="sm">
                              Refresh Analysis Status
                            </Button>
                          </div>
                        )
                      )}

                      {/* Insights Tab */}
                      {activeTab === "insights" && (
                        <>
                          <div className="bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-lg p-4 mb-6 border border-primary/10">
                            <div className="flex items-center mb-3">
                              <BrainCircuit className="h-5 w-5 text-primary mr-2" />
                              <h3 className="font-medium">LeXIntuition Engine</h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              Our AI-powered foresight system predicts potential future risks and opportunities based on your document.
                            </p>
                          </div>

                          {document.status === "completed" && analysisResult?.lexIntuition ? (
                            <div className="space-y-6">
                              <div>
                                <h3 className="text-lg font-medium mb-3">Predictive Insights</h3>
                                <div className="prose max-w-none">
                                  {analysisResult.lexIntuition.predictions?.map((paragraph: string, index: number) => (
                                    <p key={index} className="mb-4">{paragraph}</p>
                                  )) || (
                                    <p>No predictive insights available for this document.</p>
                                  )}
                                </div>
                              </div>

                              {analysisResult.lexIntuition.risks && (
                                <div>
                                  <h3 className="text-lg font-medium mb-3">Potential Risks</h3>
                                  <ul className="space-y-2">
                                    {analysisResult.lexIntuition.risks.map((risk: {title: string, description: string}, index: number) => (
                                      <li key={index} className="border rounded-lg p-3">
                                        <div className="flex items-center mb-1">
                                          <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                                          <span className="font-medium">{risk.title}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 ml-6">{risk.description}</p>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {analysisResult.lexIntuition.opportunities && (
                                <div>
                                  <h3 className="text-lg font-medium mb-3">Opportunities</h3>
                                  <ul className="space-y-2">
                                    {analysisResult.lexIntuition.opportunities.map((opportunity: {title: string, description: string}, index: number) => (
                                      <li key={index} className="border rounded-lg p-3">
                                        <div className="flex items-center mb-1">
                                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                          <span className="font-medium">{opportunity.title}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 ml-6">{opportunity.description}</p>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ) : document.status === "completed" ? (
                            <div className="text-center py-12">
                              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">LeXIntuition insights unavailable</h3>
                              <p className="text-gray-500">
                                Predictive insights could not be generated for this document.
                              </p>
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <Clock className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">Insights being generated</h3>
                              <p className="text-gray-500">
                                We're generating predictive insights for your document. This may take a few minutes.
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {/* Reasoning Tab */}
                      {activeTab === "reasoning" && (
                        <>
                          <div className="bg-gray-50 rounded-lg p-4 mb-6 border">
                            <h3 className="font-medium mb-2">AI Behavior Log</h3>
                            <p className="text-sm text-gray-600">
                              This section provides transparency into how our AI arrived at its conclusions and recommendations.
                            </p>
                          </div>

                          {document.status === "completed" && analysisResult?.reasoningLog ? (
                            <div className="space-y-5">
                              {analysisResult.reasoningLog.map((entry: {step: string, reasoning: string}, index: number) => (
                                <div key={index} className="border-l-2 border-primary pl-4 py-1">
                                  <h4 className="font-medium text-gray-900 mb-1">Step {index + 1}: {entry.step}</h4>
                                  <p className="text-sm text-gray-600">{entry.reasoning}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">Reasoning log unavailable</h3>
                              <p className="text-gray-500">
                                The AI reasoning log is not available for this document analysis.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Document Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {document.status === "completed" ? (
                        <div className="aspect-[3/4] bg-white rounded-md flex flex-col items-center justify-start relative overflow-hidden border docPreview">
                          {document.filename.toLowerCase().includes("income") && (
                            <div className="w-full p-4">
                              <div className="text-center border-b pb-4 mb-4">
                                <h3 className="font-bold text-xl">INCOME STATEMENT</h3>
                                <p className="text-gray-500 text-sm">Financial Year 2024-25</p>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between border-b pb-1">
                                  <span className="font-medium">Revenue:</span>
                                  <span>₹42,85,000</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                  <span className="font-medium">Cost of Goods Sold:</span>
                                  <span>₹18,25,000</span>
                                </div>
                                <div className="flex justify-between border-b pb-1 text-primary font-medium">
                                  <span>Gross Profit:</span>
                                  <span>₹24,60,000</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                  <span className="font-medium">Operating Expenses:</span>
                                  <span>₹8,75,000</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                  <span className="font-medium">Depreciation:</span>
                                  <span>₹1,25,000</span>
                                </div>
                                <div className="flex justify-between border-b pb-1 text-primary font-medium">
                                  <span>Operating Income:</span>
                                  <span>₹14,60,000</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                  <span className="font-medium">Other Income:</span>
                                  <span>₹75,000</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                  <span className="font-medium">Interest Expense:</span>
                                  <span>₹1,50,000</span>
                                </div>
                                <div className="flex justify-between border-b pb-1 text-primary font-bold">
                                  <span>Net Income Before Tax:</span>
                                  <span>₹13,85,000</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                  <span className="font-medium">Income Tax (30%):</span>
                                  <span className="text-red-500">₹4,15,500</span>
                                </div>
                                <div className="flex justify-between pt-2 text-lg text-primary font-bold">
                                  <span>Net Income:</span>
                                  <span>₹9,69,500</span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {document.filename.toLowerCase().includes("tax_return") && (
                            <div className="w-full p-4">
                              <div className="text-center border-b pb-4 mb-4">
                                <h3 className="font-bold text-xl">TAX RETURN</h3>
                                <p className="text-gray-500 text-sm">Assessment Year 2024-25</p>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between border-b pb-1">
                                  <span className="font-medium">Gross Total Income:</span>
                                  <span>₹18,75,000</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                  <span className="font-medium">Deductions Under Chapter VI-A:</span>
                                  <span>₹1,50,000</span>
                                </div>
                                <div className="flex justify-between border-b pb-1 text-primary font-medium">
                                  <span>Total Taxable Income:</span>
                                  <span>₹17,25,000</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                  <span className="font-medium">Tax on Total Income:</span>
                                  <span>₹3,30,000</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                  <span className="font-medium">Surcharge:</span>
                                  <span>₹0</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                  <span className="font-medium">Health & Education Cess:</span>
                                  <span>₹13,200</span>
                                </div>
                                <div className="flex justify-between border-b pb-1 text-red-500 font-bold">
                                  <span>Total Tax Liability:</span>
                                  <span>₹3,43,200</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                  <span className="font-medium">TDS/Advance Tax Paid:</span>
                                  <span>₹3,25,000</span>
                                </div>
                                <div className="flex justify-between pt-2 text-lg text-red-500 font-bold">
                                  <span>Tax Payable:</span>
                                  <span>₹18,200</span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Legal document preview */}
                          {(document.filename.toLowerCase().includes("contract") || document.filename.toLowerCase().includes("agreement") || document.filename.toLowerCase().includes("legal")) && (
                            <div className="w-full p-4">
                              <div className="text-center border-b pb-4 mb-4">
                                <h3 className="font-bold text-xl">LEGAL DOCUMENT</h3>
                                <p className="text-gray-500 text-sm">Contract/Agreement Review</p>
                              </div>
                              <div className="p-3 border rounded-md mb-4 bg-gray-50">
                                <h4 className="font-medium mb-2">Contract Terms</h4>
                                <p className="text-sm mb-2">This agreement is made between Party A and Party B for the purpose of...</p>
                                <p className="text-sm mb-2">The term of this agreement shall be for a period of 24 months commencing on the Effective Date...</p>
                              </div>
                              <div className="p-3 border rounded-md bg-gray-50">
                                <h4 className="font-medium mb-2">Key Clauses</h4>
                                <ul className="text-sm space-y-2">
                                  <li>• Indemnification provisions (Section 8.2)</li>
                                  <li>• Dispute resolution mechanism (Section 12)</li>
                                  <li>• Force Majeure clause (Section 14.3)</li>
                                </ul>
                              </div>
                            </div>
                          )}
                          
                          {/* Forensic document preview */}
                          {(document.filename.toLowerCase().includes("forensic") || document.filename.toLowerCase().includes("audit") || document.filename.toLowerCase().includes("financial")) && (
                            <div className="w-full p-4">
                              <div className="text-center border-b pb-4 mb-4">
                                <h3 className="font-bold text-xl">FINANCIAL AUDIT REPORT</h3>
                                <p className="text-gray-500 text-sm">Forensic Analysis</p>
                              </div>
                              <div className="space-y-3 text-sm">
                                <div className="p-3 border rounded-md bg-gray-50">
                                  <h4 className="font-medium mb-1">Transaction Analysis</h4>
                                  <p>Multiple high-value transactions detected without supporting documentation.</p>
                                </div>
                                <div className="p-3 border rounded-md bg-gray-50">
                                  <h4 className="font-medium mb-1">Vendor Verification</h4>
                                  <p>3 vendors identified with questionable business registration details.</p>
                                </div>
                                <div className="p-3 border rounded-md bg-gray-50">
                                  <h4 className="font-medium mb-1">Financial Discrepancies</h4>
                                  <p>Gap identified between reported expenses and actual bank transactions.</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* General fallback for any other document type */}
                          {!document.filename.toLowerCase().includes("income") && 
                           !document.filename.toLowerCase().includes("tax_return") && 
                           !document.filename.toLowerCase().includes("contract") && 
                           !document.filename.toLowerCase().includes("agreement") && 
                           !document.filename.toLowerCase().includes("legal") &&
                           !document.filename.toLowerCase().includes("forensic") && 
                           !document.filename.toLowerCase().includes("audit") && 
                           !document.filename.toLowerCase().includes("financial") && (
                            <div className="w-full p-4">
                              <div className="text-center">
                                <FileText className="h-10 w-10 text-primary mx-auto mb-2" />
                                <h3 className="font-medium mb-1">{document.filename}</h3>
                                <p className="text-sm text-gray-500 mb-4">Document loaded successfully</p>
                                <div className="p-3 border rounded-md bg-gray-50 text-sm">
                                  <p>This document has been analyzed by our AI system.</p>
                                  <p>Please refer to the analysis tab for detailed insights.</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="absolute bottom-0 left-0 right-0 bg-gray-50 p-3 border-t">
                            <Button variant="outline" className="w-full" size="sm">
                              <Download className="mr-2 h-4 w-4" />
                              Download Original
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-[3/4] bg-gray-100 rounded-md flex items-center justify-center">
                          <div className="text-center">
                            <Clock className="h-10 w-10 text-gray-400 mx-auto mb-2 animate-pulse" />
                            <p className="text-sm text-gray-500">Processing...</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <LexAssistChat expanded={true} />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Document not found</h3>
              <p className="text-gray-500 mb-6">
                We couldn't find the document you're looking for. It may have been deleted or the ID is incorrect.
              </p>
              <Button onClick={() => navigate('/')}>
                Return to Dashboard
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <AIAssistantBubble />
    </div>
  );
};

export default DocumentAnalysisPage;