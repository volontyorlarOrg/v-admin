export const PROXY_SECRET_HEADER = "X-Volontyorlar-Proxy-Secret";
export const CLIENT_IP_HEADER = "X-Volontyorlar-Client-Ip";

const MAX_ADDRESS_LENGTH = 45;
const ADDRESS_PATTERN = /^[0-9A-Fa-f:.]+$/;

type IncomingHeaders = Pick<Headers, "get">;

export function visitorAddress(incoming: IncomingHeaders): string | null {
  const candidate =
    incoming.get("x-real-ip") ?? incoming.get("x-forwarded-for")?.split(",")[0];
  const address = candidate?.trim();
  if (!address || address.length > MAX_ADDRESS_LENGTH) return null;
  return ADDRESS_PATTERN.test(address) ? address : null;
}

export function visitorHeaders(
  secret: string | null,
  incoming: IncomingHeaders,
): Record<string, string> {
  if (!secret) return {};
  const address = visitorAddress(incoming);
  return address ? { [PROXY_SECRET_HEADER]: secret, [CLIENT_IP_HEADER]: address } : {};
}
