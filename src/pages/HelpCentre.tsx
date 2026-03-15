import { Search, Mail, MessageCircle, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";

const faqs = [
  {
    question: "How do I create a savings goal?",
    answer: "To create a savings goal, log in to your dashboard and click the 'Add Savings Goal' button. You can choose a predefined destination or create a custom goal, set your target amount, and choose your preferred saving frequency."
  },
  {
    question: "Is my money safe with TembeaSave?",
    answer: "Yes, your funds are completely safe. We use bank-level encryption and partner with licensed financial institutions to ensure your savings are protected at all times."
  },
  {
    question: "Can I withdraw my savings before reaching the goal?",
    answer: "Yes, you can withdraw your funds anytime. However, maintaining your savings until the goal is reached helps you unlock special travel deals and maintain financial discipline."
  },
  {
    question: "How do I book a trip with my saved funds?",
    answer: "Once you have sufficient funds for your dream destination, navigate to the 'Browse Trips' section, select your desired package, and choose 'Pay with TembeaSave Wallet' at checkout."
  },
  {
    question: "Are there any hidden fees?",
    answer: "No, we believe in complete transparency. There are no hidden fees for depositing or keeping your money with us. Standard payment gateway fees may apply depending on your deposit method."
  }
];

const HelpCentre = () => {
  return (
    <div className="min-h-screen py-20 px-4 container mx-auto">
      <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
        <div className="text-center space-y-6 bg-muted/30 py-16 px-4 rounded-3xl border border-muted/50">
          <h1 className="text-4xl md:text-5xl font-bold">How can we help you?</h1>
          <div className="max-w-md mx-auto relative mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input 
              placeholder="Search for answers..." 
              className="pl-12 py-6 text-lg rounded-full shadow-[var(--shadow-elegant)] border-muted"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 animate-slide-in">
          <Card className="p-8 flex flex-col items-center text-center space-y-4 hover:shadow-[var(--shadow-elegant)] transition-all hover:-translate-y-1 rounded-3xl border-muted/50">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <MessageCircle className="h-8 w-8" />
            </div>
            <h3 className="font-semibold text-xl">Live Chat</h3>
            <p className="text-muted-foreground mb-4 flex-grow">Talk to our friendly AI assistant or support team in real-time.</p>
            <Link to="/chat" className="w-full">
              <Button variant="outline" className="w-full rounded-xl py-6 hover:bg-primary hover:text-white transition-colors">
                Start Chat
              </Button>
            </Link>
          </Card>
          
          <Card className="p-8 flex flex-col items-center text-center space-y-4 hover:shadow-[var(--shadow-elegant)] transition-all hover:-translate-y-1 rounded-3xl border-muted/50">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Mail className="h-8 w-8" />
            </div>
            <h3 className="font-semibold text-xl">Email Support</h3>
            <p className="text-muted-foreground mb-4 flex-grow">Send us an email and we'll get back to you within 24 hours.</p>
            <a href="mailto:support@tembeasave.com" className="w-full">
              <Button variant="outline" className="w-full rounded-xl py-6 hover:bg-primary hover:text-white transition-colors">
                Email Us
              </Button>
            </a>
          </Card>
          
          <Card className="p-8 flex flex-col items-center text-center space-y-4 hover:shadow-[var(--shadow-elegant)] transition-all hover:-translate-y-1 rounded-3xl border-muted/50">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Phone className="h-8 w-8" />
            </div>
            <h3 className="font-semibold text-xl">Phone Support</h3>
            <p className="text-muted-foreground mb-4 flex-grow">Call us directly during business hours for urgent inquiries.</p>
            <a href="tel:+1234567890" className="w-full">
              <Button variant="outline" className="w-full rounded-xl py-6 hover:bg-primary hover:text-white transition-colors">
                Call Now
              </Button>
            </a>
          </Card>
        </div>

        <div className="space-y-8 pt-10 animate-scale-in">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Find quick answers to common questions about TembeaSave.</p>
          </div>
          <Card className="p-6 rounded-3xl border-muted/50 shadow-sm">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="px-4 py-2 border-b last:border-0">
                  <AccordionTrigger className="text-left font-medium text-lg hover:no-underline hover:text-primary transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-base pt-2">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HelpCentre;
