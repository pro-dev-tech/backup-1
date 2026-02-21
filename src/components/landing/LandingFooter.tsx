import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const sections = [
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Data Protection", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact", href: "#contact" },
      { label: "Help Center", href: "#" },
      { label: "Documentation", href: "#" },
    ],
  },
  {
    title: "Social",
    links: [
      { label: "LinkedIn", href: "#" },
      { label: "Twitter", href: "#" },
    ],
  },
];

export default function LandingFooter() {
  return (
    <footer id="contact" className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-foreground">
                Nexus<span className="text-primary">-Compliance</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              AI-powered compliance intelligence for modern Indian businesses.
            </p>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link to={link.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © 2026 Nexus-Compliance. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for Indian Businesses. Powered by AI.
          </p>
        </div>
      </div>
    </footer>
  );
}
