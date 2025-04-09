import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Conversation, InsertMessage, Message } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, SendIcon, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LexAssistChatProps {
  expanded?: boolean;
  conversationId?: number;
}

const LexAssistChat = ({ expanded = false, conversationId }: LexAssistChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userInput, setUserInput] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<number | undefined>(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get or create a conversation
  const { data: conversation, isLoading: isConversationLoading } = useQuery<Conversation>({
    queryKey: ["/api/conversations/active"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/conversations/active");
      return await res.json();
    },
    enabled: !!user && !conversationId,
    onSuccess: (data) => {
      if (data && !selectedConversation) {
        setSelectedConversation(data.id);
      }
    },
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

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const isLoading = isConversationLoading || isMessagesLoading;
  const isPending = createConversationMutation.isPending || sendMessageMutation.isPending;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">LeXAssist</h3>
      </div>
      <div className="p-6">
        <p className="text-sm text-gray-600 mb-4">Explain your legal or financial concerns in plain language and get expert guidance.</p>
        
        {expanded && (
          <div className="h-60 mb-4 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-5 w-1/2 ml-auto" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : messages && messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender === 'user' 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="text-center text-gray-500 h-full flex items-center justify-center">
                <p>No messages yet. Start a conversation!</p>
              </div>
            )}
          </div>
        )}
        
        <div className="rounded-lg border border-gray-300 overflow-hidden">
          <Textarea 
            rows={expanded ? 2 : 3} 
            placeholder="Describe your situation or concern..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="block w-full border-0 resize-none p-3 focus:ring-0 sm:text-sm"
            disabled={isPending}
          />
          <div className="flex justify-between items-center px-3 py-2 bg-gray-50 border-t border-gray-300">
            <div>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <Paperclip className="h-4 w-4 mr-1" />
                Attach
              </Button>
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
