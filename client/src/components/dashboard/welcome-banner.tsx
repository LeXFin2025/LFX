import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Globe, FileText, CheckCircle, AlertTriangle } from "lucide-react";

interface WelcomeBannerProps {
  onStartLexAssist: () => void;
}

const WelcomeBanner = ({ onStartLexAssist }: WelcomeBannerProps) => {
  const { user } = useAuth();

  const firstName = user?.firstName || user?.username?.split(' ')[0] || 'User';
  
  return (
    <div className="mb-8 bg-gradient-to-r from-primary to-[hsl(179,48%,32%)] rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-8 md:px-8 md:py-10 flex flex-col md:flex-row items-center justify-between">
        <div className="text-white mb-6 md:mb-0">
          <h1 className="text-2xl md:text-3xl font-serif font-bold">Welcome to LeXFin, {firstName}</h1>
          <p className="mt-2 max-w-2xl">Your AI-powered legal and financial assistant. Upload documents to get instant insights or use LeXAssist to explain your concerns in plain language.</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-white text-primary">
              <BrainCircuit className="h-4 w-4 mr-1" /> LeXIntuition-enabled
            </span>
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-white text-primary">
              <Globe className="h-4 w-4 mr-1" /> {user?.jurisdiction || 'USA'} Jurisdiction
            </span>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Button 
            variant="secondary" 
            className="bg-white hover:bg-gray-50 text-primary-700" 
            onClick={onStartLexAssist}
          >
            <BrainCircuit className="mr-2 h-5 w-5" />
            Start LeXAssist
          </Button>
        </div>
      </div>
      <div className="bg-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center">
            <div className="mr-2 h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Documents</p>
              <p className="text-lg font-semibold">7</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="mr-2 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Compliant Items</p>
              <p className="text-lg font-semibold">14</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="mr-2 h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Alerts</p>
              <p className="text-lg font-semibold">3</p>
            </div>
          </div>
        </div>
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Last scan: 2 hours ago
          </span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
