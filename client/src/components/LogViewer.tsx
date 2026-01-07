import { useLogs } from "@/hooks/use-bot";
import { format } from "date-fns";
import { Terminal, RefreshCcw, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function LogViewer() {
  const { data: logs, isLoading, isError } = useLogs();

  const getIcon = (level: string) => {
    switch (level) {
      case "error": return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "warn": return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getColor = (level: string) => {
    switch (level) {
      case "error": return "text-red-300";
      case "warn": return "text-amber-300";
      default: return "text-blue-300";
    }
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-[400px]">
      <div className="bg-black/40 px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono text-sm font-medium text-muted-foreground">System Logs</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
        </div>
      </div>

      <ScrollArea className="flex-1 bg-black/80 font-mono text-sm p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
            <RefreshCcw className="w-4 h-4 animate-spin" />
            Loading logs stream...
          </div>
        ) : isError ? (
          <div className="text-red-400 p-4">Failed to connect to log stream.</div>
        ) : logs?.length === 0 ? (
          <div className="text-muted-foreground opacity-50 p-2">No logs available.</div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {logs?.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3 py-1 hover:bg-white/5 rounded px-2 -mx-2 transition-colors group"
                >
                  <span className="text-muted-foreground opacity-40 shrink-0 text-xs mt-0.5 w-20">
                    {format(new Date(log.timestamp), "HH:mm:ss")}
                  </span>
                  <div className={cn("mt-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity")}>
                    {getIcon(log.level)}
                  </div>
                  <span className={cn("break-all", getColor(log.level))}>
                    {log.message}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
