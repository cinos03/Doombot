import { BotLayout } from "@/components/BotLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Play, Clock, Radio, Edit2, Star, ExternalLink } from "lucide-react";
import { SiX } from "react-icons/si";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useState } from "react";
import type { AutopostTarget } from "@shared/schema";

const autopostFormSchema = z.object({
  platform: z.enum(["twitter", "truthsocial"]),
  handle: z.string().min(1, "Handle is required"),
  displayName: z.string().min(1, "Display name is required"),
  intervalMinutes: z.number().min(5).max(60),
  discordChannelId: z.string().min(1, "Discord channel ID is required"),
  announcementTemplate: z.string().min(1, "Announcement template is required"),
  includeEmbed: z.boolean(),
  isActive: z.boolean(),
});

type AutopostFormValues = z.infer<typeof autopostFormSchema>;

export default function AutoPostPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<AutopostTarget | null>(null);

  const { data: targets, isLoading } = useQuery<AutopostTarget[]>({
    queryKey: ["/api/autopost"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: AutopostFormValues) => {
      return apiRequest("POST", "/api/autopost", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autopost"] });
      toast({ title: "AutoPost target created!" });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AutopostFormValues> }) => {
      return apiRequest("PUT", `/api/autopost/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autopost"] });
      toast({ title: "AutoPost target updated!" });
      setIsDialogOpen(false);
      setEditingTarget(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/autopost/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autopost"] });
      toast({ title: "AutoPost target deleted!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const checkMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/autopost/${id}/check`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/autopost"] });
      toast({ 
        title: data.found ? "New post found!" : "No new posts",
        description: data.message 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const form = useForm<AutopostFormValues>({
    resolver: zodResolver(autopostFormSchema),
    defaultValues: {
      platform: "twitter",
      handle: "",
      displayName: "",
      intervalMinutes: 15,
      discordChannelId: "",
      announcementTemplate: "NEW POST from {displayName}!",
      includeEmbed: true,
      isActive: true,
    },
  });

  const openCreateDialog = () => {
    setEditingTarget(null);
    form.reset({
      platform: "twitter",
      handle: "",
      displayName: "",
      intervalMinutes: 15,
      discordChannelId: "",
      announcementTemplate: "NEW POST from {displayName}!",
      includeEmbed: true,
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (target: AutopostTarget) => {
    setEditingTarget(target);
    form.reset({
      platform: target.platform as "twitter" | "truthsocial",
      handle: target.handle,
      displayName: target.displayName,
      intervalMinutes: target.intervalMinutes,
      discordChannelId: target.discordChannelId,
      announcementTemplate: target.announcementTemplate,
      includeEmbed: target.includeEmbed,
      isActive: target.isActive,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: AutopostFormValues) => {
    if (editingTarget) {
      updateMutation.mutate({ id: editingTarget.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleToggleActive = async (target: AutopostTarget) => {
    updateMutation.mutate({ id: target.id, data: { isActive: !target.isActive } });
  };

  const getPlatformIcon = (platform: string) => {
    if (platform === "truthsocial") {
      return <Star className="w-5 h-5" />;
    }
    return <SiX className="w-5 h-5" />;
  };

  return (
    <BotLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">AutoPost</h2>
          <p className="text-muted-foreground">Monitor social accounts and auto-share new posts</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              onClick={openCreateDialog}
              className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 rounded-xl font-semibold"
              data-testid="button-add-autopost"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-white/10 max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTarget ? "Edit AutoPost Target" : "Add AutoPost Target"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-black/20 border-white/10" data-testid="select-platform">
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="twitter">X (Twitter)</SelectItem>
                          <SelectItem value="truthsocial">Truth Social</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="handle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Handle/Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="@realDonaldTrump"
                          {...field}
                          className="bg-black/20 border-white/10"
                          data-testid="input-handle"
                        />
                      </FormControl>
                      <FormDescription>The account handle to monitor (without @)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="President Trump"
                          {...field}
                          className="bg-black/20 border-white/10"
                          data-testid="input-display-name"
                        />
                      </FormControl>
                      <FormDescription>Friendly name used in announcements</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="intervalMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Check Interval</FormLabel>
                      <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger className="bg-black/20 border-white/10" data-testid="select-interval">
                            <SelectValue placeholder="Select interval" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="5">Every 5 minutes</SelectItem>
                          <SelectItem value="10">Every 10 minutes</SelectItem>
                          <SelectItem value="15">Every 15 minutes</SelectItem>
                          <SelectItem value="30">Every 30 minutes</SelectItem>
                          <SelectItem value="60">Every hour</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discordChannelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discord Channel ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="1234567890123456789"
                          {...field}
                          className="bg-black/20 border-white/10"
                          data-testid="input-channel-id"
                        />
                      </FormControl>
                      <FormDescription>Channel where posts will be shared</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="announcementTemplate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Announcement Message</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="NEW TRUMP POST!"
                          {...field}
                          className="bg-black/20 border-white/10"
                          data-testid="input-announcement"
                        />
                      </FormControl>
                      <FormDescription>
                        Use {"{handle}"}, {"{displayName}"}, or {"{platform}"} as placeholders
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="includeEmbed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/10 p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Include Thumbnail/Embed</FormLabel>
                        <FormDescription className="text-xs">
                          Show preview with thumbnail (uncheck for plain link)
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-embed" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/10 p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription className="text-xs">
                          Enable automatic checking for this account
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-active" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-autopost"
                  >
                    {editingTarget ? "Save Changes" : "Add Account"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {isLoading && (
          <div className="glass-panel rounded-2xl p-8 text-center text-muted-foreground">
            Loading...
          </div>
        )}

        {targets && targets.length === 0 && (
          <div className="glass-panel rounded-2xl p-8 text-center text-muted-foreground">
            No AutoPost targets configured yet. Click "Add Account" to get started.
          </div>
        )}

        {targets?.map((target, i) => (
          <motion.div
            key={target.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-panel rounded-2xl p-6"
            data-testid={`card-autopost-${target.id}`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${target.platform === "truthsocial" ? "bg-blue-500/10 text-blue-400" : "bg-white/10 text-white"}`}>
                  {getPlatformIcon(target.platform)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{target.displayName}</h3>
                    <Badge variant={target.isActive ? "default" : "secondary"} className="text-xs">
                      {target.isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    @{target.handle} on {target.platform === "truthsocial" ? "Truth Social" : "X"}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Every {target.intervalMinutes} min
                    </span>
                    {target.lastCheckedAt && (
                      <span>
                        Last checked: {format(new Date(target.lastCheckedAt), "MMM d, HH:mm")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => checkMutation.mutate(target.id)}
                  disabled={checkMutation.isPending}
                  data-testid={`button-check-${target.id}`}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Check Now
                </Button>
                {target.lastPostId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const url = target.platform === "truthsocial" 
                        ? `https://truthsocial.com/@${target.handle}/posts/${target.lastPostId}`
                        : `https://x.com/${target.handle}/status/${target.lastPostId}`;
                      window.open(url, "_blank");
                    }}
                    data-testid={`button-lastpost-${target.id}`}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Last Post
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(target)}
                  data-testid={`button-edit-${target.id}`}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleActive(target)}
                  data-testid={`button-toggle-${target.id}`}
                >
                  <Radio className="w-3 h-3 mr-1" />
                  {target.isActive ? "Pause" : "Resume"}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Delete AutoPost target for @${target.handle}?`)) {
                      deleteMutation.mutate(target.id);
                    }
                  }}
                  className="text-destructive hover:text-destructive"
                  data-testid={`button-delete-${target.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Announcement:</span> {target.announcementTemplate}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-medium text-foreground">Channel:</span> {target.discordChannelId}
                <span className="ml-4 font-medium text-foreground">Embed:</span> {target.includeEmbed ? "Yes" : "No (plain link)"}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </BotLayout>
  );
}
