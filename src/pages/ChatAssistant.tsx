import { useState, useRef, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faRobot, faSpinner, faLocationDot, faDollarSign, faCircleQuestion, faPlane, faTriangleExclamation, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useTrips } from "@/hooks/useTrips";
import { useWishlist } from "@/hooks/useWishlist";
import { usePublishedDestinations } from "@/hooks/useDestinations";
import { useToast } from "@/hooks/use-toast";
import type { Destination } from "@/types/database.types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// ============================================================================
// System Prompt — gateway-agnostic, dynamic-data-aware
// ============================================================================
const SYSTEM_PROMPT = `You are TembeaSave AI, a friendly and knowledgeable travel savings assistant for a Kenyan travel savings platform. You help users with:

1. SAVING GUIDANCE:
- When a user asks about saving for a trip, FIRST ask which destination or trip they want to save for (e.g. "Which trip or destination would you like to save for?")
- Once they specify a destination, look it up in the AVAILABLE DESTINATIONS data provided below
- If found, calculate and present: estimated total trip cost, suggested monthly savings plan, weekly savings plan, daily savings estimate, approximate time to reach the goal, and practical budgeting tips
- If not found, politely inform the user and suggest similar available destinations from the list
- All amounts should be in KES (Kenyan Shillings)
- Always base savings calculations on real destination prices from the data — never use made-up prices

2. DESTINATION RECOMMENDATIONS:
- When a user asks about destinations, ALWAYS refer to the AVAILABLE DESTINATIONS data provided below
- Do NOT make up destination names or prices — only recommend destinations that exist in the data
- If the user asks about a specific type (beach, adventure, etc.), filter by the categories in the data
- Suggest destinations based on budget (in KES), category preferences, or location
- Share the actual prices from the data

3. BOOKING HELP:
- Explain travel packages and what's included
- Suggest cheaper alternatives (off-season travel, nearby airports, etc.)
- Explain that payments can be completed using the payment methods supported by the platform (card, bank transfer, or mobile money)
- Do NOT mention any specific payment gateway or provider by name
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
  { icon: faDollarSign, label: "Saving Tips", prompt: "I'd like help saving for a trip" },
  { icon: faLocationDot, label: "Destinations", prompt: "What destinations are available?" },
  { icon: faPlane, label: "Booking", prompt: "Explain how the booking and payment options work" },
  { icon: faCircleQuestion, label: "How it works", prompt: "How does smart saving work on TembeaSave?" },
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
// Destination lookup helpers (from live data)
// ============================================================================
function findDestination(query: string, destinations: Destination[]): Destination | null {
  if (!destinations || destinations.length === 0) return null;
  const q = query.toLowerCase().trim();

  // Exact name match first
  const exact = destinations.find(d => d.name.toLowerCase() === q);
  if (exact) return exact;

  // Partial match
  const partial = destinations.find(d =>
    d.name.toLowerCase().includes(q) ||
    d.location?.toLowerCase().includes(q)
  );
  return partial || null;
}

function findSimilarDestinations(query: string, destinations: Destination[], limit = 3): Destination[] {
  if (!destinations || destinations.length === 0) return [];
  const q = query.toLowerCase().trim();

  // Try to find destinations in the same category or location
  const queryWords = q.split(/\s+/);
  return destinations
    .filter(d => {
      const name = d.name.toLowerCase();
      const loc = (d.location || '').toLowerCase();
      const cats = (d.categories || []).map(c => c.toLowerCase());
      return queryWords.some(w =>
        name.includes(w) || loc.includes(w) || cats.some(c => c.includes(w))
      );
    })
    .slice(0, limit);
}

function formatDestinationsList(destinations: Destination[], limit = 5): string {
  if (!destinations || destinations.length === 0) return "No destinations available at the moment.";

  return destinations.slice(0, limit).map(d => {
    const cost = Number(d.estimated_cost).toLocaleString();
    const cats = (d.categories || []).slice(0, 2).join(', ');
    const location = d.location || 'Kenya';
    return `• **${d.name}** — ${location} — KES ${cost}${cats ? ` (${cats})` : ''}`;
  }).join('\n');
}

function generateSavingsPlan(destination: Destination): string {
  const cost = Number(destination.estimated_cost);
  const monthly3 = Math.ceil(cost / 3);
  const monthly6 = Math.ceil(cost / 6);
  const weekly3 = Math.ceil(cost / 12);
  const weekly6 = Math.ceil(cost / 24);
  const daily3 = Math.ceil(cost / 90);
  const daily6 = Math.ceil(cost / 180);

  return `Great choice! Here's a personalized savings plan for **${destination.name}** 🎯

**Estimated Trip Cost:** KES ${cost.toLocaleString()}
📍 ${destination.location || 'Kenya'}

**3-Month Plan (Aggressive):**
• Monthly: KES ${monthly3.toLocaleString()}
• Weekly: KES ${weekly3.toLocaleString()}
• Daily: KES ${daily3.toLocaleString()}

**6-Month Plan (Comfortable):**
• Monthly: KES ${monthly6.toLocaleString()}
• Weekly: KES ${weekly6.toLocaleString()}
• Daily: KES ${daily6.toLocaleString()}

**💡 Budgeting Tips:**
• Set up automatic transfers on payday
• Use the "round-up" method — round daily expenses up and save the difference
• Cut one non-essential expense per week and redirect it to your travel fund
• Track your progress on the dashboard to stay motivated!

Would you like to create a savings goal for this trip? 🌟`;
}

// ============================================================================
// Component
// ============================================================================
const ChatAssistant = () => {
  const { profile } = useAuth();
  const { data: trips } = useTrips();
  const { data: wishlist } = useWishlist();
  const { data: destinations } = usePublishedDestinations();
  const { toast } = useToast();

  // Track conversational state for savings flow
  const [awaitingSavingsDestination, setAwaitingSavingsDestination] = useState(false);

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

    // Include available destinations from the database
    if (destinations && destinations.length > 0) {
      context += `\n\nAVAILABLE DESTINATIONS (from the platform database — use these for recommendations and pricing):`;
      destinations.forEach(d => {
        const cats = (d.categories || []).join(', ');
        context += `\n  • ${d.name} | Location: ${d.location || 'Kenya'} | Cost: KES ${Number(d.estimated_cost).toLocaleString()} | Categories: ${cats || 'general'}`;
      });
    }

    context += `\n- Currency: KES (Kenyan Shillings)`;

    return context;
  }, [trips, wishlist, destinations]);

  // ============================================================================
  // Fallback responses (when Gemini API is unavailable)
  // Uses LIVE destination data from the database
  // ============================================================================
  const generateFallbackResponse = useCallback((message: string): string => {
    const lowerMessage = message.toLowerCase();
    const availableDestinations = destinations || [];

    // --- SAVING TIPS: Ask which destination first ---
    if (lowerMessage.includes('save') || lowerMessage.includes('saving') || lowerMessage.includes('budget')) {
      // Check if user mentioned a specific destination
      const mentionedDest = findDestination(message, availableDestinations);

      if (mentionedDest) {
        return generateSavingsPlan(mentionedDest);
      }

      // No specific destination mentioned — ask which one
      setAwaitingSavingsDestination(true);

      let response = `I'd love to help you create a savings plan! 💰\n\n**Which trip or destination would you like to save for?**`;
      if (availableDestinations.length > 0) {
        response += `\n\nHere are some of our available destinations:\n${formatDestinationsList(availableDestinations, 5)}`;
        response += `\n\nJust tell me the name of the destination and I'll calculate a personalized savings plan for you! 😊`;
      }
      return response;
    }

    // --- CAN I REACH MY GOAL? ---
    if (lowerMessage.includes('reach') && lowerMessage.includes('month')) {
      return `Let me help you calculate! 📊 

To determine if you can reach your goal in 3 months, I need to know:
1. Your target amount
2. How much you can save weekly

As a general rule, if you can set aside 20-30% of your income for travel savings, you'll reach your goals faster. 

What's your target destination and budget?`;
    }

    // --- DESTINATION RECOMMENDATIONS: Always use live data ---
    if (lowerMessage.includes('recommend') || lowerMessage.includes('destination') || lowerMessage.includes('suggest') || lowerMessage.includes('where') || lowerMessage.includes('beach') || lowerMessage.includes('adventure') || lowerMessage.includes('available')) {
      if (availableDestinations.length === 0) {
        return `We're currently updating our destination catalog. Please check back soon or visit the Destinations page for the latest offerings! 🌍`;
      }

      const totalSaved = trips?.reduce((sum, t) => sum + (t.saved_amount || 0), 0) || 0;

      // Check if user asked for a specific category
      const categoryKeywords = ['beach', 'mountain', 'city', 'adventure', 'cultural', 'event'];
      const requestedCategory = categoryKeywords.find(cat => lowerMessage.includes(cat));

      let filteredDests = availableDestinations;
      if (requestedCategory) {
        filteredDests = availableDestinations.filter(d =>
          (d.categories || []).some(c => c.toLowerCase().includes(requestedCategory))
        );
        if (filteredDests.length === 0) {
          return `I don't have any **${requestedCategory}** destinations at the moment, but here are all our available destinations:\n\n${formatDestinationsList(availableDestinations)}\n\nWould you like details about any of these? 🌟`;
        }
      }

      // Budget-aware recommendations
      if (totalSaved > 0) {
        const withinBudget = filteredDests.filter(d => Number(d.estimated_cost) <= totalSaved);
        const stretch = filteredDests.filter(d => Number(d.estimated_cost) > totalSaved && Number(d.estimated_cost) <= totalSaved * 1.5);

        let response = `Based on your current savings of KES ${totalSaved.toLocaleString()}, here are some destinations! 🌴\n`;

        if (withinBudget.length > 0) {
          response += `\n**Within Your Budget:**\n${formatDestinationsList(withinBudget)}`;
        }
        if (stretch.length > 0) {
          response += `\n\n**Stretch Goals (save a bit more!):**\n${formatDestinationsList(stretch, 3)}`;
        }
        if (withinBudget.length === 0 && stretch.length === 0) {
          response += `\nKeep saving! Here are some goals to work towards:\n${formatDestinationsList(filteredDests)}`;
        }
        response += `\n\nWould you like a savings plan for any of these?`;
        return response;
      }

      return `Here are our available destinations! 🗺️\n\n${formatDestinationsList(filteredDests)}\n\nTell me your budget and I can give personalized recommendations!`;
    }

    // --- BOOKING / PAYMENT: No Paystack mention ---
    if (lowerMessage.includes('package') || lowerMessage.includes('booking') || lowerMessage.includes('payment') || lowerMessage.includes('pay') || lowerMessage.includes('book')) {
      return `Great question about our booking options! ✈️

**How Booking Works:**
1. Browse destinations and packages
2. Choose your preferred package
3. Complete payment using the supported payment methods on the platform

**Payment Options:**
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

    // --- HOW IT WORKS ---
    if (lowerMessage.includes('smart saving') || lowerMessage.includes('how does') || lowerMessage.includes('work')) {
      return `Here's how TembeaSave works! 🎯

**1. Set Your Goal**
Choose a destination and set a target amount and date.

**2. Save Regularly**
Add funds to your savings goal using the supported payment methods. We'll track your progress!

**3. Get Reminders**
We'll remind you about savings and celebrate your milestones! 🎉

**4. Book Your Trip**
Once you've saved enough, book directly through our platform.

**5. Travel!**
Enjoy your well-earned vacation! ✈️

Would you like to create a savings goal now?`;
    }

    // --- MISSED PAYMENTS ---
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

    // --- DEFAULT ---
    return `I'm here to help you with your travel savings journey! 🌟

I can assist with:
• 💰 Calculating savings plans for your dream trips
• 🏝️ Recommending destinations based on your budget
• ✈️ Explaining booking and payment options
• ❓ Answering questions about how TembeaSave works

What would you like to know more about?`;
  }, [destinations, trips]);

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
      // Check if we're in the savings conversational flow (awaiting destination name)
      if (awaitingSavingsDestination) {
        setAwaitingSavingsDestination(false);
        await new Promise(resolve => setTimeout(resolve, 500));

        const found = findDestination(userMessage, destinations || []);
        if (found) {
          const response = generateSavingsPlan(found);
          setMessages(prev => [...prev, {
            id: generateId(),
            role: "assistant",
            content: response,
            timestamp: Date.now(),
          }]);
          return;
        } else {
          // Not found — suggest similar
          const similar = findSimilarDestinations(userMessage, destinations || []);
          let response = `I couldn't find a destination matching "${userMessage}" in our current offerings. 😕`;
          if (similar.length > 0) {
            response += `\n\nHere are some similar destinations you might like:\n${formatDestinationsList(similar)}`;
            response += `\n\nWould you like a savings plan for any of these?`;
          } else if (destinations && destinations.length > 0) {
            response += `\n\nHere are our available destinations:\n${formatDestinationsList(destinations)}`;
            response += `\n\nTell me which one interests you and I'll create a savings plan! 😊`;
          }
          setMessages(prev => [...prev, {
            id: generateId(),
            role: "assistant",
            content: response,
            timestamp: Date.now(),
          }]);
          return;
        }
      }

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
  }, [input, isLoading, lastSentAt, messages, buildUserContext, toast, awaitingSavingsDestination, destinations, generateFallbackResponse]);

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
    setAwaitingSavingsDestination(false);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);


  // ============================================================================
  // Render
  // ============================================================================
  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faRobot} className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">AI Travel Assistant</h1>
            </div>
            {messages.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                className="text-muted-foreground hover:text-destructive"
              >
                <FontAwesomeIcon icon={faTrashCan} className="h-4 w-4 mr-1" />
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
              <FontAwesomeIcon icon={prompt.icon} className="h-3 w-3 mr-1" />
              {prompt.label}
            </Button>
          ))}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-sm animate-fade-in">
            <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4 text-destructive flex-shrink-0" />
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
                      {message.role === "user" ? (profile?.full_name?.[0] || "U") : <FontAwesomeIcon icon={faRobot} className="h-4 w-4" />}
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
                      <FontAwesomeIcon icon={faRobot} className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg px-4 py-3 bg-muted">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
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
                placeholder={awaitingSavingsDestination ? "Type the destination name..." : "Ask me anything about travel savings..."}
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
                {isLoading ? <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" /> : <FontAwesomeIcon icon={faPaperPlane} className="h-4 w-4" />}
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
