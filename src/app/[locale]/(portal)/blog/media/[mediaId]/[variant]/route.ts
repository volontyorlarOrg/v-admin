import { getSession } from "@/lib/auth/session.server";
import { apiBaseUrl } from "@/lib/auth/config";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/[locale]/blog/media/[mediaId]/[variant]">,
) {
  const { mediaId, variant } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(mediaId) || !["sm", "md", "lg"].includes(variant))
    return new Response(null, { status: 404 });
  const session = await getSession();
  const origin = apiBaseUrl();
  if (!session || !session.roles.includes("admin") || !origin)
    return new Response(null, { status: 403 });
  const source = await fetch(
    new URL(`/admin/blog/media/${mediaId}/${variant}`, `${origin}/`),
    {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!source.ok) return new Response(null, { status: 404 });
  return new Response(source.body, {
    headers: { "Content-Type": "image/webp", "Cache-Control": "private, no-store" },
  });
}
