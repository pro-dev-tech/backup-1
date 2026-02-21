import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/register" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold gradient-primary-text">Nexus-Compliance</span>
        </div>

        <div className="glass-card p-8 space-y-6">
          <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground">Last updated: February 21, 2026</p>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We collect information you provide during registration including your name, email address, mobile number, company details, PAN, and GSTIN. We also collect usage data such as login timestamps, feature usage patterns, and device information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
            <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
              <li>To provide and maintain the compliance platform</li>
              <li>To verify your identity and prevent fraud</li>
              <li>To send compliance alerts and regulatory updates</li>
              <li>To generate AI-powered compliance insights</li>
              <li>To improve our services and user experience</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. Data Security</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We implement industry-standard security measures including 256-bit AES encryption for data at rest, TLS 1.3 for data in transit, and SOC 2 Type II certified infrastructure. Access to production data is restricted to authorized personnel only.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Data Sharing</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We do not sell your personal data. We may share data with trusted service providers who assist in operating the Platform, subject to strict confidentiality agreements. We may disclose data when required by law or regulatory authorities.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Data Retention</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We retain your data for as long as your account is active. Upon account deletion, personal data is permanently removed within 30 days. Compliance audit logs may be retained for up to 7 years as required by Indian regulatory standards.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Your Rights</h2>
            <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
              <li>Access your personal data stored on the Platform</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your account and data</li>
              <li>Export your compliance data in standard formats</li>
              <li>Withdraw consent for non-essential data processing</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Cookies</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use essential cookies for authentication and session management. Analytics cookies are used only with your consent to improve the Platform experience.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">8. Contact</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For privacy-related inquiries, contact our Data Protection Officer at privacy@nexus-compliance.com
            </p>
          </section>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              This policy complies with the Digital Personal Data Protection Act, 2023 (India).
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
