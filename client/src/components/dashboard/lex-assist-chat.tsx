import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Conversation, InsertMessage, Message } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, SendIcon, Loader2, ChevronDown, ChevronUp, RefreshCw, BookOpen, AlertTriangle, BarChart2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LexAssistChatProps {
  expanded?: boolean;
  conversationId?: number;
}

type MessageWithThinking = Message & {
  thinking?: boolean;
  detailedReasoning?: string;
};

const LexAssistChat = ({ expanded = false, conversationId }: LexAssistChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userInput, setUserInput] = useState("");
  const [isExpanded, setIsExpanded] = useState<boolean>(expanded);
  const [selectedConversation, setSelectedConversation] = useState<number | undefined>(conversationId);
  const [isFollowUp, setIsFollowUp] = useState<boolean>(false);
  const [showReasoning, setShowReasoning] = useState<Record<number, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get or create a conversation
  const { data: conversation, isLoading: isConversationLoading } = useQuery<Conversation>({
    queryKey: ["/api/conversations/active"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/conversations/active");
      return await res.json();
    },
    enabled: !!user && !conversationId,
  });

  // Get messages for the selected conversation
  const { data: messages, isLoading: isMessagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/conversations", selectedConversation, "messages"],
    enabled: !!selectedConversation,
  });

  // Create a new conversation if needed
  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/conversations", { userId: user?.id });
      return await res.json();
    },
    onSuccess: (data) => {
      setSelectedConversation(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations/active"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating conversation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send a message
  const sendMessageMutation = useMutation({
    mutationFn: async (message: InsertMessage) => {
      const res = await apiRequest("POST", `/api/conversations/${message.conversationId}/messages`, message);
      return await res.json();
    },
    onSuccess: () => {
      setUserInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    
    if (!selectedConversation) {
      createConversationMutation.mutate();
      return;
    }
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      sender: "user",
      content: userInput,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Set conversation ID when data changes
  useEffect(() => {
    if (conversation && !selectedConversation) {
      setSelectedConversation(conversation.id);
    }
  }, [conversation, selectedConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const isLoading = isConversationLoading || isMessagesLoading;
  const isPending = createConversationMutation.isPending || sendMessageMutation.isPending;

  // Toggle message reasoning
  const toggleReasoning = (messageId: number) => {
    setShowReasoning((prev) => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  // Helper functions for follow-ups and suggestions
  const handleFollowUp = (suggestion: string) => {
    setUserInput(suggestion);
    setIsFollowUp(true);
  };

  // Format messages to add reasoning capabilities
  const formattedMessages = messages?.map(message => {
    // Mock detailed reasoning for assistant messages
    // In a real implementation, this would come from the backend
    const messageWithReasoning = {
      ...message,
      detailedReasoning: message.sender === 'assistant' ? 
        "I've analyzed your question considering Indian legal precedents, tax codes section 80C-80U, and financial regulations. My response integrates the Income Tax Act (1961), latest Finance Bill amendments, and relevant High Court judgements." : 
        undefined
    } as MessageWithThinking;
    
    return messageWithReasoning;
  });

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">LeXAssist</h3>
        {!expanded && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        )}
      </div>
      <div className="p-6">
        {!expanded && !isExpanded ? (
          <p className="text-sm text-gray-600 mb-4">
            Explain your legal or financial concerns in plain language and get expert guidance.
          </p>
        ) : (
          <>
            <div className="flex justify-between items-center mb-3">
              <div className="flex space-x-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Indian Law Expert
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  <BarChart2 className="h-3 w-3 mr-1" />
                  Financial Advisor
                </Badge>
              </div>
              {!expanded && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsExpanded(false)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className={`${expanded ? 'h-[400px]' : 'h-72'} mb-4 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50`}>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-5 w-1/2 ml-auto" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : formattedMessages && formattedMessages.length > 0 ? (
                <div className="space-y-4">
                  {formattedMessages.map((message) => (
                    <div key={message.id}>
                      <div 
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[85%] rounded-lg p-3 ${
                            message.sender === 'user' 
                              ? 'bg-primary text-white' 
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          <div className="mb-1">
                            {message.content}
                          </div>
                          
                          {message.sender === 'assistant' && message.detailedReasoning && (
                            <div className="mt-2 pt-2 border-t border-gray-300 text-xs">
                              <button 
                                onClick={() => toggleReasoning(message.id)}
                                className="flex items-center text-gray-600 hover:text-gray-900"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                {showReasoning[message.id] ? "Hide reasoning" : "Show reasoning"}
                              </button>
                              
                              {showReasoning[message.id] && (
                                <div className="mt-2 text-gray-700">
                                  {message.detailedReasoning}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Quick follow-up suggestions after assistant responses */}
                      {message.sender === 'assistant' && (
                        <div className="flex mt-2 ml-4 space-x-2 overflow-x-auto pb-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-xs whitespace-nowrap"
                                  onClick={() => handleFollowUp("Can you explain this with examples?")}
                                >
                                  Request examples
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ask for real-world examples</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-xs whitespace-nowrap"
                                  onClick={() => handleFollowUp("What are the legal implications?")}
                                >
                                  Legal implications
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ask about legal consequences</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-xs whitespace-nowrap"
                                  onClick={() => handleFollowUp("What's the timeline for this process?")}
                                >
                                  Timeline query
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ask about process timeline</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="text-center text-gray-500 h-full flex flex-col items-center justify-center">
                  <AlertTriangle className="h-10 w-10 text-primary/50 mb-3" />
                  <p className="mb-2 font-medium">No messages yet</p>
                  <p className="text-sm max-w-md">Start a conversation by describing your legal or financial situation in detail for personalized assistance.</p>
                </div>
              )}
            </div>
          </>
        )}
        
        <div className="rounded-lg border border-gray-300 overflow-hidden">
          <Textarea 
            rows={expanded || isExpanded ? 2 : 3} 
            placeholder="Describe your situation or ask a follow-up question..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="block w-full border-0 resize-none p-3 focus:ring-0 sm:text-sm"
            disabled={isPending}
          />
          <div className="flex justify-between items-center px-3 py-2 bg-gray-50 border-t border-gray-300">
            <div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                      <Paperclip className="h-4 w-4 mr-1" />
                      Attach
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Attach relevant documents</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button 
              size="sm" 
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <SendIcon className="h-4 w-4 mr-1" />
              )}
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LexAssistChat;
