import { BotLayout } from "@/components/BotLayout";
import { useSummaries } from "@/hooks/use-bot";
import { format } from "date-fns";
import { FileText, Calendar, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function HistoryPage() {
  const { data: summaries, isLoading } = useSummaries();

  return (
    <BotLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-white mb-2">Summary History</h2>
        <p className="text-muted-foreground">Archive of all generated daily summaries</p>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading history...</p>
          </div>
        ) : summaries?.length === 0 ? (
          <div className="text-center py-20 glass-panel rounded-2xl border-dashed">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg">No summaries have been generated yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {summaries?.map((summary, i) => (
              <motion.div
                key={summary.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-panel rounded-2xl p-6 flex flex-col h-full hover:border-primary/30 transition-colors group relative overflow-hidden"
              >
                 <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10 flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(summary.date), "MMM d, yyyy")}</span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={summary.status === 'success' 
                      ? "bg-green-500/10 text-green-400 border-green-500/20" 
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                    }
                  >
                    {summary.status === 'success' ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <XCircle className="w-3 h-3 mr-1" />
                    )}
                    {summary.status}
                  </Badge>
                </div>

                <div className="relative z-10 flex-1 bg-black/20 rounded-xl p-4 border border-white/5">
                  <ScrollArea className="h-[200px] w-full pr-4">
                    <div className="whitespace-pre-wrap font-mono text-sm text-muted-foreground leading-relaxed">
                      {summary.content}
                    </div>
                  </ScrollArea>
                </div>

                <div className="relative z-10 mt-4 pt-4 border-t border-white/5 text-xs text-muted-foreground flex justify-between items-center">
                  <span>Generated at {format(new Date(summary.date), "h:mm a")}</span>
                  <span className="font-mono text-xs opacity-50">ID: {summary.id}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </BotLayout>
  );
}
