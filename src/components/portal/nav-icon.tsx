import {
  Building2,
  CalendarCheck,
  ChartColumn,
  ClipboardList,
  History,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LogIn,
  Plus,
  ScrollText,
  Stamp,
  UserCog,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "building-2": Building2,
  "calendar-check": CalendarCheck,
  "chart-column": ChartColumn,
  "clipboard-list": ClipboardList,
  history: History,
  inbox: Inbox,
  "key-round": KeyRound,
  "layout-dashboard": Stamp,
  "log-in": LogIn,
  plus: Plus,
  "scroll-text": ScrollText,
  "user-cog": UserCog,
  "user-plus": UserPlus,
  users: Users,
};

export function NavIcon({
  name,
  className,
  strokeWidth,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = ICONS[name] ?? LayoutDashboard;
  return <Icon aria-hidden="true" className={className} strokeWidth={strokeWidth} />;
}
