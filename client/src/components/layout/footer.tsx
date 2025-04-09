import { Globe } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const Footer = () => {
  const [jurisdiction, setJurisdiction] = useState("United States");
  
  const jurisdictions = [
    "United States",
    "European Union",
    "United Kingdom",
    "Canada",
    "Australia"
  ];
  
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-center md:flex-row md:justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-bold text-lg mr-2">L</div>
            <span className="text-lg font-serif font-bold text-primary">LeX<span className="text-[hsl(179,48%,32%)]">Fin</span></span>
          </div>
          <div className="mt-4 md:mt-0">
            <ul className="flex space-x-6">
              <li>
                <Link href="#">
                  <a className="text-sm text-gray-500 hover:text-gray-900">Terms</a>
                </Link>
              </li>
              <li>
                <Link href="#">
                  <a className="text-sm text-gray-500 hover:text-gray-900">Privacy</a>
                </Link>
              </li>
              <li>
                <Link href="#">
                  <a className="text-sm text-gray-500 hover:text-gray-900">Security</a>
                </Link>
              </li>
              <li>
                <Link href="#">
                  <a className="text-sm text-gray-500 hover:text-gray-900">Support</a>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-6 flex flex-col items-center md:flex-row md:justify-between">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} LeXFin. All rights reserved.</p>
          <div className="mt-3 md:mt-0 flex items-center">
            <span className="text-xs text-gray-500 mr-2">Jurisdiction:</span>
            <div className="relative inline-block text-left">
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex justify-center items-center w-full rounded-md border border-gray-300 shadow-sm px-3 py-1 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                  {jurisdiction}
                  <Globe className="h-3 w-3 ml-1" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {jurisdictions.map((j) => (
                    <DropdownMenuItem key={j} onClick={() => setJurisdiction(j)}>
                      {j}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
