import { THEME_BOOT_SCRIPT } from "@/lib/theme";

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />;
}
