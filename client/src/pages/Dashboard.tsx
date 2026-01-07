import { BotLayout } from "@/components/BotLayout";
import { LogViewer } from "@/components/LogViewer";
import { StatusCard } from "@/components/StatusCard";
import { useSettings, useSummaries, useTriggerSummary } from "@/hooks/use-bot";
import { Activity, Radio, Play, FileText, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: settings } = useSettings();
  const { data: summaries } = useSummaries();
  const { mutate: triggerSummary, isPending: isTriggering } = useTriggerSummary();

  const lastRun = settings?.lastRunAt 
    ? format(new Date(settings.lastRunAt), "MMM d, h:mm a") 
    : "Never";

  const totalSummaries = summaries?.length || 0;
  const successRate = summaries?.length 
    ? Math.round((summaries.filter(s => s.status === 'success').length / summaries.length) * 100)
    : 100;

  return (
    <BotLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">Overview</h2>
          <p className="text-muted-foreground">Real-time bot metrics and control center</p>
        </div>
        <Button 
          size="lg"
          onClick={() => triggerSummary()}
          disabled={isTriggering || !settings?.isActive}
          className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 rounded-xl font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          {isTriggering ? (
            <>
              <Activity className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2 fill-current" />
              Trigger Summary
            </>
          )}
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatusCard 
          label="Bot Status" 
          value={settings?.isActive ? "Active" : "Inactive"} 
          subtext="Monitoring channel"
          icon={Radio}
          color={settings?.isActive ? "success" : "warning"}
        />
        <StatusCard 
          label="Last Run" 
          value={lastRun}
          subtext="Automated summary"
          icon={Clock}
          color="primary"
        />
        <StatusCard 
          label="Total Summaries" 
          value={totalSummaries.toString()} 
          subtext={`${successRate}% Success Rate`}
          icon={FileText}
          color="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Logs Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold">Live Logs</h3>
          </div>
          <LogViewer />
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold">Recent Activity</h3>
          </div>
          <div className="glass-panel rounded-2xl p-6 min-h-[400px]">
            <div className="space-y-6">
              {summaries?.slice(0, 5).map((summary, i) => (
                <motion.div 
                  key={summary.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4 items-start group"
                >
                  <div className="mt-1 relative">
                    <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">Daily Summary Generated</p>
                      <span className="text-xs text-muted-foreground">{format(new Date(summary.date), "MMM d, HH:mm")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {summary.content.replace(/[#*]/g, '')}
                    </p>
                  </div>
                </motion.div>
              ))}
              {(!summaries || summaries.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  No summaries generated yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </BotLayout>
  );
}
