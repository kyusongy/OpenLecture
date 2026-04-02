import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Settings, PanelLeftClose, PanelLeftOpen, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import LanguageToggle from "@/components/LanguageToggle";
import AppIcon from "@/components/AppIcon";
import { openExternal } from "@/lib/tauri";

export function AppLayout() {
  const location = useLocation();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { to: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <div className="flex h-screen">
      <nav
        className={cn(
          "flex flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-md transition-all duration-200 relative",
          collapsed ? "w-[72px]" : "w-60"
        )}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-4 top-7 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent hover:shadow-md transition-all"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>

        {/* Logo */}
        <div
          className={cn(
            "py-6 flex items-center transition-all duration-300",
            collapsed ? "px-4 justify-center" : "px-6 gap-3"
          )}
        >
          <AppIcon size={36} />
          {!collapsed && (
            <div className="leading-tight overflow-hidden whitespace-nowrap animate-fade-in">
              <p className="text-lg font-bold text-foreground tracking-tight">
                OpenLecture
              </p>
            </div>
          )}
        </div>

        {/* Nav links */}
        <ul className="flex-1 space-y-1.5 px-3">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={cn(
                    "flex items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-200",
                    collapsed ? "justify-center px-0" : "px-3 gap-3",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  {!collapsed && <span className="truncate animate-fade-in">{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div
          className={cn(
            "border-t border-sidebar-border p-3 space-y-2",
            collapsed ? "flex flex-col items-center" : ""
          )}
        >
          <button
            onClick={() => openExternal("https://easypine-ai.com/")}
            className={cn(
              "flex items-center rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors cursor-pointer w-full",
              collapsed ? "justify-center px-0" : "gap-1.5"
            )}
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            {!collapsed && <span>{t("easypine.sidebarLink")}</span>}
          </button>
          <LanguageToggle />
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto bg-muted/10">
        <Outlet />
      </main>
    </div>
  );
}
