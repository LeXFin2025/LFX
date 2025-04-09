import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import AIAssistantBubble from "@/components/common/ai-assistant-bubble";
import { 
  Clock, 
  Calendar, 
  ArrowUpRight, 
  Ban,
  User,
  FileText,
  Check,
  AlertTriangle,
  Upload,
  File
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Document } from "@shared/schema";

// Define the prediction interface
interface TimeMachinePrediction {
  title: string;
  description: string;
  riskScore: number;
  impact: string;
  timeframe: string;
}

interface TimeMachineResponse {
  predictions: TimeMachinePrediction[];
  analysisContext: string;
  confidenceScore: number;
}

const TimeMachine = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState<string>("tax");
  const [timeframe, setTimeframe] = useState<string>("12-months");
  const [showLoading, setShowLoading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Fetch user's documents
  const { data: documents, isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    queryFn: async () => {
      const response = await fetch('/api/documents');
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    }
  });
  
  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to upload document');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document uploaded successfully",
        description: "Your document has been uploaded and is ready for time machine analysis.",
      });
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Fetch predictions based on selections
  const { data: predictions, isLoading, refetch } = useQuery<TimeMachineResponse>({
    queryKey: ["/api/time-machine", documentType, timeframe],
    queryFn: async () => {
      // Simulate loading
      setShowLoading(true);
      
      // Give a realistic feeling of processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await fetch(`/api/time-machine?documentType=${documentType}&timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch predictions');
      
      setShowLoading(false);
      return response.json();
    },
    enabled: false, // Don't fetch automatically
  });
  
  const handleDocumentTypeSelect = (value: string) => {
    setDocumentType(value);
  };
  
  const handleTimeframeSelect = (value: string) => {
    setTimeframe(value);
  };
  
  const handleGeneratePredictions = () => {
    refetch();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleUploadSubmit = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', documentType);
    formData.append('description', `Time Machine analysis document - ${documentType} category`);
    
    uploadMutation.mutate(formData);
  };
  
  // Function to get risk color based on score
  const getRiskColor = (score: number) => {
    if (score >= 75) return "text-red-600";
    if (score >= 50) return "text-orange-500";
    if (score >= 25) return "text-yellow-500";
    return "text-green-500";
  };
  
  // Function to get risk bg color based on score
  const getRiskBgColor = (score: number) => {
    if (score >= 75) return "bg-red-100";
    if (score >= 50) return "bg-orange-100";
    if (score >= 25) return "bg-yellow-100";
    return "bg-green-100";
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-primary-50 rounded-full flex items-center justify-center text-primary mr-4">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-gray-900">LeXTime Machine™</h1>
                <p className="text-gray-600">Predict future legal and financial risks with AI-powered simulation</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium mb-4">Upload Document for Analysis</h2>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                  />
                  
                  {!selectedFile ? (
                    <div>
                      <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                      <h3 className="text-base font-medium text-gray-900 mb-1">Upload a document</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Upload a tax, legal, or forensic document for time machine analysis
                      </p>
                      <Button onClick={handleUploadClick}>
                        Select File
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <File className="mx-auto h-10 w-10 text-primary mb-3" />
                      <h3 className="text-base font-medium text-gray-900 mb-1">{selectedFile.name}</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        {(selectedFile.size / 1024).toFixed(2)} KB • {selectedFile.type || "Unknown type"}
                      </p>
                      <div className="flex items-center justify-center space-x-3">
                        <Button variant="outline" onClick={handleUploadClick}>
                          Change File
                        </Button>
                        <Button 
                          onClick={handleUploadSubmit} 
                          disabled={uploadMutation.isPending}
                        >
                          {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {documents && documents.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Your Documents</h3>
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                      <ul className="divide-y divide-gray-100">
                        {documents.map((doc) => (
                          <li key={doc.id} className="py-2 px-1 flex items-center">
                            <FileText className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm">{doc.filename}</span>
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
                              {doc.category}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              
              <h2 className="text-lg font-medium mb-4">Simulate Future Risk Exposure</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Document Type
                  </label>
                  <Select onValueChange={handleDocumentTypeSelect} defaultValue="tax">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tax">Tax Documents</SelectItem>
                      <SelectItem value="legal">Legal Documents</SelectItem>
                      <SelectItem value="forensic">Forensic Documents</SelectItem>
                      <SelectItem value="general">General Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prediction Timeframe
                  </label>
                  <Select onValueChange={handleTimeframeSelect} defaultValue="12-months">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6-months">6 Months</SelectItem>
                      <SelectItem value="12-months">12 Months</SelectItem>
                      <SelectItem value="24-months">24 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={handleGeneratePredictions} className="w-full">
                Generate Risk Predictions
              </Button>
              
              <div className="mt-4 text-center text-sm text-gray-500">
                Risk predictions are based on current regulatory trends and legislative patterns in Indian jurisdiction
              </div>
            </div>
          </div>
          
          {showLoading && (
            <div className="py-20 text-center">
              <Clock className="h-12 w-12 mx-auto text-primary animate-pulse mb-4" />
              <h3 className="text-lg font-medium mb-2">Generating risk predictions</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                LeXTime Machine™ is analyzing legal and financial data to project future risks.
                This may take a moment...
              </p>
              <Progress value={65} className="w-64 mx-auto" />
            </div>
          )}
          
          {predictions && !showLoading && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-semibold text-gray-900">Risk Predictions</h2>
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 mr-2">Confidence score:</span>
                  <span className="font-medium">{predictions.confidenceScore}%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {predictions.predictions.slice(0, 3).map((prediction, index) => (
                  <Card key={index} className={`${getRiskBgColor(prediction.riskScore)} border-0`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-medium">{prediction.title}</CardTitle>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(prediction.riskScore)}`}>
                          {prediction.riskScore}% Risk
                        </div>
                      </div>
                      <CardDescription className="mt-1">
                        Expected in {prediction.timeframe}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">{prediction.description}</p>
                      <div className="bg-white rounded-md p-3 text-xs border border-gray-200">
                        <h4 className="font-medium mb-1">Potential Impact:</h4>
                        <p>{prediction.impact}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {predictions.predictions.slice(3, 5).map((prediction, index) => (
                  <Card key={index} className={`${getRiskBgColor(prediction.riskScore)} border-0`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-medium">{prediction.title}</CardTitle>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(prediction.riskScore)}`}>
                          {prediction.riskScore}% Risk
                        </div>
                      </div>
                      <CardDescription className="mt-1">
                        Expected in {prediction.timeframe}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">{prediction.description}</p>
                      <div className="bg-white rounded-md p-3 text-xs border border-gray-200">
                        <h4 className="font-medium mb-1">Potential Impact:</h4>
                        <p>{prediction.impact}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Analysis Context</CardTitle>
                  <CardDescription>
                    How these predictions were generated
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{predictions.analysisContext}</p>
                </CardContent>
              </Card>
              
              <Tabs defaultValue="timeline">
                <TabsList className="mb-4">
                  <TabsTrigger value="timeline">Risk Timeline</TabsTrigger>
                  <TabsTrigger value="actions">Recommended Actions</TabsTrigger>
                  <TabsTrigger value="preview">Document Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="timeline">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="relative">
                        <div className="absolute left-0 top-0 w-0.5 h-full bg-gray-200"></div>
                        
                        {predictions.predictions
                          .sort((a, b) => {
                            const aMonths = parseInt(a.timeframe.split('-')[0]);
                            const bMonths = parseInt(b.timeframe.split('-')[0]);
                            return aMonths - bMonths;
                          })
                          .map((prediction, index) => (
                            <div key={index} className="relative pl-8 pb-8">
                              <div className={`absolute left-0 w-3 h-3 rounded-full ${getRiskBgColor(prediction.riskScore)} border-2 border-white ring-2 ring-primary`}></div>
                              <div className="flex items-start">
                                <Calendar className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                                <span className="text-sm text-gray-500 font-medium">{prediction.timeframe}</span>
                              </div>
                              <h3 className="text-base font-medium mt-1">{prediction.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{prediction.impact}</p>
                            </div>
                          ))
                        }
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="actions">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {predictions.predictions.map((prediction, index) => (
                          <div key={index} className="pb-4 border-b last:border-b-0 last:pb-0">
                            <div className="flex items-start">
                              <ArrowUpRight className={`h-5 w-5 ${getRiskColor(prediction.riskScore)} mr-2 mt-0.5`} />
                              <div>
                                <h3 className="text-base font-medium">{prediction.title}</h3>
                                <p className="text-sm text-gray-600 mt-1 mb-2">
                                  Recommended actions to mitigate this {prediction.riskScore}% risk:
                                </p>
                                <ul className="space-y-2">
                                  <li className="flex items-start text-sm">
                                    <FileText className="h-4 w-4 text-primary mr-2 mt-0.5" />
                                    <span>Review and update documentation with specific provisions for {prediction.title.toLowerCase()}</span>
                                  </li>
                                  <li className="flex items-start text-sm">
                                    <User className="h-4 w-4 text-primary mr-2 mt-0.5" />
                                    <span>Consult with a specialized {prediction.title.includes("Tax") ? "tax advisor" : "legal counsel"} about preemptive measures</span>
                                  </li>
                                  <li className="flex items-start text-sm">
                                    <Ban className="h-4 w-4 text-primary mr-2 mt-0.5" />
                                    <span>Implement specific risk mitigation protocols by {prediction.timeframe.split('-')[0]} months from now</span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="preview">
                  <Card>
                    <CardHeader>
                      <CardTitle>Document Sample Analysis</CardTitle>
                      <CardDescription>
                        Preview of document type used for analysis
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-[3/4] bg-white rounded-md flex flex-col border overflow-hidden">
                        <div className="p-6">
                          {documentType === "tax" && (
                            <div className="space-y-4">
                              <div className="text-center border-b pb-4 mb-4">
                                <h3 className="font-bold text-xl">TAX ANALYSIS REPORT</h3>
                                <p className="text-gray-500 text-sm">Assessment Year 2024-25</p>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-medium text-lg">Tax Structure Analysis</h4>
                                <p className="text-sm text-gray-600">
                                  The current tax structure utilizes Section 80D health insurance deductions and accelerated 
                                  depreciation benefits that may be affected by upcoming regulatory changes. The analysis 
                                  indicates several areas of potential optimization and risk mitigation.
                                </p>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-medium text-lg">Key Financial Indicators</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="border rounded p-3">
                                    <p className="text-sm font-medium">Gross Total Income</p>
                                    <p className="text-lg">₹18,75,000</p>
                                  </div>
                                  <div className="border rounded p-3">
                                    <p className="text-sm font-medium">Deductions Claimed</p>
                                    <p className="text-lg">₹1,50,000</p>
                                  </div>
                                  <div className="border rounded p-3">
                                    <p className="text-sm font-medium">Total Tax Liability</p>
                                    <p className="text-lg">₹3,43,200</p>
                                  </div>
                                  <div className="border rounded p-3">
                                    <p className="text-sm font-medium">Effective Tax Rate</p>
                                    <p className="text-lg">18.3%</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-medium text-lg">Regulatory Compliance Status</h4>
                                <ul className="space-y-2">
                                  <li className="flex items-start">
                                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                                    <span className="text-sm">TDS Compliance: Complete</span>
                                  </li>
                                  <li className="flex items-start">
                                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                                    <span className="text-sm">GST Filing Status: Up to date</span>
                                  </li>
                                  <li className="flex items-start">
                                    <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                                    <span className="text-sm">DTAA Benefits: Requires review</span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          )}
                          
                          {documentType === "legal" && (
                            <div className="space-y-4">
                              <div className="text-center border-b pb-4 mb-4">
                                <h3 className="font-bold text-xl">LEGAL CONTRACT ANALYSIS</h3>
                                <p className="text-gray-500 text-sm">Service Agreement Review</p>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-medium text-lg">Contract Structure Analysis</h4>
                                <p className="text-sm text-gray-600">
                                  This service agreement contains standard provisions for services delivery, payment terms, 
                                  and termination conditions. Several clauses require modernization to align with emerging 
                                  digital contract standards and recent judicial interpretations.
                                </p>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-medium text-lg">Key Clause Assessment</h4>
                                <div className="space-y-2">
                                  <div className="border rounded p-3">
                                    <p className="text-sm font-medium">Force Majeure (Section 14)</p>
                                    <p className="text-sm text-gray-600">
                                      Current clause uses generalized language lacking specific reference to pandemic, 
                                      cyber incidents, and regulatory intervention events.
                                    </p>
                                    <div className="flex items-center mt-1">
                                      <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                                      <span className="text-xs text-yellow-700">Requires update</span>
                                    </div>
                                  </div>
                                  
                                  <div className="border rounded p-3">
                                    <p className="text-sm font-medium">Data Protection (Section 8)</p>
                                    <p className="text-sm text-gray-600">
                                      Limited provisions focused on confidentiality without addressing data localization, 
                                      processing limitations, or subject rights.
                                    </p>
                                    <div className="flex items-center mt-1">
                                      <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                                      <span className="text-xs text-red-700">High risk area</span>
                                    </div>
                                  </div>
                                  
                                  <div className="border rounded p-3">
                                    <p className="text-sm font-medium">Dispute Resolution (Section 22)</p>
                                    <p className="text-sm text-gray-600">
                                      Arbitration clause with outdated procedural references and non-specific venue selection.
                                    </p>
                                    <div className="flex items-center mt-1">
                                      <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                                      <span className="text-xs text-yellow-700">Requires update</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {documentType === "forensic" && (
                            <div className="space-y-4">
                              <div className="text-center border-b pb-4 mb-4">
                                <h3 className="font-bold text-xl">FORENSIC AUDIT REPORT</h3>
                                <p className="text-gray-500 text-sm">Financial Transaction Analysis</p>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-medium text-lg">Transaction Monitoring Analysis</h4>
                                <p className="text-sm text-gray-600">
                                  The current transaction monitoring system employs standard threshold-based alerts with 
                                  limited pattern detection capabilities. Several transactions fall within the monitoring 
                                  gaps that could be affected by upcoming regulatory changes.
                                </p>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-medium text-lg">Key Risk Indicators</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="border rounded p-3">
                                    <p className="text-sm font-medium">Unusual Transaction Rate</p>
                                    <p className="text-lg">2.8%</p>
                                  </div>
                                  <div className="border rounded p-3">
                                    <p className="text-sm font-medium">Documentation Gaps</p>
                                    <p className="text-lg">4.5%</p>
                                  </div>
                                  <div className="border rounded p-3">
                                    <p className="text-sm font-medium">Control Effectiveness</p>
                                    <p className="text-lg">82%</p>
                                  </div>
                                  <div className="border rounded p-3">
                                    <p className="text-sm font-medium">Cross-Border Volume</p>
                                    <p className="text-lg">₹2.4 Cr</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-medium text-lg">Compliance Vulnerability Assessment</h4>
                                <ul className="space-y-2">
                                  <li className="flex items-start">
                                    <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                                    <span className="text-sm">Beneficial ownership verification: Partial compliance</span>
                                  </li>
                                  <li className="flex items-start">
                                    <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                                    <span className="text-sm">Cross-border transaction monitoring: Requires enhancement</span>
                                  </li>
                                  <li className="flex items-start">
                                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                                    <span className="text-sm">Domestic transaction documentation: Compliant</span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          )}
                          
                          {documentType === "general" && (
                            <div className="space-y-4">
                              <div className="text-center border-b pb-4 mb-4">
                                <h3 className="font-bold text-xl">BUSINESS OPERATIONS ANALYSIS</h3>
                                <p className="text-gray-500 text-sm">Corporate Governance Review</p>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-medium text-lg">Governance Structure Analysis</h4>
                                <p className="text-sm text-gray-600">
                                  The current corporate governance framework meets basic regulatory requirements but lacks 
                                  several components that are likely to become mandatory under upcoming Ministry of Corporate 
                                  Affairs guidelines and SEBI regulations.
                                </p>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-medium text-lg">Compliance Status Overview</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="border rounded p-3">
                                    <p className="text-sm font-medium">Board Composition</p>
                                    <div className="flex items-center mt-1">
                                      <Check className="h-4 w-4 text-green-500 mr-1" />
                                      <span className="text-xs">Compliant</span>
                                    </div>
                                  </div>
                                  <div className="border rounded p-3">
                                    <p className="text-sm font-medium">ESG Reporting</p>
                                    <div className="flex items-center mt-1">
                                      <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                                      <span className="text-xs">Significant gaps</span>
                                    </div>
                                  </div>
                                  <div className="border rounded p-3">
                                    <p className="text-sm font-medium">Cybersecurity Framework</p>
                                    <div className="flex items-center mt-1">
                                      <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                                      <span className="text-xs">Partial compliance</span>
                                    </div>
                                  </div>
                                  <div className="border rounded p-3">
                                    <p className="text-sm font-medium">Labor Code Readiness</p>
                                    <div className="flex items-center mt-1">
                                      <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                                      <span className="text-xs">Requires update</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-medium text-lg">Risk Exposure Summary</h4>
                                <p className="text-sm text-gray-600">
                                  The organization maintains moderate compliance with current regulations but faces 
                                  significant exposure to upcoming regulatory changes, particularly in digital 
                                  governance, ESG disclosure, and labor code implementation areas.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          {!predictions && !showLoading && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
              <Clock className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Generate predictions to begin</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Select a document type and timeframe, then click the "Generate Risk Predictions" button above to
                see LeXTime Machine™ predictions about future legal and financial risks.
              </p>
            </div>
          )}
        </div>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>About LeXTime Machine™</CardTitle>
            <CardDescription>
              AI-powered legal-financial future simulation engine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">What It Is</h3>
                <p className="text-sm text-muted-foreground">
                  LeXTime Machine™ doesn't just analyze your documents now — it projects your legal, 
                  financial, and regulatory risk exposure 6, 12, and 24 months into the future based 
                  on real-world trends, pending legislation, behavioral AI, and pattern data.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">What It Does</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Simulates outcomes of current contracts/tax structures</li>
                  <li>• Predicts government regulation impacts</li>
                  <li>• Shows probability scores (like insurance risk)</li>
                  <li>• Suggests proactive clauses or financial models</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Why It's Unique</h3>
                <p className="text-sm text-muted-foreground">
                  No legaltech, fintech, or regtech platform has proactive simulations of future legal 
                  risk. It's the only tool that tells the future for compliance, contract law, and 
                  finance.
                </p>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-medium mb-2">Support & Feedback</h3>
              <p className="text-sm text-muted-foreground">
                For support, questions, or feedback about LeXTime Machine™, please contact us at: 
                <a href="mailto:support@lexfin.free.nf" className="text-primary mx-1 hover:underline">support@lexfin.free.nf</a>,
                <a href="mailto:info@lexfin.free.nf" className="text-primary mx-1 hover:underline">info@lexfin.free.nf</a>, or 
                <a href="mailto:admin@lexfin.free.nf" className="text-primary mx-1 hover:underline">admin@lexfin.free.nf</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
      <AIAssistantBubble />
    </div>
  );
};

export default TimeMachine;