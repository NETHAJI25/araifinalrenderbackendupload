import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, MapPin, Calendar, Clock, Users, IndianRupee, GraduationCap,
  ExternalLink, Mail, Phone, Share2, ChevronDown, UserPlus, CreditCard, FolderPlus, CheckCircle, Send, Briefcase, Lightbulb, Globe, Compass, Gift, FileText
} from "lucide-react";
import { SplitText } from "../components/animations/SplitText";
import { CountUp } from "../components/animations/CountUp";
import { Button } from "../components/ui/Button";
import { eventConfig } from "../config/eventConfig";
import { organizers } from "../data/organizers";
import { sponsors } from "../data/sponsors";
import { faqs, faqCategories } from "../data/faq";
import iaWbImage from "../assets/ia wb.png";
import { contactService } from "../services/contactService";
import { useToast } from "../contexts/ToastContext";
import Seo from "../components/seo/Seo";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

// ─── Animation helpers ────────────────────────────────────────────────────────
function useFadeUp(i = 0) {
  const reduced = useReducedMotion();
  return {
    initial: { opacity: 0, y: reduced ? 0 : 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.35, delay: i * 0.07 },
  };
}

function SectionHeader({ eyebrow, title, subtitle }: {
  eyebrow?: string; title: string; subtitle?: string;
}) {
  return (
    <div className="section-heading flex flex-col items-center text-center mx-auto w-full max-w-2xl">
      {eyebrow && <p className="text-violet-700 text-xs font-bold tracking-widest uppercase mb-3 w-full">{eyebrow}</p>}
      <h2 className="text-3xl md:text-4xl font-black text-gray-900 w-full flex justify-center">
        <SplitText text={title} className="justify-center" />
      </h2>
      {subtitle && <p className="text-lg text-gray-600 mt-3 leading-relaxed w-full">{subtitle}</p>}
    </div>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  const reduced = useReducedMotion();

  return (
    <section className="relative bg-white overflow-hidden min-h-[92vh] flex items-center">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50/60 via-white to-white pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Left */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: reduced ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center text-xs font-bold tracking-widest text-violet-700 uppercase mb-6 bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-full"
            >
              {eventConfig.eyebrow}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: reduced ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-black text-gray-900 leading-tight mb-6"
            >
              <span className="sr-only">
                {eventConfig.hackathonName} — national-level 36-hour student hackathon in{" "}
                {eventConfig.location}.{" "}
              </span>
              {eventConfig.tagline}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: reduced ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.16 }}
              className="text-lg text-gray-600 leading-relaxed mb-6 max-w-lg"
            >
              {eventConfig.subTagline}
            </motion.p>

            {/* Location + date */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.22 }}
              className="flex flex-wrap gap-4 mb-8 text-sm"
            >
              <span className="flex items-center gap-1.5 text-violet-700 font-semibold">
                <MapPin className="w-4 h-4" /> {eventConfig.location}
              </span>
              <span className="flex items-center gap-1.5 text-violet-700 font-semibold">
                <Calendar className="w-4 h-4" /> {eventConfig.finalRound}
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: reduced ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.28 }}
              className="flex flex-wrap gap-3 mb-10"
            >
              <Link to="/login">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Register Now
                </Button>
              </Link>
              <Link to="/problem-statements">
                <Button variant="secondary" size="lg">Explore Problem Statements</Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.36 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {[
                { icon: <Clock className="w-5 h-5" />, value: "36", label: "HOURS" },
                { icon: <Users className="w-5 h-5" />, value: "4–6", label: "TEAM SIZE" },
                { icon: <IndianRupee className="w-5 h-5" />, value: "₹200", label: "ROUND 2 FEE" },
                { icon: <GraduationCap className="w-5 h-5" />, value: "OPEN", label: "TO STUDENTS" },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-1 text-violet-600">{s.icon}</div>
                  <p className="text-xl font-black text-gray-900">{s.value}</p>
                  <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">{s.label}</p>
                </div>
              ))}
            </motion.div>

            {/* Cash Prize Highlight */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.44 }}
              className="mt-6 p-5 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl flex items-center justify-center gap-3"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <IndianRupee className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold tracking-widest text-amber-700 uppercase mb-1">Cash Prize</p>
                <p className="text-2xl font-black text-amber-800">₹1,00,000</p>
              </div>
            </motion.div>
          </div>

          {/* Right — IA WB Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center w-full mt-8 lg:mt-0"
          >
            <img src={iaWbImage} alt="Innovators Arena 2.0 hackathon branding" width={1887} height={1744} fetchPriority="high" className="w-full max-w-[400px] lg:max-w-[500px] xl:max-w-[600px] object-contain hover:scale-[1.02] transition-transform duration-300" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Registration CTA ─────────────────────────────────────────────────────────
function RegistrationCTA() {
  return (
    <section className="bg-violet-700 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2 md:text-left">Ready to build something that matters?</h2>
            <p className="text-violet-200 text-sm max-w-xl md:text-left">
              Register individually, form a team of 4–6, select your challenge, and innovate for 36 hours.
            </p>
          </div>
          <Link to="/login" className="shrink-0">
            <Button variant="secondary" size="lg" className="border-transparent hover:border-transparent whitespace-nowrap"
              rightIcon={<ArrowRight className="w-4 h-4" />}>
              Register Now
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── ABOUT ────────────────────────────────────────────────────────────────────
function AboutSection() {
  return (
    <section id="about" className="py-20 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <motion.div {...useFadeUp(0)}>
            <SectionHeader
              eyebrow="About the Hackathon"
              title="What is Innovators Arena 2.0?"
              subtitle="A national-level 36-hour hackathon where student teams build practical solutions to real-world problems."
            />
            <div className="mt-8 space-y-4 text-gray-600 text-sm leading-relaxed md:text-left">
              <p>Innovators Arena 2.0 brings together student innovators from across the country to tackle a curated set of challenges spanning technology, sustainability, healthcare, agriculture, and more.</p>
              <p>Teams of 4–6 members design, build, and present solutions over 36 intensive hours. The event is open to all students regardless of institution, branch, or year of study.</p>
              <p>The final round takes place in the First Week of January 2027.</p>
            </div>
          </motion.div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: 36, unit: "HOURS", desc: "Continuous innovation" },
              { value: 6, prefix: "4-", unit: "MEMBERS", desc: "Team size (4-6)" },
              { value: 200, prefix: "₹", unit: "ROUND 2 FEE", desc: "Per participant" },
              { value: 240, suffix: "+", unit: "PROBLEMS", desc: "Across 16 themes" },
            ].map((s, i) => (
              <motion.div key={s.unit} {...useFadeUp(i)} className="card p-5 hover:border-violet-200 transition-colors">
                <p className="text-3xl font-black text-violet-700 mb-1">
                  <CountUp end={s.value} prefix={s.prefix} suffix={s.suffix} />
                </p>
                <p className="text-xs font-bold tracking-widest text-gray-500 uppercase">{s.unit}</p>
                <p className="text-sm text-gray-400 mt-1">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── WHY PARTICIPATE ──────────────────────────────────────────────────────────
function WhyParticipateSection() {
  const reasons = [
    { icon: <Globe className="w-6 h-6" />, title: "Real-World Problem Solving", desc: "Tackle genuine challenges sourced from industry and society." },
    { icon: <Lightbulb className="w-6 h-6" />, title: "National-Level Exposure", desc: "Compete with talented students from across India." },
    { icon: <Users className="w-6 h-6" />, title: "Team Collaboration", desc: "Build lasting connections while solving real problems." },
    { icon: <Compass className="w-6 h-6" />, title: "Guidance Available", desc: "Access expert guidance during the hackathon event." },
    { icon: <Briefcase className="w-6 h-6" />, title: "Internship Opportunities", desc: "Top performers get exclusive internship offers." },
    { icon: <Gift className="w-6 h-6" />, title: "Exciting Gifts", desc: "Amazing prizes and goodies for winning teams." },
  ];
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...useFadeUp()} className="text-center mb-14">
          <SectionHeader eyebrow="Why Participate" title="What you gain from Innovators Arena 2.0" />
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((r, i) => (
            <motion.div key={r.title} {...useFadeUp(i)} className="card p-6 hover:border-violet-200 hover:shadow-md transition-all flex flex-col sm:items-start">
              <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 mb-4">{r.icon}</div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{r.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{r.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PROBLEM STATEMENTS DELETED ──────────────────────────────────────────────

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    { num: "01", icon: <UserPlus className="w-6 h-6" />, title: "Create Account", desc: "Register individually with your academic details." },
    { num: "02", icon: <CheckCircle className="w-6 h-6" />, title: "Complete Profile", desc: "Fill in required personal and academic information." },
    { num: "03", icon: <FolderPlus className="w-6 h-6" />, title: "Create / Join Team", desc: "Form a team of 4–6 members using your Team ID." },
    { num: "04", icon: <Users className="w-6 h-6" />, title: "Complete Team", desc: "Team Leader marks team as complete." },
    { num: "05", icon: <FileText className="w-6 h-6" />, title: "Round 1: PPT Submit", desc: "Team Leader pays ₹100 & submits PPT for evaluation." },
    { num: "06", icon: <CheckCircle className="w-6 h-6" />, title: "Round 1 Results", desc: "Selected teams advance to Finals (Round 2)." },
    { num: "07", icon: <CreditCard className="w-6 h-6" />, title: "Round 2: Payment", desc: "All members pay ₹200 each for Finals." },
    { num: "08", icon: <Send className="w-6 h-6" />, title: "Grand Finale", desc: "Confirmed teams present their project at the offline finals." },
  ];
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...useFadeUp()} className="text-center mb-14">
          <SectionHeader eyebrow="How It Works" title="Your Journey to the Final Round" />
        </motion.div>
        <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-8 gap-4">
          {steps.map((s, i) => (
            <motion.div key={s.num} {...useFadeUp(i)} className="flex flex-col relative">
              {i < steps.length - 1 && (
                <div className="absolute top-8 left-1/2 w-full h-0.5 bg-violet-100" style={{ left: "50%" }} />
              )}
              <div className="w-14 h-14 bg-white border-2 border-violet-200 rounded-xl flex items-center justify-center text-violet-600 mb-3 shadow-sm relative z-10">{s.icon}</div>
              <span className="text-xs font-black text-violet-300 mb-1">{s.num}</span>
              <h3 className="text-xs font-bold text-gray-900 mb-1">{s.title}</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
        <div className="md:hidden space-y-3">
          {steps.map((s, i) => (
            <motion.div key={s.num} {...useFadeUp(i)} className="flex items-start gap-4 card p-4">
              <div className="w-10 h-10 bg-violet-50 border border-violet-200 rounded-lg flex items-center justify-center text-violet-600 shrink-0">{s.icon}</div>
              <div>
                <span className="text-xs font-black text-violet-300">{s.num}</span>
                <h3 className="text-sm font-bold text-gray-900">{s.title}</h3>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── TIMELINE DELETED ─────────────────────────────────────────────────────────

// ─── GUIDELINES ───────────────────────────────────────────────────────────────
function GuidelinesSection() {
  const guidelines = [
    {
      title: "PPT Format Template",
      description: "Official presentation template for final project submission. All teams must use this format.",
      type: "Google Slides / PPTX",
      path: "https://docs.google.com/presentation/d/1bTUtL_KCMQgRB9ilwnmL-PntFyXofzd4/edit?usp=sharing&ouid=110748840767488667268&rtpof=true&sd=true",
      icon: <FileText className="w-6 h-6" />
    },
    {
      title: "Hackathon Guidelines",
      description: "Complete guidelines covering rules, regulations, evaluation criteria, and participant responsibilities.",
      type: "PDF",
      path: "https://drive.google.com/file/d/1yovAvdekpyUmSp3nDYbx73_1XgvzzfyK/view?usp=sharing",
      icon: <FileText className="w-6 h-6" />
    },
  ];

  return (
    <section id="guidelines" className="py-20 bg-gray-50 scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...useFadeUp()} className="text-center mb-12">
          <SectionHeader eyebrow="Resources" title="Guidelines & Documents" />
        </motion.div>
        <div className="grid sm:grid-cols-2 gap-6">
          {guidelines.map((doc, i) => (
            <motion.div key={doc.title} {...useFadeUp(i)} className="card p-6 hover:border-violet-200 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center shrink-0 text-violet-600">
                {doc.icon}
              </div>
              <div className="flex-1 flex flex-col sm:items-start w-full">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1 sm:text-left w-full">{doc.type}</p>
                <h3 className="text-base font-bold text-gray-900 mb-2 sm:text-left w-full">{doc.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4 sm:text-left w-full">{doc.description}</p>
                <div className="flex gap-3 sm:justify-start w-full">
                  <a href={doc.path} target="_blank" rel="noopener noreferrer">
                    <Button variant="primary" size="sm">View</Button>
                  </a>
                  <a href={doc.path} download>
                    <Button variant="secondary" size="sm">Download</Button>
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── ORGANIZERS ───────────────────────────────────────────────────────────────
function OrganizersSection() {
  return (
    <section id="organizers" className="py-20 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...useFadeUp()} className="text-center mb-12">
          <SectionHeader eyebrow="Organizing Team" title="Meet the Team" />
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {organizers.map((org, i) => {
            // Center the orphan last card on desktop (lg 4-col grid) — mobile/tablet unchanged
            const isOrphanLast = i === organizers.length - 1 && organizers.length % 4 === 1;
            return (
            <motion.div key={org.id} {...useFadeUp(i)}
              className={`card p-6 flex flex-col items-center text-center hover:border-violet-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-full max-w-[340px] mx-auto min-h-[280px]${isOrphanLast ? " lg:col-start-2 lg:col-span-2" : ""}`}>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-violet-100 mb-5 bg-gray-100 shadow-md">
                <img src={org.photo} alt={`${org.name} — Innovators Arena 2.0 organiser`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{org.name}</h3>
              <p className="text-sm text-violet-600 font-semibold">{org.designation}</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Innovators Arena</p>
              <a href={org.linkedin} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-violet-700 hover:underline font-medium"
                aria-label={`${org.name} on LinkedIn`}>
                <ExternalLink className="w-3.5 h-3.5" /> LinkedIn
              </a>
            </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── SPONSORS ─────────────────────────────────────────────────────────────────
function SponsorsSection() {
  return (
    <section id="sponsors" className="py-16 bg-gray-50 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...useFadeUp()} className="text-center mb-10">
          <SectionHeader eyebrow="Partners" title="Our Sponsors & Partners" />
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {sponsors.map((sp, i) => (
            <motion.div key={sp.id} {...useFadeUp(i)}
              className="card p-8 flex flex-col items-center justify-center text-center min-h-[220px] hover:border-violet-300 hover:shadow-xl transition-all duration-300">
              <div className="h-28 w-full flex items-center justify-center mb-5">
                <img src={sp.logo} alt={`${sp.name} — Innovators Arena 2.0 sponsor`} loading="lazy" decoding="async" className="max-h-full max-w-full object-contain" />
              </div>
              <p className="text-base font-bold text-gray-900">{sp.name}</p>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400">More sponsors joining soon.</p>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQSection() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [openIds, setOpenIds] = useState<string[]>([]);
  const categories = ["All", ...faqCategories];
  const filtered = activeCategory === "All" ? faqs : faqs.filter((f) => f.category === activeCategory);

  return (
    <section id="faq" className="py-20 bg-white scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...useFadeUp()} className="text-center mb-12">
          <SectionHeader eyebrow="FAQ" title="Frequently Asked Questions" />
        </motion.div>
        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-8" role="tablist">
          {categories.map((cat) => (
            <button key={cat} role="tab" aria-selected={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400
                ${activeCategory === cat ? "bg-violet-700 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-700"}`}>
              {cat}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {filtered.map((faq) => {
            const isOpen = openIds.includes(faq.id);
            return (
              <div key={faq.id} className="card overflow-hidden">
                <button
                  onClick={() => setOpenIds((p) => p.includes(faq.id) ? p.filter((x) => x !== faq.id) : [...p, faq.id])}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between px-5 py-4 text-left group focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-400">
                  <span className="text-sm font-semibold text-gray-900 pr-4 group-hover:text-violet-700 transition-colors">{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 border-t border-gray-50">
                    <p className="text-sm text-gray-600 leading-relaxed pt-3">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── CONTACT ──────────────────────────────────────────────────────────────────
function ContactSection() {
  const [isSent, setIsSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const { addToast } = useToast();
   
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await contactService.sendMessage(formData);
      setIsSent(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      addToast({ type: "success", title: "Message Sent!", message: "We will get back to you soon." });
    } catch (error) {
      addToast({ type: "error", title: "Failed to send", message: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <section id="contact" className="py-20 bg-gray-50 scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...useFadeUp()} className="text-center mb-12">
          <SectionHeader eyebrow="Get in Touch" title="Contact" />
        </motion.div>
        <div className="grid lg:grid-cols-2 gap-10">
          <div>
            <div className="grid sm:grid-cols-2 gap-5 mb-8">
              {[
                { icon: <Mail className="w-5 h-5" />, label: "Email", value: eventConfig.contactEmail, href: `mailto:${eventConfig.contactEmail}` },
                { icon: <Phone className="w-5 h-5" />, label: "Phone", value: "+91 9150569051", href: "tel:+919150569051" },
                { icon: <ExternalLink className="w-5 h-5" />, label: "LinkedIn", value: "Innovators Arena", href: eventConfig.socialLinks.linkedin },
                { icon: <Share2 className="w-5 h-5" />, label: "Instagram", value: "@innovatorsarena", href: eventConfig.socialLinks.instagram },
              ].map((item) => (
                <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer"
                  className="card p-5 flex flex-col items-center text-center hover:border-violet-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 mb-3 group-hover:bg-violet-100 transition-colors">
                    {item.icon}
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-700 group-hover:text-violet-700 transition-colors break-all">{item.value}</p>
                </a>
              ))}
            </div>
            
            <div className="card p-6 bg-green-50 border-green-200 text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Join our WhatsApp Community</h3>
              <p className="text-sm text-gray-600 mb-4">Get instant updates, connect with peers, and find team members.</p>
              <a href={eventConfig.whatsappGroupUrl} target="_blank" rel="noopener noreferrer">
                <Button className="bg-green-600 hover:bg-green-700 text-white w-full border-green-600">Join WhatsApp Group</Button>
              </a>
            </div>
          </div>
          
          <div className="card p-6 sm:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 sm:text-left">Send us a message</h3>
            {isSent ? (
              <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-center font-medium">
                Message Sent! We will get back to you soon.
              </div>
            ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input id="contact-name" name="name" type="text" required className="input-field w-full" placeholder="Your full name" value={formData.name} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input id="contact-email" name="email" type="email" required className="input-field w-full" placeholder="you@example.com" value={formData.email} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input id="contact-subject" name="subject" type="text" required className="input-field w-full" placeholder="How can we help?" value={formData.subject} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea id="contact-message" name="message" required rows={4} className="input-field w-full" placeholder="Your message here..." value={formData.message} onChange={handleChange}></textarea>
              </div>
              <Button type="submit" className="w-full" loading={isSubmitting}>Send Message</Button>
            </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FINAL CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="py-20 bg-violet-700">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div {...useFadeUp()}>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 flex justify-center">
            <SplitText text="Your 36-hour challenge starts here." className="justify-center" />
          </h2>
          <p className="text-violet-200 text-lg mb-8 leading-relaxed">
            Register individually, build your team, choose your challenge and turn your idea into a working solution.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/login">
              <Button variant="solid-white" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Register Now
              </Button>
            </Link>
            <Link to="/problem-statements">
              <Button variant="outline-white" size="lg">
                Explore Problem Statements
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── ANNOUNCEMENTS DELETED ──────────────────────────────────────────────────

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <Seo
        title={`${eventConfig.hackathonName} | National-Level 36-Hour Student Hackathon 2027`}
        description={`Join ${eventConfig.hackathonName}, a national-level 36-hour student hackathon in ${eventConfig.location}. Open to all students. 240+ problem statements across 16 themes. ${eventConfig.finalRound}.`}
        path="/"
        jsonLd={faqJsonLd}
      />
      <HeroSection />
      <RegistrationCTA />
      <AboutSection />
      <WhyParticipateSection />
      <HowItWorksSection />
      <GuidelinesSection />
      <OrganizersSection />
      <SponsorsSection />
      <FAQSection />
      <ContactSection />
      <FinalCTA />
    </>
  );
}
