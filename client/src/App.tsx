import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import DashboardPage from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import ForensicAuditPage from "@/pages/forensic-audit";
import TaxSavingPage from "@/pages/tax-saving";
import LegalServicesPage from "@/pages/legal-services";
import DocumentAnalysisPage from "@/pages/document-analysis";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/forensic-audit" component={ForensicAuditPage} />
      <ProtectedRoute path="/tax-saving" component={TaxSavingPage} />
      <ProtectedRoute path="/legal-services" component={LegalServicesPage} />
      <ProtectedRoute path="/document/:id" component={DocumentAnalysisPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
