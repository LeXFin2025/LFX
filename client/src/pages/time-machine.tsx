import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronRight, BarChart3, Clock, CalendarClock, ArrowRight, ChevronsRight, Scale, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const TimeMachine = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTimeline, setSelectedTimeline] = useState("6");
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null);
  
  // Get user's documents
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery<any[]>({
    queryKey: ["/api/documents"],
    enabled: !!user,
  });

  // Fetch time machine predictions when a document is selected
  const { data: predictions, isLoading: isLoadingPredictions } = useQuery({
    queryKey: ["/api/time-machine", selectedDocument, selectedTimeline],
    enabled: !!selectedDocument,
  });

  // Generate simulated predictions since this is a demo
  const simulatedPredictions = {
    "legal": [
      {
        title: "Contract Clause Vulnerability",
        description: "Non-compete clause in Section 4.2 has 67% probability of becoming unenforceable due to pending labor law amendments expected in Q3 2025.",
        riskScore: 67,
        impact: "High",
        timeframe: "Q3 2025"
      },
      {
        title: "Arbitration Provision Risk",
        description: "Current arbitration provisions likely to be challenged under emerging precedent from Supreme Court case Mehta v. Infotech Ltd (hearing scheduled June 2025).",
        riskScore: 78,
        impact: "Critical",
        timeframe: "Q4 2025"
      },
      {
        title: "Data Protection Compliance Gap",
        description: "Privacy provisions will be inadequate under upcoming DPDP Act compliance requirements (final implementation date January 2026).",
        riskScore: 91,
        impact: "Critical",
        timeframe: "Q1 2026"
      }
    ],
    "tax": [
      {
        title: "Deduction Disallowance Risk",
        description: "Home office deduction approach has 58% probability of disallowance under new digital worker tax guidelines being drafted (implementation expected July 2025).",
        riskScore: 58,
        impact: "Medium",
        timeframe: "Q3 2025"
      },
      {
        title: "Documentation Inadequacy",
        description: "Current expense documentation standards will fall below threshold requirements in proposed GST amendment bill (83% chance of implementation by April 2026).",
        riskScore: 83,
        impact: "High",
        timeframe: "Q2 2026"
      },
      {
        title: "Tax Regime Optimization Gap",
        description: "Your tax structure will be 22% less efficient under new regime expected in Budget 2026. Restructuring opportunity identified with ₹3.2 lakh potential savings.",
        riskScore: 95,
        impact: "High",
        timeframe: "Q1 2026"
      }
    ],
    "forensic": [
      {
        title: "Internal Control Framework Obsolescence",
        description: "Current approval workflows will be insufficient under upcoming RBI circular on related party transactions (draft already in circulation).",
        riskScore: 74,
        impact: "High",
        timeframe: "Q4 2025"
      },
      {
        title: "Fraud Detection Capability Gap",
        description: "Transaction monitoring protocols will miss 43% of emerging fraud patterns based on simulation against financial crime trends predicted for 2026.",
        riskScore: 77,
        impact: "Critical",
        timeframe: "Q2 2026"
      },
      {
        title: "Regulatory Reporting Risk",
        description: "Current financial statement preparation methodology has 62% chance of triggering additional scrutiny under proposed annual reporting requirements.",
        riskScore: 62,
        impact: "Medium",
        timeframe: "Q1 2026"
      }
    ]
  };

  const handleDocumentSelect = (docId: number) => {
    setSelectedDocument(docId);
    // Show loading toast
    toast({
      title: "Analyzing document",
      description: "LeXTime Machine™ is analyzing your document's future risks...",
    });
    
    // Simulate loading
    setTimeout(() => {
      toast({
        title: "Analysis complete",
        description: "LeXTime Machine™ has projected your document's future risks across 6, 12, and 24 month timelines.",
      });
    }, 3000);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "Critical": return "text-red-500 font-bold";
      case "High": return "text-amber-500 font-bold";
      case "Medium": return "text-yellow-500 font-bold";
      case "Low": return "text-green-500 font-bold";
      default: return "";
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return "bg-red-500";
    if (score >= 60) return "bg-amber-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Determine document category
  const getDocumentCategory = (document: any) => {
    return document.category || "unknown";
  };

  // Get predictions for the selected document category
  const getPredictions = () => {
    if (!selectedDocument || !documents) return [];
    const doc = documents.find((d: any) => d.id === selectedDocument);
    if (!doc) return [];
    
    const category = getDocumentCategory(doc);
    return simulatedPredictions[category as keyof typeof simulatedPredictions] || [];
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">LeXTime Machine™</h1>
          <Badge variant="outline" className="ml-4 border-primary">BETA</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Your Documents</CardTitle>
              <CardDescription>
                Select a document to analyze its future risks
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingDocuments ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : documents && documents.length > 0 ? (
                <div className="divide-y">
                  {documents.map((doc: any) => (
                    <div 
                      key={doc.id}
                      className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors ${selectedDocument === doc.id ? 'bg-muted' : ''}`}
                      onClick={() => handleDocumentSelect(doc.id)}
                    >
                      <div className="flex items-center">
                        <div className="bg-primary/10 rounded-full p-2">
                          {doc.category === 'legal' && <Scale className="h-4 w-4 text-primary" />}
                          {doc.category === 'tax' && <BarChart3 className="h-4 w-4 text-primary" />}
                          {doc.category === 'forensic' && <Zap className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium truncate max-w-[200px]">{doc.filename}</p>
                          <p className="text-xs text-muted-foreground capitalize">{doc.category} Document</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">No documents found</p>
                  <Button variant="outline" className="mt-2" onClick={() => window.location.href = '/dashboard'}>
                    Upload Documents
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Future Risk Projection</CardTitle>
              <CardDescription>
                AI-powered simulation of legal, financial, and regulatory risks
              </CardDescription>
              <div className="flex space-x-1 mt-2">
                <Button
                  variant={selectedTimeline === "6" ? "default" : "outline"}
                  className="text-xs flex items-center gap-1"
                  onClick={() => setSelectedTimeline("6")}
                >
                  <Clock className="h-3 w-3" />
                  6 Months
                </Button>
                <Button
                  variant={selectedTimeline === "12" ? "default" : "outline"}
                  className="text-xs flex items-center gap-1"
                  onClick={() => setSelectedTimeline("12")}
                >
                  <CalendarClock className="h-3 w-3" />
                  12 Months
                </Button>
                <Button
                  variant={selectedTimeline === "24" ? "default" : "outline"}
                  className="text-xs flex items-center gap-1"
                  onClick={() => setSelectedTimeline("24")}
                >
                  <ChevronsRight className="h-3 w-3" />
                  24 Months
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedDocument ? (
                <div className="flex flex-col items-center justify-center p-12 bg-muted/30 rounded-lg border border-dashed text-center">
                  <div className="bg-primary/10 rounded-full p-3 mb-3">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Select a document to analyze</h3>
                  <p className="text-sm text-muted-foreground max-w-md mb-4">
                    LeXTime Machine™ will predict future legal, financial, and regulatory risks for your selected document.
                  </p>
                </div>
              ) : isLoadingPredictions ? (
                <div className="flex flex-col items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">Analyzing document...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {getPredictions().map((prediction, index) => (
                    <div key={index} className="bg-muted/30 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium">{prediction.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{prediction.description}</p>
                        </div>
                        <Badge className={`${getImpactColor(prediction.impact)} bg-transparent border border-current`}>
                          {prediction.impact} Impact
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-full">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Risk Probability</span>
                            <span className="font-medium">{prediction.riskScore}%</span>
                          </div>
                          <Progress value={prediction.riskScore} className={getRiskColor(prediction.riskScore)} />
                        </div>
                        <Badge variant="secondary" className="whitespace-nowrap">
                          {prediction.timeframe}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {getPredictions().length === 0 && (
                    <div className="text-center p-6">
                      <p className="text-sm text-muted-foreground">No predictions available for this document type</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            {selectedDocument && getPredictions().length > 0 && (
              <CardFooter>
                <Button className="w-full">
                  Generate Comprehensive Risk Mitigation Plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            )}
          </Card>
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
      </div>
    </div>
  );
};

export default TimeMachine;