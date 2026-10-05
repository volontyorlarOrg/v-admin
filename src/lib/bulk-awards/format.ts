const SEPARATORS: Record<string, { group: string; decimal: string }> = {
  uz: { group: " ", decimal: "," },
  ru: { group: " ", decimal: "," },
  en: { group: ",", decimal: "." },
};

export function formatAmount(value: number, locale: string): string {
  const { group, decimal } = SEPARATORS[locale] ?? { group: ",", decimal: "." };
  const [whole = "0", fraction = ""] = (Math.round(Math.abs(value) * 100) / 100)
    .toFixed(2)
    .split(".");
  const trimmed = fraction.replace(/0+$/, "");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  return `${value < 0 ? "−" : ""}${grouped}${trimmed ? `${decimal}${trimmed}` : ""}`;
}

export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
