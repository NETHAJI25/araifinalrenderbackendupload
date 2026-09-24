import { useRef } from "react";
import { CheckCircle, Clock, Calendar } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { SplitText } from "../components/animations/SplitText";
import { timeline } from "../data/timeline";
import { eventConfig } from "../config/eventConfig";

const statusConfig = {
  completed: { color: "border-green-500 bg-green-500", textColor: "text-green-700", label: "Completed", icon: <CheckCircle className="w-4 h-4" /> },
  active: { color: "border-violet-600 bg-violet-600", textColor: "text-violet-700", label: "Active", icon: <Clock className="w-4 h-4" /> },
  upcoming: { color: "border-gray-300 bg-white", textColor: "text-gray-400", label: "Upcoming", icon: <Calendar className="w-4 h-4" /> },
};

function TimelineNode({ item, index, total, scrollYProgress }: any) {
  const cfg = statusConfig[item.status as keyof typeof statusConfig];
  
  // Calculate threshold based on index
  const threshold = index === 0 ? -0.1 : (index / Math.max(1, total - 1)) * 0.85;
  const scale = useTransform(scrollYProgress, (v: number) => v >= threshold ? 1 : 0.95);
  const opacity = useTransform(scrollYProgress, (v: number) => v >= threshold ? 1 : 0.7);
  const borderColor = useTransform(scrollYProgress, (v: number) => v >= threshold ? "#7c3aed" : "#d1d5db");
  const backgroundColor = useTransform(scrollYProgress, (v: number) => v >= threshold ? "#7c3aed" : "#ffffff");
  const iconColor = useTransform(scrollYProgress, (v: number) => v >= threshold ? "#ffffff" : "#d1d5db");

  return (
    <motion.li 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="relative flex gap-6">
      {/* Dot */}
      <motion.div 
        style={{ scale, opacity, borderColor, backgroundColor }}
        className="w-12 h-12 rounded-full border-4 flex items-center justify-center shrink-0 shadow-sm z-10 transition-colors duration-300">
        <motion.span style={{ color: iconColor }}>
          {cfg.icon}
        </motion.span>
      </motion.div>

      {/* Content */}
      <div className={`flex-1 card p-5 mb-2 transition-transform hover:-translate-y-1`}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <h2 className="text-base font-bold text-gray-900">{item.stage}</h2>
          <span className={`badge border ${cfg.textColor} ${item.status === "completed" ? "bg-green-50 border-green-200" : item.status === "active" ? "bg-violet-100 border-violet-200 text-violet-700" : "bg-gray-50 border-gray-200"}`}>
            {cfg.label}
          </span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">{item.description}</p>
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-gray-400">
            <Calendar className="w-3.5 h-3.5" /> {item.date}
          </span>
          {item.time && (
            <span className="flex items-center gap-1.5 text-gray-400">
              <Clock className="w-3.5 h-3.5" /> {item.time}
            </span>
          )}
        </div>
      </div>
    </motion.li>
  );
}

export default function TimelinePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <>
      <title>{`Timeline | ${eventConfig.hackathonName}`}</title>

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-violet-700 text-xs font-bold tracking-widest uppercase mb-2">Schedule</p>
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            <SplitText text="Event Timeline" />
          </h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-sm">
            Key dates and milestones for {eventConfig.hackathonName}. All dates are subject to updates — check back regularly.
          </motion.p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14" ref={containerRef}>
        <div className="relative">
          {/* Background vertical line */}
          <div 
            className="absolute left-6 top-3 bottom-3 w-0.5 bg-gray-200" 
            aria-hidden="true" 
          />
          
          {/* Progress vertical line */}
          <motion.div 
            style={{ height: lineHeight }}
            className="absolute left-6 top-3 w-0.5 bg-violet-500 origin-top z-0" 
            aria-hidden="true" 
          />

          <ol className="space-y-8 relative z-10">
            {timeline.map((item, i) => (
              <TimelineNode key={item.id} item={item} index={i} total={timeline.length} scrollYProgress={scrollYProgress} />
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}

