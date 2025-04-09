import { useState } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import WelcomeBanner from "@/components/dashboard/welcome-banner";
import ServiceCard from "@/components/dashboard/service-card";
import RecentActivities from "@/components/dashboard/recent-activities";
import QuickUpload from "@/components/dashboard/quick-upload";
import LexAssistChat from "@/components/dashboard/lex-assist-chat";
import AIAssistantBubble from "@/components/common/ai-assistant-bubble";
import { Search, DollarSign, Scale } from "lucide-react";

const DashboardPage = () => {
  const [lexAssistOpen, setLexAssistOpen] = useState(false);
  
  const handleStartLexAssist = () => {
    setLexAssistOpen(true);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <WelcomeBanner onStartLexAssist={handleStartLexAssist} />
          
          <h2 className="text-xl font-serif font-semibold text-gray-900 mb-4">Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <ServiceCard
              title="Forensic Audit"
              description="Detailed financial analysis to uncover potential irregularities, fraud, or improper financial management."
              icon={Search}
              documentCount={2}
              href="/forensic-audit"
              color="primary"
            />
            
            <ServiceCard
              title="Tax Saving / CA"
              description="Strategic tax planning and recommendations to minimize tax liability within legal frameworks."
              icon={DollarSign}
              documentCount={3}
              href="/tax-saving"
              color="secondary"
            />
            
            <ServiceCard
              title="Legal Services"
              description="Comprehensive legal analysis and insights on documents, contracts, and regulatory compliance issues."
              icon={Scale}
              documentCount={2}
              href="/legal-services"
              color="accent"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentActivities />
            </div>
            
            <div>
              <QuickUpload />
              <LexAssistChat expanded={lexAssistOpen} />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      <AIAssistantBubble />
    </div>
  );
};

export default DashboardPage;
