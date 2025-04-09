import { useState } from "react";
import { Bot, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import LexAssistChat from "@/components/dashboard/lex-assist-chat";
import { cn } from "@/lib/utils";

const AIAssistantBubble = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 md:w-96 rounded-lg shadow-xl overflow-hidden transform transition-all duration-300 ease-in-out">
          <div className="bg-white">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-2 rounded-full h-8 w-8" 
              onClick={toggleAssistant}
            >
              <X className="h-4 w-4" />
            </Button>
            <LexAssistChat expanded={true} />
          </div>
        </div>
      )}
      
      <Button
        className={cn(
          "w-14 h-14 rounded-full shadow-lg",
          isOpen ? "bg-gray-700 hover:bg-gray-800" : "bg-primary hover:bg-primary-600"
        )}
        onClick={toggleAssistant}
      >
        <Bot className="text-white text-2xl" />
      </Button>
    </div>
  );
};

export default AIAssistantBubble;
