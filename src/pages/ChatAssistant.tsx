import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, Loader2, MapPin, DollarSign, HelpCircle, Plane, AlertTriangle, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useTrips } from "@/hooks/useTrips";
import { useWishlist } from "@/hooks/useWishlist";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// ============================================================================
// System Prompt
// ============================================================================
const SYSTEM_PROMPT = `You are TembeaSave AI, a friendly and knowledgeable travel savings assistant for a Kenyan travel savings platform. You help users with:

1. SAVING GUIDANCE:
- Calculate weekly/monthly savings needed to reach trip goals
- Suggest realistic timelines for savings goals
- Provide budgeting tips for travelers
- Help users understand if their savings goals are achievable
- All amounts should be in KES (Kenyan Shillings)

2. DESTINATION RECOMMENDATIONS:
- Suggest destinations based on budget (in KES)
- Recommend places based on saved amount
- Provide alternatives within budget constraints
- Share travel tips for popular destinations

3. BOOKING HELP:
- Explain travel packages and what's included
- Suggest cheaper alternatives (off-season travel, nearby airports, etc.)
- Explain payment options via Paystack (card, bank, mobile money)
- Help users understand booking policies

4. GENERAL SUPPORT:
- Explain how smart saving works
- Answer questions about missed payments
- Help with account-related queries
- Provide travel planning advice

Always be helpful, encouraging, and practical. Use emojis occasionally to be friendly. 
When discussing savings, be specific with numbers when possible.
All currency amounts should be in KES (Kenyan Shillings). Use the KES symbol or "KES" prefix.
Keep responses concise but informative. Do NOT generate HTML or code in your responses.
IMPORTANT: Never include HTML tags, script tags, or any code in your responses. Use only plain text and markdown formatting (bold with **, bullet points with •, numbered lists).`;

// ============================================================================
// Quick Prompts
// ============================================================================
const QUICK_PROMPTS = [
  { icon: DollarSign, label: "Saving Tips", prompt: "How much should I save weekly for a trip to Diani Beach?" },
  { icon: MapPin, label: "Destinations", prompt: "Recommend destinations I can visit with my current savings" },
  { icon: Plane, label: "Booking", prompt: "Explain how the booking and payment options work" },
  { icon: HelpCircle, label: "How it works", prompt: "How does smart saving work on TembeaSave?" },
];

// ============================================================================
// Security: Sanitize content to prevent XSS
// ============================================================================
function sanitizeAndFormatContent(raw: string): string {
  // First, escape ALL HTML to prevent XSS
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Now safely apply markdown-like formatting on escaped text
  return escaped
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

// ============================================================================
// Rate limiting helper
// ============================================================================
const RATE_LIMIT_MS = 2000; // Min 2 seconds between messages
const MAX_INPUT_LENGTH = 1000; // Max characters per message

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================================
// Chat persistence
// ============================================================================
const STORAGE_KEY = "tsave_chat_history";
const MAX_STORED_MESSAGES = 50;

function loadMessages(): Message[] {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Message[];
      // Only keep messages from this session (less than 2 hours old)
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      return parsed.filter(m => m.timestamp > twoHoursAgo);
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

function saveMessages(messages: Message[]) {
  try {
    // Only store the last N messages
    const toStore = messages.slice(-MAX_STORED_MESSAGES);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// Component
// ============================================================================
const ChatAssistant = () => {
  const { profile } = useAuth();
  const { data: trips } = useTrips();
  const { data: wishlist } = useWishlist();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = loadMessages();
    if (stored.length > 0) return stored;

    // Default welcome message
    return [{
      id: generateId(),
      role: "assistant",
      content: `Hello${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 👋 I'm your TembeaSave travel assistant. I can help you with:

• 💰 **Saving guidance** - Calculate how much to save for your dream trip
• 🌴 **Destination recommendations** - Find places that match your budget
• ✈️ **Booking help** - Understand packages and payment options
• ❓ **General support** - Answer your travel savings questions

What would you like help with today?`,
      timestamp: Date.now(),
    }];
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastSentAt, setLastSentAt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Persist messages to session storage
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Build context about user's data for the AI
  const buildUserContext = useCallback(() => {
    let context = "";

    if (trips && trips.length > 0) {
      const totalSaved = trips.reduce((sum, t) => sum + (t.saved_amount || 0), 0);
      const activeTrips = trips.filter(t => t.status === 'active');
      context += `\n\nUser's current data:
- Total saved across all goals: KES ${totalSaved.toLocaleString()}
- Active savings goals: ${activeTrips.length}`;

      activeTrips.forEach(trip => {
        const progress = ((trip.saved_amount / trip.target_amount) * 100).toFixed(1);
        context += `\n  • ${trip.destination}: KES ${trip.saved_amount.toLocaleString()} / KES ${trip.target_amount.toLocaleString()} (${progress}% complete, target: ${trip.target_date})`;
      });
    }

    if (wishlist && wishlist.length > 0) {
      context += `\n- Wishlist destinations: ${wishlist.map(w => w.destination).join(', ')}`;
    }

    context += `\n- Currency: KES (Kenyan Shillings)`;

    return context;
  }, [trips, wishlist]);

  // ============================================================================
  // Send message
  // ============================================================================
  const handleSend = useCallback(async (messageText?: string) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || isLoading) return;

    // Rate limiting
    const now = Date.now();
    if (now - lastSentAt < RATE_LIMIT_MS) {
      toast({
        title: "Slow down",
        description: "Please wait a moment before sending another message.",
        variant: "destructive",
      });
      return;
    }

    // Input length check
    if (userMessage.length > MAX_INPUT_LENGTH) {
      toast({
        title: "Message too long",
        description: `Please keep your message under ${MAX_INPUT_LENGTH} characters.`,
        variant: "destructive",
      });
      return;
    }

    setLastSentAt(now);
    setError(null);

    const newUserMessage: Message = {
      id: generateId(),
      role: "user",
      content: userMessage,
      timestamp: now,
    };
    setMessages(prev => [...prev, newUserMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey || apiKey === '...00zI' || apiKey.includes('your_')) {
        // No valid API key — use fallback
        await new Promise(resolve => setTimeout(resolve, 800));
        const response = generateFallbackResponse(userMessage);
        setMessages(prev => [...prev, {
          id: generateId(),
          role: "assistant",
          content: response,
          timestamp: Date.now(),
        }]);
        return;
      }

      const userContext = buildUserContext();

      // Build conversation history for Gemini (exclude welcome message)
      const conversationMessages = [...messages];
      if (conversationMessages.length > 0 && conversationMessages[0].role === 'assistant') {
        conversationMessages.shift();
      }

      // Limit history to last 20 messages to avoid token overflow
      const recentHistory = conversationMessages.slice(-20);

      const history = recentHistory.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const contents = [
        ...history,
        { role: 'user', parts: [{ text: userMessage }] }
      ];

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            system_instruction: {
              parts: [{ text: SYSTEM_PROMPT + userContext }]
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            ],
            generationConfig: {
              maxOutputTokens: 1024,
              temperature: 0.7,
              topP: 0.9,
            },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini API error:', response.status, errorData);

        if (response.status === 429) {
          throw new Error('Rate limit reached. Please wait a moment and try again.');
        }
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          throw new Error('AI service configuration issue. Using offline mode.');
        }
        throw new Error('AI service temporarily unavailable.');
      }

      const data = await response.json();

      // Check for safety blocks
      if (data.candidates?.[0]?.finishReason === 'SAFETY') {
        setMessages(prev => [...prev, {
          id: generateId(),
          role: "assistant",
          content: "I'm sorry, I can't respond to that request. Please ask me something about travel savings, destinations, or booking help! 🌴",
          timestamp: Date.now(),
        }]);
        return;
      }

      const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text
        || "I'm sorry, I couldn't process that request. Please try again.";

      setMessages(prev => [...prev, {
        id: generateId(),
        role: "assistant",
        content: assistantMessage,
        timestamp: Date.now(),
      }]);
    } catch (err) {
      console.error('Chat error:', err);

      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';

      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
        toast({
          title: "Request timed out",
          description: "The AI took too long to respond. Please try again.",
          variant: "destructive",
        });
      } else {
        setError(errorMessage);
        // Provide fallback response
        const fallbackResponse = generateFallbackResponse(userMessage);
        setMessages(prev => [...prev, {
          id: generateId(),
          role: "assistant",
          content: fallbackResponse,
          timestamp: Date.now(),
        }]);
      }
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, lastSentAt, messages, buildUserContext, toast]);

  // ============================================================================
  // Clear chat
  // ============================================================================
  const handleClearChat = useCallback(() => {
    setMessages([{
      id: generateId(),
      role: "assistant",
      content: `Chat cleared! 🧹 How can I help you today?

• 💰 **Saving guidance**
• 🌴 **Destination recommendations** 
• ✈️ **Booking help**
• ❓ **General support**`,
      timestamp: Date.now(),
    }]);
    setError(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  // ============================================================================
  // Fallback responses (when Gemini API is unavailable)
  // ============================================================================
  const generateFallbackResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('save') && lowerMessage.includes('week')) {
      const destination = extractDestination(message);
      const estimatedCost = getEstimatedCost(destination);
      const weeklyAmount = Math.ceil(estimatedCost / 12);
      return `Great question! 💰 For a trip to ${destination || 'your destination'}, I'd estimate a budget of around KES ${estimatedCost.toLocaleString()}. 

To reach this goal in 3 months (12 weeks), you'd need to save approximately **KES ${weeklyAmount.toLocaleString()}/week**.

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
      if (totalSaved > 300000) {
        return `Based on your current savings of KES ${totalSaved.toLocaleString()}, here are some amazing destinations you could consider! 🌴

**Within Budget:**
• Zanzibar, Tanzania - ~KES 250,000 (7 days)
• Mombasa, Kenya - ~KES 150,000 (5 days)
• Cape Town, South Africa - ~KES 300,000 (7 days)

**Stretch Goals:**
• Maldives - ~KES 450,000 (5 days)
• Dubai - ~KES 400,000 (5 days)

Would you like more details about any of these?`;
      }
      return `I'd love to recommend some destinations! 🗺️

**Budget-Friendly Options (Under KES 200,000):**
• Diani Beach, Kenya - ~KES 120,000
• Naivasha Getaway - ~KES 80,000
• Mombasa - ~KES 150,000

**Mid-Range (KES 200,000-400,000):**
• Zanzibar - ~KES 250,000
• Rwanda Gorilla Trek - ~KES 350,000

Tell me your budget and I can give personalized recommendations!`;
    }

    if (lowerMessage.includes('package') || lowerMessage.includes('booking') || lowerMessage.includes('payment')) {
      return `Great question about our booking options! ✈️

**How Booking Works:**
1. Browse destinations and packages
2. Choose your preferred package
3. Pay using Paystack (card, bank transfer, or mobile money)

**Payment Options (via Paystack):**
• Card payment (Visa, Mastercard)
• Bank transfer
• Mobile money (M-Pesa)

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
Add funds to your goal via Paystack. We'll track your progress!

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
• Set up regular deposit reminders
• Save smaller amounts more frequently
• Enable savings reminders in your profile

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
    const destinations = ['diani', 'mombasa', 'zanzibar', 'dubai', 'maldives', 'bali', 'paris', 'london', 'nairobi', 'cape town', 'maasai mara', 'nakuru', 'lamu'];
    for (const dest of destinations) {
      if (message.toLowerCase().includes(dest)) {
        return dest.charAt(0).toUpperCase() + dest.slice(1);
      }
    }
    return null;
  };

  const getEstimatedCost = (destination: string | null): number => {
    const costs: Record<string, number> = {
      'Diani': 120000,
      'Mombasa': 150000,
      'Zanzibar': 250000,
      'Dubai': 400000,
      'Maldives': 500000,
      'Bali': 350000,
      'Paris': 450000,
      'London': 500000,
      'Cape town': 300000,
      'Maasai mara': 100000,
      'Nakuru': 60000,
      'Lamu': 80000,
    };
    return destination ? costs[destination] || 200000 : 200000;
  };

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">AI Travel Assistant</h1>
            </div>
            {messages.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear Chat
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Get personalized travel advice, savings tips, and booking help</p>
        </div>

        {/* Quick Prompts */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
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

        {/* Error Banner */}
        {error && (
          <div className="mb-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-sm animate-fade-in">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
            <span className="text-destructive">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-xs"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        <Card className="h-[calc(100vh-280px)] flex flex-col">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
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
                    {/* Safely render content with XSS protection */}
                    <div
                      className="text-sm whitespace-pre-wrap [&_strong]:font-semibold"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeAndFormatContent(message.content)
                      }}
                    />
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
                ref={inputRef}
                placeholder="Ask me anything about travel savings..."
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_LENGTH))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="flex-1"
                disabled={isLoading}
                maxLength={MAX_INPUT_LENGTH}
                aria-label="Chat message input"
              />
              <Button
                onClick={() => handleSend()}
                size="icon"
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Powered by Gemini AI • Your data helps personalize recommendations
              </p>
              {input.length > MAX_INPUT_LENGTH * 0.8 && (
                <p className="text-xs text-muted-foreground">
                  {input.length}/{MAX_INPUT_LENGTH}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatAssistant;
