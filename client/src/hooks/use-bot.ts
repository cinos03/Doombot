import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertSettings } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// ==========================================
// SETTINGS
// ==========================================

export function useSettings() {
  return useQuery({
    queryKey: [api.settings.get.path],
    queryFn: async () => {
      const res = await fetch(api.settings.get.path);
      if (res.status === 404) return null; // Handle case where settings don't exist yet
      if (!res.ok) throw new Error("Failed to fetch settings");
      return api.settings.get.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertSettings) => {
      const res = await fetch(api.settings.update.path, {
        method: api.settings.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.settings.update.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to update settings");
      }
      return api.settings.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.settings.get.path] });
      toast({
        title: "Settings Saved",
        description: "Bot configuration has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useTriggerSummary() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.settings.trigger.path, {
        method: api.settings.trigger.method,
      });
      if (!res.ok) throw new Error("Failed to trigger summary");
      return api.settings.trigger.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Summary Triggered",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "Trigger Failed",
        description: "Could not start the summary generation process.",
        variant: "destructive",
      });
    },
  });
}

// ==========================================
// SUMMARIES
// ==========================================

export function useSummaries() {
  return useQuery({
    queryKey: [api.summaries.list.path],
    queryFn: async () => {
      const res = await fetch(api.summaries.list.path);
      if (!res.ok) throw new Error("Failed to fetch summaries");
      return api.summaries.list.responses[200].parse(await res.json());
    },
  });
}

// ==========================================
// LOGS
// ==========================================

export function useLogs() {
  return useQuery({
    queryKey: [api.logs.list.path],
    queryFn: async () => {
      const res = await fetch(api.logs.list.path);
      if (!res.ok) throw new Error("Failed to fetch logs");
      return api.logs.list.responses[200].parse(await res.json());
    },
    refetchInterval: 3000, // Poll every 3 seconds for live logs
  });
}
