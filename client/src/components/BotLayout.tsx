import { Link, useLocation } from "wouter";
import { LayoutDashboard, Settings, History, Bot, Rss } from "lucide-react";
import { cn } from "@/lib/utils";

interface BotLayoutProps {
  children: React.ReactNode;
}

export function BotLayout({ children }: BotLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/summaries", label: "History", icon: History },
    { href: "/autopost", label: "AutoPost", icon: Rss },
    { href: "/settings", label: "Configuration", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex text-foreground font-sans selection:bg-primary/20">
      {/* Sidebar */}
      <aside className="w-64 fixed h-full border-r border-white/5 bg-card/50 backdrop-blur-xl z-50 hidden md:flex flex-col">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight">Summarizer</h1>
            <p className="text-xs text-muted-foreground font-medium">Bot Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                    isActive
                      ? "bg-primary/10 text-primary font-medium shadow-sm ring-1 ring-primary/20"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5">
          <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-xl p-4 border border-white/5">
            <p className="text-xs text-indigo-200 mb-2">System Status</p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-sm font-semibold text-white">Online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-background/80 backdrop-blur-lg border-b border-border z-50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="text-primary w-6 h-6" />
          <span className="font-display font-bold">Summarizer</span>
        </div>
        {/* Simple mobile nav could go here */}
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 animate-in fade-in duration-500">
        <div className="max-w-6xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
