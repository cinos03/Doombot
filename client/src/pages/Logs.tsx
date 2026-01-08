import { BotLayout } from "@/components/BotLayout";
import { useLogs } from "@/hooks/use-bot";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";

export default function LogsPage() {
  const { data: logs, isLoading, isFetching } = useLogs();

  const refreshLogs = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertCircle className="w-4 h-4" />;
      case "warn":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getLevelVariant = (level: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (level) {
      case "error":
        return "destructive";
      case "warn":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <BotLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h2 className="text-3xl font-display font-bold text-white mb-2">System Logs</h2>
            <p className="text-muted-foreground">View bot activity, errors, and system events</p>
          </div>
          <Button
            variant="outline"
            onClick={refreshLogs}
            disabled={isFetching}
            data-testid="button-refresh-logs"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : logs && logs.length > 0 ? (
          <Card className="overflow-hidden">
            <ScrollArea className="h-[600px]">
              <div className="divide-y divide-border">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 hover-elevate transition-colors"
                    data-testid={`log-entry-${log.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <Badge variant={getLevelVariant(log.level)} className="shrink-0 mt-0.5">
                        {getLevelIcon(log.level)}
                        <span className="ml-1 uppercase text-xs">{log.level}</span>
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground break-words">{log.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(log.timestamp), "MMM d, yyyy 'at' h:mm:ss a")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Logs Yet</h3>
            <p className="text-muted-foreground">
              System logs will appear here as the bot operates.
            </p>
          </Card>
        )}
      </div>
    </BotLayout>
  );
}
