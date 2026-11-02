import {
  Award,
  Building2,
  BookOpen,
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
  UserCog,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  award: Award,
  "building-2": Building2,
  "book-open": BookOpen,
  "calendar-check": CalendarCheck,
  "chart-column": ChartColumn,
  "clipboard-list": ClipboardList,
  history: History,
  inbox: Inbox,
  "key-round": KeyRound,
  "layout-dashboard": LayoutDashboard,
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
  const Icon = ICONS[name] ?? ScrollText;
  return <Icon aria-hidden="true" className={className} strokeWidth={strokeWidth} />;
}
