import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { insertContactSchema, type InsertContact } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Phone, Mail, Clock, Send, Heart, MessageCircle } from "lucide-react";
import { SiFacebook, SiInstagram, SiYoutube } from "react-icons/si";
import { useSEO } from "@/hooks/use-seo";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function Connect() {
  useSEO({ title: "Connect With Us", description: "Get in touch with First Pentecostal Church of Dallas. Submit a prayer request, plan your visit, or send us a message." });

  const { toast } = useToast();

  const form = useForm<InsertContact>({
    resolver: zodResolver(insertContactSchema.extend({
      name: insertContactSchema.shape.name.min(2, "Name must be at least 2 characters"),
      email: insertContactSchema.shape.email.email("Please enter a valid email"),
      message: insertContactSchema.shape.message.min(10, "Message must be at least 10 characters"),
    })),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
      prayerRequest: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertContact) => {
      await apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      toast({
        title: "Message Sent!",
        description: "Thank you for reaching out. We'll get back to you soon.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen">
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden" data-testid="section-connect-hero">
        <div className="absolute inset-0">
          <img src="/images/community-outreach.png" alt="Community" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 text-center max-w-3xl mx-auto px-4"
        >
          <motion.span variants={fadeUp} className="text-gold font-body text-sm font-semibold uppercase tracking-widest">
            We'd Love to Hear From You
          </motion.span>
          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-bold text-white mt-3 text-shadow-lg">
            Connect With Us
          </motion.h1>
          <motion.p variants={fadeUp} className="text-white/80 font-body text-lg mt-4">
            Have a question, need prayer, or want to plan your first visit? Reach out anytime.
          </motion.p>
        </motion.div>
      </section>

      <section className="py-20 bg-background" data-testid="section-connect-form">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "50px" }}
            variants={stagger}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            <motion.div variants={fadeUp}>
              <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">Get In Touch</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-6">
                Send Us a <span className="text-gold">Message</span>
              </h2>

              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-body">Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" className="font-body" data-testid="input-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-body">Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your@email.com" className="font-body" data-testid="input-email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-body">Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 000-0000" className="font-body" data-testid="input-phone" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-body">Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="How can we help you?"
                            className="font-body min-h-[120px]"
                            data-testid="input-message"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prayerRequest"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-prayer"
                          />
                        </FormControl>
                        <FormLabel className="font-body text-sm !mt-0">
                          This is a prayer request
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="bg-gold text-white border-gold font-body w-full"
                    disabled={mutation.isPending}
                    data-testid="button-submit-contact"
                  >
                    {mutation.isPending ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </motion.div>

            <motion.div variants={fadeUp} className="space-y-6">
              <div>
                <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">Contact Info</span>
                <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-6">
                  Visit Us <span className="text-gold">Today</span>
                </h2>
              </div>

              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-md bg-accent flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Our Location</h3>
                    <p className="text-muted-foreground font-body text-sm">
                      110 Security Ct<br />Wylie, TX 75098
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-md bg-accent flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Phone</h3>
                    <p className="text-muted-foreground font-body text-sm">(214) 555-0123</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-md bg-accent flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Email</h3>
                    <p className="text-muted-foreground font-body text-sm">info@fpcdallas.org</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-md bg-accent flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Office Hours</h3>
                    <p className="text-muted-foreground font-body text-sm">
                      Monday - Friday: 9:00 AM - 5:00 PM<br />
                      Saturday: By Appointment<br />
                      Sunday: Service Times
                    </p>
                  </div>
                </div>
              </Card>

              <div className="pt-4">
                <h3 className="font-bold mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-md bg-card flex items-center justify-center border hover-elevate" data-testid="link-connect-facebook">
                    <SiFacebook className="w-5 h-5" />
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-md bg-card flex items-center justify-center border hover-elevate" data-testid="link-connect-instagram">
                    <SiInstagram className="w-5 h-5" />
                  </a>
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-md bg-card flex items-center justify-center border hover-elevate" data-testid="link-connect-youtube">
                    <SiYoutube className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-card" data-testid="section-connect-map">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-10">
              <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">Find Us</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">Our Location</h2>
              <p className="text-muted-foreground font-body mt-3">110 Security Ct, Wylie, TX 75098</p>
              <div className="w-16 h-1 bg-gold mx-auto mt-4 rounded-full" />
            </motion.div>
            <motion.div variants={fadeUp}>
              <Card className="overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3345.5!2d-96.5388!3d33.0151!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x864c19f2a5d1c0a1%3A0x0!2s110+Security+Ct%2C+Wylie%2C+TX+75098!5e0!3m2!1sen!2sus!4v1700000000000"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Church Location - 110 Security Ct, Wylie, TX 75098"
                  data-testid="map-connect"
                />
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-background" data-testid="section-what-to-expect">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">Your First Visit</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">What to Expect</h2>
              <div className="w-16 h-1 bg-gold mx-auto mt-4 rounded-full" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { icon: Heart, title: "Warm Welcome", desc: "Our greeters and hospitality team will make you feel right at home from the moment you arrive. Come as you are." },
                { icon: MessageCircle, title: "Anointed Worship", desc: "Experience powerful, Spirit-filled worship that lifts your soul and draws you into the presence of God." },
                { icon: Send, title: "Life-Changing Word", desc: "Our pastors deliver messages rooted in Scripture that are relevant, inspiring, and transformative for everyday life." },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <Card className="p-6 text-center h-full">
                    <div className="w-12 h-12 rounded-md bg-accent flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground font-body text-sm leading-relaxed">{item.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
