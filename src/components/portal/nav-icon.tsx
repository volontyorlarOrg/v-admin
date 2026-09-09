import {
  Building2,
  CalendarCheck,
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
  "building-2": Building2,
  "calendar-check": CalendarCheck,
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

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? LayoutDashboard;
  return <Icon aria-hidden="true" className={className} />;
}
