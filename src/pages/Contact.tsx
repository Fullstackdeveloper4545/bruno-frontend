import { Mail, MapPin, Phone, Send, Sparkles } from "lucide-react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0">
          <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-amber-400/20 blur-3xl" />
        </div>
        <div className="relative container-page py-20">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]">
              <Sparkles className="h-3.5 w-3.5" />
              Support Desk
            </div>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl md:text-5xl">Contact Us</h1>
            <p className="text-base text-primary-foreground/80 sm:text-lg">
              Let us know how we can help. Our team responds within 24 hours.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page -mt-12 pb-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            {
              icon: Phone,
              title: "Call Us",
              description: "Mon-Fri, 9:00 - 18:00",
              value: "+351 912 345 678",
            },
            {
              icon: Mail,
              title: "Email",
              description: "We respond in 24 hours",
              value: "support@loja.eu",
            },
            {
              icon: MapPin,
              title: "Visit",
              description: "Rua Augusta 212, Lisbon",
              value: "Portugal",
            },
          ].map((item, index) => (
            <Card
              key={item.title}
              className="border-border/60 bg-card/95 shadow-sm animate-fade-in"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <CardHeader className="space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-semibold text-foreground">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-border/60 bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Send a message</CardTitle>
              <CardDescription>Tell us about your request and we will reach back quickly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First name</label>
                  <Input placeholder="Maria" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last name</label>
                  <Input placeholder="Silva" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" placeholder="maria@cliente.pt" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input placeholder="Order inquiry" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea rows={5} placeholder="Write your message..." />
              </div>
              <Button className="w-full sm:w-auto">
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/60 bg-card/95 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Support hours</CardTitle>
                <CardDescription>We are here to help.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Monday - Friday</span>
                  <span className="font-semibold">9:00 - 18:00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Saturday</span>
                  <span className="font-semibold">10:00 - 14:00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sunday</span>
                  <span className="font-semibold">Closed</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/95 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Frequently asked</CardTitle>
                <CardDescription>Quick answers to popular questions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground">Where is my order?</p>
                  <p>Track orders in your account or contact us with your order ID.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Can I change shipping address?</p>
                  <p>Yes, within 2 hours of placing the order.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Refund timing</p>
                  <p>Refunds are processed within 3-5 business days.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
