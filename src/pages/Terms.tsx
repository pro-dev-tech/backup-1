import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function Terms() {
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
          <h1 className="text-2xl font-bold text-foreground">Terms & Conditions</h1>
          <p className="text-xs text-muted-foreground">Last updated: February 21, 2026</p>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By accessing or using Nexus-Compliance ("the Platform"), you agree to be bound by these Terms & Conditions. If you do not agree, you may not use the Platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Description of Service</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nexus-Compliance is a regulatory compliance SaaS platform designed for Indian MSMEs and enterprises. The Platform provides compliance tracking, risk monitoring, AI-powered insights, and regulatory news feeds.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. User Accounts</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate and complete registration information. The Platform supports three user roles: Compliance Admin, Finance/Tax User, and Read-Only Auditor.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Acceptable Use</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You agree not to misuse the Platform, including but not limited to: unauthorized access, data scraping, reverse engineering, or transmitting harmful code. The Platform shall be used solely for lawful business compliance purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Data & Privacy</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your use of the Platform is also governed by our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. All data uploaded to the Platform remains your intellectual property. We employ 256-bit encryption and SOC 2 compliant infrastructure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Limitation of Liability</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nexus-Compliance provides compliance tools and insights for informational purposes. The Platform does not constitute legal, tax, or financial advice. We are not liable for any regulatory penalties arising from reliance on Platform outputs.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Termination</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time through the Settings page.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">8. Governing Law</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              These terms are governed by the laws of the Republic of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Maharashtra, India.
            </p>
          </section>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              For questions regarding these terms, contact us at legal@nexus-compliance.com
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
