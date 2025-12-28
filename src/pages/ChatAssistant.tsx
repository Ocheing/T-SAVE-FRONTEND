import { useState } from "react";
import { Send, Bot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ChatAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your TembeaSave travel assistant. How can I help you plan your next adventure?"
    }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages([...messages, { role: "user", content: input }]);
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm here to help you with travel recommendations, savings tips, and booking assistance. What would you like to know?"
      }]);
    }, 1000);

    setInput("");
  };

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-3xl font-bold mb-1">AI Travel Assistant</h1>
          <p className="text-sm text-muted-foreground">Get personalized travel advice and recommendations</p>
        </div>

        <Card className="h-[calc(100vh-220px)] flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 animate-fade-in ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={message.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}>
                    {message.role === "user" ? "U" : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ask me anything about travel..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                className="flex-1"
              />
              <Button onClick={handleSend} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatAssistant;
