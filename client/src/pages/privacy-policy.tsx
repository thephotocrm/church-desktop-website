import { motion } from "framer-motion";
import { useSEO } from "@/hooks/use-seo";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function PrivacyPolicy() {
  useSEO({
    title: "Privacy Policy",
    description: "Privacy Policy for First Pentecostal Church of Dallas - how we collect, use, and protect your personal information.",
  });

  return (
    <div className="min-h-screen">
      <section className="relative py-20 bg-navy flex items-center justify-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 text-center max-w-3xl mx-auto px-4"
        >
          <motion.span variants={fadeUp} className="text-gold font-body text-sm font-semibold uppercase tracking-widest">
            Your Privacy Matters
          </motion.span>
          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-bold text-white mt-3">
            Privacy Policy
          </motion.h1>
          <motion.p variants={fadeUp} className="text-white/80 font-body text-lg mt-4">
            Last updated: February 20, 2026
          </motion.p>
        </motion.div>
      </section>

      <section className="py-16 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "50px" }}
            variants={stagger}
            className="space-y-10 font-body text-muted-foreground leading-relaxed"
          >
            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">Introduction</h2>
              <p>
                First Pentecostal Church of Dallas ("FPCD," "we," "us," or "our") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website at fpcd.life and use our mobile application (collectively, the "Platform").
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">Information We Collect</h2>
              <p className="mb-3">We collect information that you voluntarily provide to us when you:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Create an account:</strong> name, email address, phone number, and password (which is securely hashed using bcrypt and never stored in plain text).</li>
                <li><strong className="text-foreground">Update your profile:</strong> profile photo and privacy preferences (such as hiding your phone number or email from the member directory).</li>
                <li><strong className="text-foreground">Make a donation:</strong> donation amount, type, and frequency. Payment card information is processed directly by Stripe and is never stored on our servers.</li>
                <li><strong className="text-foreground">Submit a prayer request:</strong> prayer request title, description, and your name (with the option to submit anonymously).</li>
                <li><strong className="text-foreground">Use the contact form:</strong> name, email address, phone number, and message.</li>
                <li><strong className="text-foreground">Join a group:</strong> group membership and join date.</li>
              </ul>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">Technical Information</h2>
              <p>
                When you use our Platform, we automatically collect certain technical information to maintain your session and provide a secure experience. This includes:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong className="text-foreground">Session data:</strong> We use JSON Web Tokens (JWT) to manage authenticated sessions.</li>
                <li><strong className="text-foreground">Cookies:</strong> We use essential cookies to keep you signed in and maintain your preferences. We do not use advertising or tracking cookies.</li>
              </ul>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">How We Use Your Information</h2>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Create and manage your member account.</li>
                <li>Process your donations securely through Stripe.</li>
                <li>Facilitate prayer request sharing within the church community.</li>
                <li>Respond to your contact form submissions.</li>
                <li>Maintain a member directory (with your privacy preferences respected).</li>
                <li>Manage group memberships.</li>
                <li>Communicate important church updates when necessary.</li>
              </ul>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">Payment Processing</h2>
              <p>
                All donation payments are processed by <strong className="text-foreground">Stripe</strong>, a PCI-compliant third-party payment processor. Your credit card number, expiration date, and CVV are transmitted directly to Stripe's secure servers and are never stored on our systems. We only retain a record of the donation amount, type, and frequency for your giving history. Please review{" "}
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                  Stripe's Privacy Policy
                </a>{" "}
                for more information on how they handle your payment data.
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">Data Sharing</h2>
              <p>
                We do not sell, trade, or rent your personal information to third parties. We may share limited information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong className="text-foreground">Payment processing:</strong> Donation information is shared with Stripe solely to process your transactions.</li>
                <li><strong className="text-foreground">Member directory:</strong> Your name and contact information may be visible to other church members unless you choose to hide it in your privacy settings.</li>
                <li><strong className="text-foreground">Legal requirements:</strong> We may disclose information if required by law or to protect the rights and safety of our church and its members.</li>
              </ul>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">Data Security</h2>
              <p>
                We take reasonable measures to protect your personal information, including encrypting passwords with bcrypt hashing, using secure JWT-based authentication, and transmitting data over HTTPS. However, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">Data Retention</h2>
              <p>
                We retain your personal information for as long as your account is active or as needed to provide you with our services. If you wish to delete your account and associated data, please contact us using the information below.
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">Children's Privacy</h2>
              <p>
                Our Platform is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us so we can take appropriate action.
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">Your Rights</h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access the personal information we hold about you.</li>
                <li>Update or correct your information through your profile settings.</li>
                <li>Control your visibility in the member directory through privacy settings.</li>
                <li>Request deletion of your account and personal data.</li>
                <li>Submit prayer requests anonymously.</li>
              </ul>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last updated" date. We encourage you to review this policy periodically.
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">Contact Us</h2>
              <p>
                If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="mt-3">
                <p><strong className="text-foreground">First Pentecostal Church of Dallas</strong></p>
                <p>110 Security Ct, Wylie, TX 75098</p>
                <p>Email: info@fpcdallas.org</p>
                <p>Phone: (214) 555-0123</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
