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
import { 
  Scale, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight, 
  Clock, 
  FileText, 
  BookOpen,
  Shield,
  FileWarning
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const LegalServicesPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents", "legal"],
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
              <div className="h-12 w-12 bg-[rgba(245,158,11,0.1)] rounded-full flex items-center justify-center text-[#f59e0b] mr-4">
                <Scale className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-gray-900">Legal Services</h1>
                <p className="text-gray-600">Comprehensive legal analysis and insights on documents and contracts</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="max-w-3xl">
                <h2 className="text-lg font-medium mb-3">AI-Powered Legal Analysis</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Our advanced AI can analyze legal documents to identify potential issues, risks, and opportunities.
                  Upload contracts, agreements, or other legal documents to receive detailed insights and recommendations.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <BookOpen className="h-5 w-5 text-[#f59e0b] mr-2" />
                      <h3 className="font-medium">Contract Review</h3>
                    </div>
                    <p className="text-xs text-gray-600">Analysis of contract terms, clauses, and potential risks</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Shield className="h-5 w-5 text-[#f59e0b] mr-2" />
                      <h3 className="font-medium">Compliance Check</h3>
                    </div>
                    <p className="text-xs text-gray-600">Verification of regulatory compliance and legal requirements</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <FileWarning className="h-5 w-5 text-[#f59e0b] mr-2" />
                      <h3 className="font-medium">Risk Assessment</h3>
                    </div>
                    <p className="text-xs text-gray-600">Identification of legal vulnerabilities and potential liabilities</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Your Legal Documents</CardTitle>
                  <CardDescription>Upload contracts, agreements, or other legal documents for analysis</CardDescription>
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
                                    <div className="h-10 w-10 rounded-full bg-[rgba(245,158,11,0.1)] flex items-center justify-center mr-4">
                                      <FileText className="h-5 w-5 text-[#f59e0b]" />
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
                              <h3 className="text-lg font-medium text-gray-900 mb-1">No legal documents found</h3>
                              <p className="text-gray-500 mb-4">Upload legal documents to receive expert analysis and insights</p>
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
                  <CardDescription>Recommended documents for legal analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-[#f59e0b] mr-2" />
                      <span className="text-sm font-medium">Contracts</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Business agreements, employment contracts, lease agreements</p>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-[#f59e0b] mr-2" />
                      <span className="text-sm font-medium">Terms of Service</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Website terms, user agreements, privacy policies</p>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-[#f59e0b] mr-2" />
                      <span className="text-sm font-medium">Legal Correspondence</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Letters, notices, and formal communications</p>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-[#f59e0b] mr-2" />
                      <span className="text-sm font-medium">Corporate Documents</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Bylaws, operating agreements, corporate policies</p>
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

export default LegalServicesPage;
