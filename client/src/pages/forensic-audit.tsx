import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Document } from "@shared/schema";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import QuickUpload from "@/components/dashboard/quick-upload";
import AIAssistantBubble from "@/components/common/ai-assistant-bubble";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "wouter";
import { Search, AlertTriangle, CheckCircle, ChevronRight, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const ForensicAuditPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch documents with explicit category parameter for forensic category
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents", { category: "forensic" }],
    queryFn: async () => {
      const response = await fetch('/api/documents?category=forensic');
      if (!response.ok) throw new Error('Failed to fetch forensic documents');
      return response.json();
    }
  });
  
  const filteredDocuments = documents?.filter(doc => {
    if (activeTab === "all") return true;
    if (activeTab === "completed") return doc.status === "completed";
    if (activeTab === "pending") return doc.status === "pending" || doc.status === "processing";
    return false;
  });
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-primary-50 rounded-full flex items-center justify-center text-primary mr-4">
                <Search className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-gray-900">Forensic Audit</h1>
                <p className="text-gray-600">Analyze financial documents to detect irregularities and potential fraud</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="max-w-3xl">
                <h2 className="text-lg font-medium mb-3">What is Forensic Audit?</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Forensic audit is a detailed examination of financial records to obtain evidence for legal proceedings. 
                  Our AI-powered analysis can help identify potential fraud, financial misrepresentations, and regulatory non-compliance.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <AlertTriangle className="h-5 w-5 text-primary mr-2" />
                      <h3 className="font-medium">Fraud Detection</h3>
                    </div>
                    <p className="text-xs text-gray-600">Identify suspicious patterns and transactions in financial records</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 text-primary mr-2" />
                      <h3 className="font-medium">Compliance Check</h3>
                    </div>
                    <p className="text-xs text-gray-600">Verify adherence to relevant regulations and financial standards</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Search className="h-5 w-5 text-primary mr-2" />
                      <h3 className="font-medium">Deep Analysis</h3>
                    </div>
                    <p className="text-xs text-gray-600">Thorough examination of financial data with AI-powered insights</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Your Documents</CardTitle>
                  <CardDescription>Upload financial statements, audit reports, or other relevant documents for analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="pending">Pending</TabsTrigger>
                      <TabsTrigger value="completed">Completed</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value={activeTab}>
                      {isLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="border rounded-lg p-4">
                              <div className="flex items-center">
                                <Skeleton className="h-10 w-10 rounded-full mr-4" />
                                <div className="space-y-2">
                                  <Skeleton className="h-4 w-40" />
                                  <Skeleton className="h-3 w-20" />
                                </div>
                                <Skeleton className="h-8 w-24 ml-auto" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          {filteredDocuments && filteredDocuments.length > 0 ? (
                            <div className="space-y-4">
                              {filteredDocuments.map((doc) => (
                                <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                  <div className="flex items-center">
                                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                                      <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                      <h3 className="font-medium text-gray-900">{doc.filename}</h3>
                                      <p className="text-sm text-gray-500">
                                        Uploaded {format(new Date(doc.uploadDate), "MMM d, yyyy")}
                                      </p>
                                    </div>
                                    
                                    <div className="ml-auto flex items-center">
                                      {doc.status === "pending" && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-3">
                                          <Clock className="h-3 w-3 mr-1" />
                                          Pending
                                        </span>
                                      )}
                                      {doc.status === "processing" && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-3">
                                          <Clock className="h-3 w-3 mr-1" />
                                          Processing
                                        </span>
                                      )}
                                      {doc.status === "completed" && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-3">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Completed
                                        </span>
                                      )}
                                      
                                      <Link href={`/document/${doc.id}`}>
                                        <Button size="sm" variant="outline">
                                          View
                                          <ChevronRight className="ml-1 h-4 w-4" />
                                        </Button>
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-1">No documents found</h3>
                              <p className="text-gray-500 mb-4">Upload financial documents to start your forensic audit analysis</p>
                            </div>
                          )}
                        </>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <QuickUpload />
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Common Documents</CardTitle>
                  <CardDescription>Recommended documents for forensic audit</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-primary mr-2" />
                      <span className="text-sm font-medium">Financial Statements</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Balance sheets, income statements, and cash flow statements</p>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-primary mr-2" />
                      <span className="text-sm font-medium">Bank Statements</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Transaction records from financial institutions</p>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-primary mr-2" />
                      <span className="text-sm font-medium">Audit Reports</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Previous audit findings and recommendations</p>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-primary mr-2" />
                      <span className="text-sm font-medium">Expense Reports</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Detailed records of business expenses and claims</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      <AIAssistantBubble />
    </div>
  );
};

export default ForensicAuditPage;
