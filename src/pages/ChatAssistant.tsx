import { useState, useRef, useEffect } from "react";
import { Send, Bot, Loader2, MapPin, DollarSign, HelpCircle, Plane } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useTrips } from "@/hooks/useTrips";
import { useWishlist } from "@/hooks/useWishlist";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are TembeaSave AI, a friendly and knowledgeable travel savings assistant. You help users with:

1. SAVING GUIDANCE:
- Calculate weekly/monthly savings needed to reach trip goals
- Suggest realistic timelines for savings goals
- Provide budgeting tips for travelers
- Help users understand if their savings goals are achievable

2. DESTINATION RECOMMENDATIONS:
- Suggest destinations based on budget
- Recommend places based on saved amount
- Provide alternatives within budget constraints
- Share travel tips for popular destinations

3. BOOKING HELP:
- Explain travel packages and what's included
- Suggest cheaper alternatives (off-season travel, nearby airports, etc.)
- Explain payment options and installment plans
- Help users understand booking policies

4. GENERAL SUPPORT:
- Explain how smart saving works
- Answer questions about missed payments
- Help with account-related queries
- Provide travel planning advice

Always be helpful, encouraging, and practical. Use emojis occasionally to be friendly. 
When discussing savings, be specific with numbers when possible.
If a user mentions a destination, provide relevant cost estimates in USD or their preferred currency.
Keep responses concise but informative.`;

const QUICK_PROMPTS = [
  { icon: DollarSign, label: "Saving Tips", prompt: "How much should I save weekly for a trip to Diani Beach?" },
  { icon: MapPin, label: "Destinations", prompt: "Recommend destinations I can visit with my current savings" },
  { icon: Plane, label: "Booking", prompt: "Explain how the booking and payment options work" },
  { icon: HelpCircle, label: "How it works", prompt: "How does smart saving work on TembeaSave?" },
];

const ChatAssistant = () => {
  const { profile } = useAuth();
  const { data: trips } = useTrips();
  const { data: wishlist } = useWishlist();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 👋 I'm your TembeaSave travel assistant. I can help you with:

• 💰 **Saving guidance** - Calculate how much to save for your dream trip
• 🌴 **Destination recommendations** - Find places that match your budget
• ✈️ **Booking help** - Understand packages and payment options
• ❓ **General support** - Answer your travel savings questions

What would you like help with today?`
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Build context about user's data
  const buildUserContext = () => {
    let context = "";

    if (trips && trips.length > 0) {
      const totalSaved = trips.reduce((sum, t) => sum + (t.saved_amount || 0), 0);
      const activeTrips = trips.filter(t => t.status === 'active');
      context += `\n\nUser's current data:
- Total saved across all goals: $${totalSaved.toLocaleString()}
- Active savings goals: ${activeTrips.length}`;

      activeTrips.forEach(trip => {
        const progress = ((trip.saved_amount / trip.target_amount) * 100).toFixed(1);
        context += `\n  • ${trip.destination}: $${trip.saved_amount.toLocaleString()} / $${trip.target_amount.toLocaleString()} (${progress}% complete, target: ${trip.target_date})`;
      });
    }

    if (wishlist && wishlist.length > 0) {
      context += `\n- Wishlist destinations: ${wishlist.map(w => w.destination).join(', ')}`;
    }

    if (profile?.currency) {
      context += `\n- Preferred currency: ${profile.currency.toUpperCase()}`;
    }

    return context;
  };

  const handleSend = async (messageText?: string) => {
    const userMessage = messageText || input;
    if (!userMessage.trim() || isLoading) return;

    const newUserMessage: Message = { role: "user", content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        // Fallback to simulated responses if no API key
        setTimeout(() => {
          const response = generateFallbackResponse(userMessage);
          setMessages(prev => [...prev, { role: "assistant", content: response }]);
          setIsLoading(false);
        }, 1000);
        return;
      }

      const userContext = buildUserContext();

      // Map messages to Gemini format
      // Filter out initial assistant greeting if present to start with user
      let validMessages = [...messages];
      if (validMessages.length > 0 && validMessages[0].role === 'assistant') {
        validMessages.shift();
      }

      const history = validMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      // Add the new user message
      const contents = [
        ...history,
        { role: 'user', parts: [{ text: userMessage }] }
      ];

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT + userContext }]
          }
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that request. Please try again.";

      setMessages(prev => [...prev, { role: "assistant", content: assistantMessage }]);
    } catch (error) {
      console.error('Chat error:', error);
      const fallbackResponse = generateFallbackResponse(userMessage);
      setMessages(prev => [...prev, { role: "assistant", content: fallbackResponse }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback responses when OpenAI is not configured
  const generateFallbackResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('save') && lowerMessage.includes('week')) {
      const destination = extractDestination(message);
      const estimatedCost = getEstimatedCost(destination);
      const weeklyAmount = Math.ceil(estimatedCost / 12);
      return `Great question! 💰 For a trip to ${destination || 'your destination'}, I'd estimate a budget of around $${estimatedCost.toLocaleString()}. 

To reach this goal in 3 months (12 weeks), you'd need to save approximately **$${weeklyAmount}/week**.

Want me to help you create a savings goal for this trip?`;
    }

    if (lowerMessage.includes('reach') && lowerMessage.includes('month')) {
      return `Let me help you calculate! 📊 

To determine if you can reach your goal in 3 months, I need to know:
1. Your target amount
2. How much you can save weekly

As a general rule, if you can set aside 20-30% of your income for travel savings, you'll reach your goals faster. 

What's your target destination and budget?`;
    }

    if (lowerMessage.includes('recommend') || lowerMessage.includes('destination') || lowerMessage.includes('suggest')) {
      const totalSaved = trips?.reduce((sum, t) => sum + (t.saved_amount || 0), 0) || 0;
      if (totalSaved > 3000) {
        return `Based on your current savings of $${totalSaved.toLocaleString()}, here are some amazing destinations you could consider! 🌴

**Within Budget:**
• Zanzibar, Tanzania - ~$2,500 (7 days)
• Mombasa, Kenya - ~$1,500 (5 days)
• Cape Town, South Africa - ~$3,000 (7 days)

**Stretch Goals:**
• Maldives - ~$4,500 (5 days)
• Dubai - ~$4,000 (5 days)

Would you like more details about any of these?`;
      }
      return `I'd love to recommend some destinations! 🗺️

**Budget-Friendly Options (Under $2,000):**
• Diani Beach, Kenya - ~$1,200
• Naivasha Getaway - ~$800
• Mombasa - ~$1,500

**Mid-Range ($2,000-4,000):**
• Zanzibar - ~$2,500
• Rwanda Gorilla Trek - ~$3,500

Tell me your budget and I can give personalized recommendations!`;
    }

    if (lowerMessage.includes('package') || lowerMessage.includes('booking') || lowerMessage.includes('payment')) {
      return `Great question about our booking options! ✈️

**How Booking Works:**
1. Browse destinations and packages
2. Choose your preferred package
3. Pay using your savings or in installments

**Payment Options:**
• Full payment from savings
• Split payments (50% upfront, 50% before travel)
• Monthly installments

**What's Included in Packages:**
• Accommodation
• Airport transfers
• Selected activities
• Travel insurance (optional)

What destination are you interested in booking?`;
    }

    if (lowerMessage.includes('smart saving') || lowerMessage.includes('how does') || lowerMessage.includes('work')) {
      return `Here's how TembeaSave works! 🎯

**1. Set Your Goal**
Choose a destination and set a target amount and date.

**2. Save Regularly**
Add funds to your goal weekly or monthly. We'll track your progress!

**3. Get Reminders**
We'll remind you about savings and celebrate your milestones! 🎉

**4. Book Your Trip**
Once you've saved enough, book directly through our platform.

**5. Travel!**
Enjoy your well-earned vacation! ✈️

Would you like to create a savings goal now?`;
    }

    if (lowerMessage.includes('miss') && lowerMessage.includes('payment')) {
      return `No worries! Missing a savings deposit happens. 💪

**What Happens:**
• Your goal timeline extends slightly
• No penalties or fees
• You can catch up anytime

**Tips to Stay on Track:**
• Set up automatic transfers
• Save smaller amounts more frequently
• Enable savings reminders

Remember, any progress is good progress! Would you like me to help you adjust your savings plan?`;
    }

    return `I'm here to help you with your travel savings journey! 🌟

I can assist with:
• 💰 Calculating weekly savings for your goals
• 🏝️ Recommending destinations based on your budget
• ✈️ Explaining booking and payment options
• ❓ Answering questions about how TembeaSave works

What would you like to know more about?`;
  };

  const extractDestination = (message: string): string | null => {
    const destinations = ['diani', 'mombasa', 'zanzibar', 'dubai', 'maldives', 'bali', 'paris', 'london', 'nairobi', 'cape town'];
    for (const dest of destinations) {
      if (message.toLowerCase().includes(dest)) {
        return dest.charAt(0).toUpperCase() + dest.slice(1);
      }
    }
    return null;
  };

  const getEstimatedCost = (destination: string | null): number => {
    const costs: Record<string, number> = {
      'Diani': 1500,
      'Mombasa': 1200,
      'Zanzibar': 2500,
      'Dubai': 4000,
      'Maldives': 5000,
      'Bali': 3500,
      'Paris': 4500,
      'London': 5000,
      'Cape Town': 3000,
    };
    return destination ? costs[destination] || 2500 : 2500;
  };

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <Bot className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">AI Travel Assistant</h1>
          </div>
          <p className="text-sm text-muted-foreground">Get personalized travel advice, savings tips, and booking help</p>
        </div>

        {/* Quick Prompts */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {QUICK_PROMPTS.map((prompt, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="flex-shrink-0 text-xs"
              onClick={() => handleSend(prompt.prompt)}
              disabled={isLoading}
            >
              <prompt.icon className="h-3 w-3 mr-1" />
              {prompt.label}
            </Button>
          ))}
        </div>

        <Card className="h-[calc(100vh-280px)] flex flex-col">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 animate-fade-in ${message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={message.role === "user" ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-primary to-secondary text-primary-foreground"}>
                      {message.role === "user" ? (profile?.full_name?.[0] || "U") : <Bot className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`rounded-lg px-4 py-3 max-w-[85%] ${message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                      }`}
                  >
                    <div className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{
                      __html: message.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br/>')
                    }} />
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg px-4 py-3 bg-muted">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ask me anything about travel savings..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                className="flex-1"
                disabled={isLoading}
              />
              <Button onClick={() => handleSend()} size="icon" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Powered by AI • Your data helps personalize recommendations
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatAssistant;
