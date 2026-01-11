import { BotLayout } from "@/components/BotLayout";
import { useSettings, useUpdateSettings } from "@/hooks/use-bot";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertSettingsSchema, type InsertSettings } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Hash, Clock, Bot, Plus, X, Key, BarChart3 } from "lucide-react";
import { SiX } from "react-icons/si";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface ApiUsageWithCost {
  id: number;
  service: string;
  callCount: number;
  month: string;
  lastUpdated: string;
  estimatedCost: string;
}

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const { mutate: updateSettings, isPending } = useUpdateSettings();
  const [summaryTimes, setSummaryTimes] = useState<string[]>(["20:00"]);
  const [newTime, setNewTime] = useState("");
  
  const { data: apiUsage } = useQuery<ApiUsageWithCost[]>({
    queryKey: ["/api/usage"],
  });

  const form = useForm<InsertSettings>({
    resolver: zodResolver(insertSettingsSchema),
    defaultValues: {
      watchChannelId: "",
      summaryChannelId: "",
      isActive: false,
      summaryTimes: ["20:00"],
      aiProvider: "openai",
      aiModel: "gpt-4o",
      xBearerToken: "",
      twitterApiIoKey: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        watchChannelId: settings.watchChannelId,
        summaryChannelId: settings.summaryChannelId,
        isActive: settings.isActive,
        summaryTimes: settings.summaryTimes || ["20:00"],
        aiProvider: settings.aiProvider || "openai",
        aiModel: settings.aiModel || "gpt-4o",
        xBearerToken: settings.xBearerToken || "",
        twitterApiIoKey: settings.twitterApiIoKey || "",
      });
      setSummaryTimes(settings.summaryTimes || ["20:00"]);
    }
  }, [settings, form]);

  const addSummaryTime = () => {
    if (newTime && !summaryTimes.includes(newTime)) {
      const updated = [...summaryTimes, newTime].sort();
      setSummaryTimes(updated);
      form.setValue("summaryTimes", updated);
      setNewTime("");
    }
  };

  const removeSummaryTime = (time: string) => {
    const updated = summaryTimes.filter(t => t !== time);
    setSummaryTimes(updated);
    form.setValue("summaryTimes", updated);
  };

  function onSubmit(data: InsertSettings) {
    updateSettings(data);
  }

  return (
    <BotLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-display font-bold text-white mb-2">Configuration</h2>
          <p className="text-muted-foreground">Manage Discord channel connections, scheduling, and API settings</p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-[200px] w-full rounded-2xl" />
            <Skeleton className="h-[100px] w-full rounded-2xl" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="discord" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="discord" data-testid="tab-discord">
                    <Hash className="w-4 h-4 mr-2" />
                    Discord
                  </TabsTrigger>
                  <TabsTrigger value="schedule" data-testid="tab-schedule">
                    <Clock className="w-4 h-4 mr-2" />
                    Schedule
                  </TabsTrigger>
                  <TabsTrigger value="ai" data-testid="tab-ai">
                    <Bot className="w-4 h-4 mr-2" />
                    AI
                  </TabsTrigger>
                  <TabsTrigger value="xapi" data-testid="tab-xapi">
                    <SiX className="w-4 h-4 mr-2" />
                    X API
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="discord" className="space-y-6">
                  <div className="glass-panel p-6 rounded-2xl space-y-6">
                    <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <Hash className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Channel Settings</h3>
                        <p className="text-sm text-muted-foreground">Configure where the bot listens and posts</p>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="watchChannelId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Watch Channel ID</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="123456789012345678" 
                              {...field} 
                              className="bg-black/20 border-white/10 focus:border-primary/50"
                              data-testid="input-watch-channel"
                            />
                          </FormControl>
                          <FormDescription>
                            The Discord channel ID to monitor for news and updates.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="summaryChannelId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Summary Channel ID</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="123456789012345678" 
                              {...field} 
                              className="bg-black/20 border-white/10 focus:border-primary/50"
                              data-testid="input-summary-channel"
                            />
                          </FormControl>
                          <FormDescription>
                            The Discord channel ID where daily summaries will be posted.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="glass-panel p-6 rounded-2xl">
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg p-2">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-semibold">Bot Active Status</FormLabel>
                            <FormDescription>
                              Toggle to enable or disable the automated summary generation.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-primary"
                              data-testid="switch-bot-active"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="schedule" className="space-y-6">
                  <div className="glass-panel p-6 rounded-2xl space-y-6">
                    <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <Clock className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Summary Schedule</h3>
                        <p className="text-sm text-muted-foreground">Configure when daily summaries are generated</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <FormLabel>Summary Times (24-hour format)</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {summaryTimes.map((time) => (
                          <div 
                            key={time}
                            className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm"
                          >
                            <Clock className="w-3 h-3" />
                            {time}
                            <button
                              type="button"
                              onClick={() => removeSummaryTime(time)}
                              className="hover:text-destructive transition-colors"
                              data-testid={`button-remove-time-${time}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="time"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                          className="bg-black/20 border-white/10 focus:border-primary/50 w-40"
                          data-testid="input-new-time"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={addSummaryTime}
                          data-testid="button-add-time"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <FormDescription>
                        Add multiple times for summaries to be generated each day.
                      </FormDescription>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ai" className="space-y-6">
                  <div className="glass-panel p-6 rounded-2xl space-y-6">
                    <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <Bot className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">AI Configuration</h3>
                        <p className="text-sm text-muted-foreground">Configure AI provider and model settings</p>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="aiProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>AI Provider</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-black/20 border-white/10" data-testid="select-ai-provider">
                                <SelectValue placeholder="Select AI provider" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="openai">OpenAI (Replit Integration)</SelectItem>
                              <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                              <SelectItem value="custom">Custom/Local Server</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            For OpenAI, select "OpenAI". For Claude, select "Anthropic (Claude)" and set ANTHROPIC_API_KEY environment variable.
                            For a local server (Ollama, llama.cpp, etc.), select "Custom" and set CUSTOM_AI_BASE_URL and CUSTOM_AI_API_KEY environment variables.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="aiModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>AI Model</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="gpt-4o" 
                              {...field} 
                              className="bg-black/20 border-white/10 focus:border-primary/50"
                              data-testid="input-ai-model"
                            />
                          </FormControl>
                          <FormDescription>
                            The model name to use (e.g., gpt-4o, claude-sonnet-4-20250514).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="xapi" className="space-y-6">
                  <div className="glass-panel p-6 rounded-2xl space-y-6">
                    <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <SiX className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">X (Twitter) API</h3>
                        <p className="text-sm text-muted-foreground">Configure API access for reliable post monitoring</p>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="twitterApiIoKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TwitterAPI.io API Key (Recommended)</FormLabel>
                          <FormControl>
                            <Input 
                              type="password"
                              placeholder="your-api-key-here" 
                              {...field}
                              value={field.value || ""}
                              className="bg-black/20 border-white/10 focus:border-primary/50 font-mono"
                              data-testid="input-twitter-api-io-key"
                            />
                          </FormControl>
                          <FormDescription>
                            Get your API key from{" "}
                            <a 
                              href="https://twitterapi.io" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary underline"
                            >
                              twitterapi.io
                            </a>
                            . Cost: $0.15 per 1,000 tweets (100x cheaper than official X API). No Twitter auth required.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Key className="w-5 h-5 text-emerald-500 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-emerald-500 mb-1">Why use TwitterAPI.io?</p>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>No Twitter developer account or approval needed</li>
                            <li>Works immediately after signup ($0.10 free trial)</li>
                            <li>100x cheaper than official X API ($0.15/1000 vs $20/month)</li>
                            <li>Very reliable with fast response times</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-6">
                      <p className="text-sm text-muted-foreground mb-4">Or use the official X API (optional, only as backup):</p>
                      
                      <FormField
                        control={form.control}
                        name="xBearerToken"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>X API Bearer Token (Backup)</FormLabel>
                            <FormControl>
                              <Input 
                                type="password"
                                placeholder="AAAAAAAAAAAAAAAA..." 
                                {...field}
                                value={field.value || ""}
                                className="bg-black/20 border-white/10 focus:border-primary/50 font-mono"
                                data-testid="input-x-bearer-token"
                              />
                            </FormControl>
                            <FormDescription>
                              Official X API token from{" "}
                              <a 
                                href="https://developer.x.com/en/portal/dashboard" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary underline"
                              >
                                developer.x.com
                              </a>
                              . Only used if TwitterAPI.io is not configured.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="glass-panel p-6 rounded-2xl space-y-6">
                    <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <BarChart3 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">API Usage</h3>
                        <p className="text-sm text-muted-foreground">Track your API costs for monitoring services</p>
                      </div>
                    </div>

                    {!apiUsage ? (
                      <div className="space-y-3">
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                      </div>
                    ) : apiUsage.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No API usage recorded yet. Usage will appear here after AutoPost checks run.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {apiUsage.map((usage) => (
                          <div 
                            key={usage.id} 
                            className="flex items-center justify-between p-4 bg-black/20 rounded-lg"
                            data-testid={`usage-row-${usage.service}-${usage.month}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-sm">
                                <div className="font-medium">
                                  {usage.service === "twitterapiio" ? "TwitterAPI.io" : 
                                   usage.service === "xapi" ? "Official X API" : 
                                   usage.service}
                                </div>
                                <div className="text-muted-foreground">{usage.month}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium" data-testid={`usage-calls-${usage.service}-${usage.month}`}>
                                {usage.callCount.toLocaleString()} calls
                              </div>
                              <div className="text-sm text-emerald-500" data-testid={`usage-cost-${usage.service}-${usage.month}`}>
                                ${parseFloat(usage.estimatedCost).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                      Costs are estimated based on $0.15 per 1,000 API calls for TwitterAPI.io.
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={isPending}
                  className="bg-primary hover:bg-primary/90 text-white min-w-[150px] rounded-xl font-semibold shadow-lg shadow-primary/20"
                  data-testid="button-save-settings"
                >
                  {isPending ? "Saving..." : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>

            </form>
          </Form>
        )}
      </div>
    </BotLayout>
  );
}
