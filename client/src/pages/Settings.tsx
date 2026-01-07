import { BotLayout } from "@/components/BotLayout";
import { useSettings, useUpdateSettings } from "@/hooks/use-bot";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertSettingsSchema, type InsertSettings } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save, Hash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const { mutate: updateSettings, isPending } = useUpdateSettings();

  const form = useForm<InsertSettings>({
    resolver: zodResolver(insertSettingsSchema),
    defaultValues: {
      watchChannelId: "",
      summaryChannelId: "",
      isActive: false,
    },
  });

  // Load initial data
  useEffect(() => {
    if (settings) {
      form.reset({
        watchChannelId: settings.watchChannelId,
        summaryChannelId: settings.summaryChannelId,
        isActive: settings.isActive,
      });
    }
  }, [settings, form]);

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
