import "server-only";
import { read } from "@/lib/api/gateway.server";
import { reportPageSchema, reportSchema, type ReportView } from "@/lib/reports/schemas";

export function loadReports(view: ReportView, page: number, pageSize: number) {
  return read("reports", {
    schema: reportPageSchema,
    query: { status: view === "all" ? undefined : view, page, pageSize },
  });
}
export function loadReport(id: string) {
  return read("report", { schema: reportSchema, params: { id } });
}
