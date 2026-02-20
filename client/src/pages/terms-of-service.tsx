import { motion } from "framer-motion";
import { useSEO } from "@/hooks/use-seo";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function TermsOfService() {
  useSEO({
    title: "Terms of Service",
    description: "Terms of Service for First Pentecostal Church of Dallas - guidelines for using our website and mobile application.",
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
            Our Agreement
          </motion.span>
          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-bold text-white mt-3">
            Terms of Service
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
              <h2 className="text-2xl font-bold text-foreground mb-4">Acceptance of Terms</h2>
              <p>
                By accessing or using the First Pentecostal Church of Dallas ("FPCD") website at fpcd.life and mobile application (collectively, the "Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Platform. We reserve the right to update these Terms at any time, and your continued use of the Platform constitutes acceptance of any changes.
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">Account Responsibilities</h2>
              <p className="mb-3">
                When you create an account on our Platform, you are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Providing accurate and complete registration information (name, email, phone number).</li>
                <li>Maintaining the confidentiality of your password and account credentials.</li>
                <li>All activity that occurs under your account.</li>
                <li>Notifying us immediately of any unauthorized use of your account.</li>
              </ul>
              <p className="mt-3">
                You must be at least 13 years of age to create an account. We reserve the right to suspend or terminate accounts that violate these Terms.
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">Donations and Payments</h2>
              <p className="mb-3">
                Our Platform allows you to make donations to FPCD. By making a donation, you acknowledge and agree that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All donations are processed securely by Stripe, a PCI-compliant third-party payment processor.</li>
                <li>Donations are voluntary contributions to FPCD and are generally non-refundable.</li>
                <li>If you believe a donation was made in error, please contact us promptly and we will review your request on a case-by-case basis.</li>
                <li>Recurring donations can be managed or cancelled through your account settings or by contacting us.</li>
                <li>FPCD is a tax-exempt religious organization. Donation receipts may be provided for tax purposes.</li>
              </ul>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">User Content</h2>
              <p className="mb-3">
                Our Platform allows you to submit content, including prayer requests, profile information, and contact form messages ("User Content"). By submitting User Content, you agree that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You are solely responsible for the content you submit.</li>
                <li>Prayer requests may be visible to other church members unless submitted anonymously.</li>
                <li>Your profile information may be visible in the member directory based on your privacy settings.</li>
                <li>You will not submit content that is offensive, defamatory, harassing, or otherwise inappropriate.</li>
                <li>We reserve the right to remove any User Content that violates these Terms or is deemed inappropriate.</li>
              </ul>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">Acceptable Use</h2>
              <p className="mb-3">
                When using the Platform, you agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Platform for any unlawful purpose or in violation of any applicable laws.</li>
                <li>Attempt to gain unauthorized access to other user accounts or Platform systems.</li>
                <li>Interfere with or disrupt the Platform's functionality or servers.</li>
                <li>Harvest or collect personal information of other members without their consent.</li>
                <li>Use the Platform to send spam, unsolicited messages, or promotional material.</li>
                <li>Impersonate any person or entity, or misrepresent your identity.</li>
                <li>Upload malicious code, viruses, or any harmful content.</li>
              </ul>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">Intellectual Property</h2>
              <p>
                All content on the Platform, including text, graphics, logos, images, and software, is the property of FPCD or its content providers and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works from any content on the Platform without our express written permission.
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">Third-Party Services</h2>
              <p>
                Our Platform integrates with third-party services, including Stripe for payment processing. Your use of these services is subject to their respective terms and privacy policies. We are not responsible for the practices or content of third-party services.
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">Disclaimer of Warranties</h2>
              <p>
                The Platform is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. FPCD does not warrant that the Platform will be uninterrupted, error-free, or free of viruses or other harmful components. We make no guarantees regarding the accuracy or completeness of any content on the Platform.
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, FPCD and its pastors, staff, volunteers, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Platform. This includes, but is not limited to, damages for loss of data, goodwill, or other intangible losses, even if we have been advised of the possibility of such damages.
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the State of Texas, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the Platform shall be resolved in the courts located in Dallas County, Texas.
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">Changes to These Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated "Last updated" date. Your continued use of the Platform after any changes constitutes acceptance of the new Terms. We encourage you to review these Terms periodically.
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-foreground mb-4">Contact Us</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us:
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
