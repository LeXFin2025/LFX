import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Search, 
  DollarSign, 
  Scale, 
  Settings, 
  LogOut,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const [expanded, setExpanded] = useState(true);
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/forensic-audit", icon: Search, label: "Forensic Audit" },
    { href: "/tax-saving", icon: DollarSign, label: "Tax Saving" },
    { href: "/legal-services", icon: Scale, label: "Legal Services" },
  ];

  return (
    <div className={cn("flex h-screen flex-col border-r bg-white", expanded ? "w-64" : "w-16", className)}>
      <div className="flex h-14 items-center border-b px-3">
        {expanded ? (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-bold text-lg mr-2">L</div>
            <span className="text-lg font-serif font-bold text-primary">LeX<span className="text-[hsl(179,48%,32%)]">Fin</span></span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-bold text-lg mx-auto">L</div>
        )}
        <Button variant="ghost" size="icon" className="ml-auto" onClick={toggleSidebar}>
          {expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="flex-1 overflow-auto py-4">
        <ul className="grid gap-1 px-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <a
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {expanded && <span>{item.label}</span>}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t p-2">
        <Button
          variant="ghost"
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          )}
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="h-5 w-5" />
          {expanded && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
