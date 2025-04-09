import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  Bell, 
  Menu, 
  X,
  LayoutDashboard,
  Search,
  DollarSign,
  Scale,
  Settings
} from "lucide-react";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    if (user?.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return "JD";
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 md:justify-start md:space-x-10">
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <Link href="/" className="flex items-center">
              <span className="sr-only">LeXFin</span>
              <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center text-white font-bold text-xl mr-2">L</div>
              <span className="text-xl font-serif font-bold text-primary">LeX<span className="text-[hsl(179,48%,32%)]">Fin</span></span>
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="-mr-2 -my-2 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open menu</span>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              href="/" 
              className={`text-base font-medium ${isActive('/') ? 'text-gray-900 border-b-2 border-primary' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Dashboard
            </Link>
            <Link 
              href="/forensic-audit"
              className={`text-base font-medium ${isActive('/forensic-audit') ? 'text-gray-900 border-b-2 border-primary' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Forensic Audit
            </Link>
            <Link 
              href="/tax-saving"
              className={`text-base font-medium ${isActive('/tax-saving') ? 'text-gray-900 border-b-2 border-primary' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Tax Saving
            </Link>
            <Link 
              href="/legal-services"
              className={`text-base font-medium ${isActive('/legal-services') ? 'text-gray-900 border-b-2 border-primary' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Legal Services
            </Link>
          </nav>
          
          <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
            <div className="flex items-center space-x-2">
              <span className="inline-flex relative">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">View notifications</span>
                  <Bell className="h-5 w-5" />
                </Button>
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-[#f59e0b] ring-2 ring-white"></span>
              </span>
              
              <Button variant="ghost" className="flex items-center max-w-xs rounded-full">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-medium">
                  {getUserInitials()}
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-0 inset-x-0 pt-2 transition transform origin-top-right z-50">
          <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white divide-y-2 divide-gray-50">
            <div className="pt-5 pb-6 px-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-bold text-lg">L</div>
                </div>
                <div className="-mr-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMobileMenu}
                  >
                    <span className="sr-only">Close menu</span>
                    <X className="h-6 w-6" />
                  </Button>
                </div>
              </div>
              <div className="mt-6">
                <nav className="grid gap-y-8">
                  <Link 
                    href="/"
                    className="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50"
                    onClick={toggleMobileMenu}
                  >
                    <LayoutDashboard className="text-primary h-6 w-6 flex-shrink-0 mr-3" />
                    <span className="text-base font-medium text-gray-900">Dashboard</span>
                  </Link>
                  <Link 
                    href="/forensic-audit"
                    className="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50"
                    onClick={toggleMobileMenu}
                  >
                    <Search className="text-primary h-6 w-6 flex-shrink-0 mr-3" />
                    <span className="text-base font-medium text-gray-900">Forensic Audit</span>
                  </Link>
                  <Link 
                    href="/tax-saving"
                    className="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50"
                    onClick={toggleMobileMenu}
                  >
                    <DollarSign className="text-primary h-6 w-6 flex-shrink-0 mr-3" />
                    <span className="text-base font-medium text-gray-900">Tax Saving</span>
                  </Link>
                  <Link 
                    href="/legal-services"
                    className="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50"
                    onClick={toggleMobileMenu}
                  >
                    <Scale className="text-primary h-6 w-6 flex-shrink-0 mr-3" />
                    <span className="text-base font-medium text-gray-900">Legal Services</span>
                  </Link>
                  <div 
                    className="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50 cursor-pointer" 
                    onClick={() => logoutMutation.mutate()}
                  >
                    <Settings className="text-primary h-6 w-6 flex-shrink-0 mr-3" />
                    <span className="text-base font-medium text-gray-900">Logout</span>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
