import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    title: "CFO, TechVentures Pvt Ltd",
    quote: "Nexus-Compliance reduced our compliance overhead by 60%. The AI-powered checker catches issues our team used to miss, and the real-time alerts keep us ahead of every deadline.",
  },
  {
    name: "Rajesh Mehta",
    title: "Managing Partner, Mehta & Associates LLP",
    quote: "As auditors handling 50+ clients, this platform transformed our workflow. The role-based access and automated reports save us countless hours every quarter.",
  },
  {
    name: "Ananya Reddy",
    title: "Compliance Head, GreenLeaf Industries",
    quote: "The regulatory news feed and compliance calendar are game-changers. We went from reactive firefighting to proactive compliance management within weeks.",
  },
];

export default function Testimonials() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 bg-muted/30" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Trusted by <span className="gradient-primary-text">Indian Businesses</span>
          </h2>
          <p className="text-muted-foreground">What our customers say about Nexus-Compliance.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 25 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 italic">
                "{t.quote}"
              </p>
              <div>
                <div className="text-sm font-semibold text-foreground">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.title}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
