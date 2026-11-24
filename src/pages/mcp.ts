import type { APIRoute } from "astro";
import { currentFacts } from "@/lib/home";
import { handleRpc, type RpcResponse } from "@/lib/mcp";

export const prerender = false;

/**
 * The MCP endpoint, over Streamable HTTP. A client POSTs JSON-RPC and gets JSON
 * back. There is no session and no event stream, so GET is refused, as the
 * transport spec asks of a server that does not offer one.
 *
 * Everything served here is public and read-only, so any origin may call it.
 */
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, accept, mcp-protocol-version, mcp-session-id",
  "access-control-max-age": "86400",
} as const;

/** Requests are a few hundred bytes. Anything much larger is not a real client. */
const MAX_BODY_BYTES = 64 * 1024;
const PARSE_ERROR = -32700;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const text = await request.text();
  let message: unknown;
  try {
    if (text.length > MAX_BODY_BYTES) throw new Error("too large");
    message = JSON.parse(text);
  } catch {
    const error = { code: PARSE_ERROR, message: "The request body is not valid JSON." };
    return json({ jsonrpc: "2.0", id: null, error }, 400);
  }

  const context = { facts: await currentFacts() };
  // Older clients may send several messages in one array.
  if (Array.isArray(message)) {
    const responses = message
      .map((entry) => handleRpc(entry, context))
      .filter((response): response is RpcResponse => response !== null);
    return responses.length > 0
      ? json(responses)
      : new Response(null, { status: 202, headers: CORS });
  }
  const response = handleRpc(message, context);
  return response ? json(response) : new Response(null, { status: 202, headers: CORS });
};

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS });

export const GET: APIRoute = () =>
  new Response("This is an MCP endpoint. Connect an MCP client to it, or POST JSON-RPC.\n", {
    status: 405,
    headers: { allow: "POST, OPTIONS", "content-type": "text/plain; charset=utf-8", ...CORS },
  });
