import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatusCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ElementType;
  color?: "primary" | "success" | "warning";
}

export function StatusCard({ label, value, subtext, icon: Icon, color = "primary" }: StatusCardProps) {
  const colors = {
    primary: "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/20",
    success: "from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/20",
    warning: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/20",
  };

  const iconColors = {
    primary: "bg-blue-500/20 text-blue-400",
    success: "bg-emerald-500/20 text-emerald-400",
    warning: "bg-amber-500/20 text-amber-400",
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 border bg-card/50 backdrop-blur-sm shadow-lg transition-colors",
        "hover:border-white/10 border-white/5"
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 hover:opacity-100 transition-opacity duration-500", colors[color])} />
      
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
          <h3 className="text-2xl font-bold font-display tracking-tight text-foreground">{value}</h3>
          {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
        </div>
        <div className={cn("p-3 rounded-xl", iconColors[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}
