import { BotLayout } from "@/components/BotLayout";
import { useSettings, useUpdateSettings } from "@/hooks/use-bot";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertSettingsSchema, type InsertSettings } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save, Hash, Clock, Bot, Plus, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const { mutate: updateSettings, isPending } = useUpdateSettings();
  const [summaryTimes, setSummaryTimes] = useState<string[]>(["20:00"]);
  const [newTime, setNewTime] = useState("");

  const form = useForm<InsertSettings>({
    resolver: zodResolver(insertSettingsSchema),
    defaultValues: {
      watchChannelId: "",
      summaryChannelId: "",
      isActive: false,
      summaryTimes: ["20:00"],
      aiProvider: "openai",
      aiModel: "gpt-4o",
    },
  });

  // Load initial data
  useEffect(() => {
    if (settings) {
      form.reset({
        watchChannelId: settings.watchChannelId,
        summaryChannelId: settings.summaryChannelId,
        isActive: settings.isActive,
        summaryTimes: settings.summaryTimes || ["20:00"],
        aiProvider: settings.aiProvider || "openai",
        aiModel: settings.aiModel || "gpt-4o",
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
          <p className="text-muted-foreground">Manage Discord channel connections and bot status</p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-[200px] w-full rounded-2xl" />
            <Skeleton className="h-[100px] w-full rounded-2xl" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
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
                          <SelectItem value="custom">Custom/Local Server</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        For Replit's built-in OpenAI, select "OpenAI".
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
                        The model name to use (e.g., gpt-4o, claude-3-5-sonnet-20241022).
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg p-2">
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
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={isPending}
                  className="bg-primary hover:bg-primary/90 text-white min-w-[150px] rounded-xl font-semibold shadow-lg shadow-primary/20"
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
