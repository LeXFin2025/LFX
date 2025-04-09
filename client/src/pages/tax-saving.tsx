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
import { DollarSign, AlertTriangle, CheckCircle, ChevronRight, Clock, FileText, Percent, TrendingDown, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const TaxSavingPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents", "tax"],
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
              <div className="h-12 w-12 bg-[hsla(179,48%,32%,0.1)] rounded-full flex items-center justify-center text-[hsl(179,48%,32%)] mr-4">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-gray-900">Tax Saving / CA</h1>
                <p className="text-gray-600">Strategic tax planning and recommendations to minimize tax liability legally</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="max-w-3xl">
                <h2 className="text-lg font-medium mb-3">Tax Optimization Strategies</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Our AI-powered tax analysis helps identify legitimate tax-saving opportunities based on current tax laws. 
                  Upload your financial documents to receive personalized recommendations that could reduce your tax burden.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Percent className="h-5 w-5 text-[hsl(179,48%,32%)] mr-2" />
                      <h3 className="font-medium">Deduction Analysis</h3>
                    </div>
                    <p className="text-xs text-gray-600">Identify eligible deductions you may have overlooked</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <TrendingDown className="h-5 w-5 text-[hsl(179,48%,32%)] mr-2" />
                      <h3 className="font-medium">Tax Planning</h3>
                    </div>
                    <p className="text-xs text-gray-600">Strategic recommendations to reduce future tax liability</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Calculator className="h-5 w-5 text-[hsl(179,48%,32%)] mr-2" />
                      <h3 className="font-medium">Savings Calculation</h3>
                    </div>
                    <p className="text-xs text-gray-600">Estimate potential tax savings with our AI models</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Your Tax Documents</CardTitle>
                  <CardDescription>Upload tax returns, financial statements, or other relevant documents for analysis</CardDescription>
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
                                    <div className="h-10 w-10 rounded-full bg-[hsla(179,48%,32%,0.1)] flex items-center justify-center mr-4">
                                      <FileText className="h-5 w-5 text-[hsl(179,48%,32%)]" />
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
                              <h3 className="text-lg font-medium text-gray-900 mb-1">No tax documents found</h3>
                              <p className="text-gray-500 mb-4">Upload your tax documents to discover potential savings</p>
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
                  <CardDescription>Recommended documents for tax analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-[hsl(179,48%,32%)] mr-2" />
                      <span className="text-sm font-medium">Tax Returns</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Previous personal or business tax filings</p>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-[hsl(179,48%,32%)] mr-2" />
                      <span className="text-sm font-medium">W-2 Forms</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Income and tax statements from employers</p>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-[hsl(179,48%,32%)] mr-2" />
                      <span className="text-sm font-medium">1099 Forms</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Independent contractor or other income forms</p>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-[hsl(179,48%,32%)] mr-2" />
                      <span className="text-sm font-medium">Business Expenses</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Receipts and records of business-related costs</p>
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

export default TaxSavingPage;
