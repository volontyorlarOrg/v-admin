import "server-only";

import { signupTrendSchema } from "@/lib/statistics/signup-trend";
import { read } from "@/lib/api/gateway.server";

export function loadSignupTrend() {
  return read("signupTrend", { schema: signupTrendSchema });
}
