import { profile } from "@/content/profile";
import { findTool, type ToolContext, ToolInputError, tools } from "@/lib/tools";

/**
 * A Model Context Protocol server, small enough to write by hand: it only has
 * tools, keeps no session, and every request is answered in one response. This
 * file is the protocol; src/pages/mcp.ts is the HTTP route around it.
 *
 * https://modelcontextprotocol.io/specification
 */

/** Protocol revisions this server speaks, newest first. */
const PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26"] as const;

const SERVER_INFO = { name: "cadensumner", title: profile.name, version: "1.0.0" } as const;

const INSTRUCTIONS = `Facts about ${profile.name}, a ${profile.role.toLowerCase()} in ${profile.location}: his work history, the products he builds, his writing and how to reach him. Everything is read-only and matches ${profile.url}.`;

/** JSON-RPC error codes used here. */
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;

type JsonObject = Record<string, unknown>;
type RequestId = string | number;

export interface RpcResponse {
  jsonrpc: "2.0";
  id: RequestId | null;
  result?: JsonObject;
  error?: { code: number; message: string };
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function failure(id: RequestId | null, code: number, message: string): RpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function initialize(params: JsonObject): JsonObject {
  const requested = params.protocolVersion;
  const protocolVersion = PROTOCOL_VERSIONS.find((version) => version === requested);
  return {
    // A client asking for a revision this server does not know is offered the newest one.
    protocolVersion: protocolVersion ?? PROTOCOL_VERSIONS[0],
    capabilities: { tools: {} },
    serverInfo: SERVER_INFO,
    instructions: INSTRUCTIONS,
  };
}

function listTools(): JsonObject {
  return {
    tools: tools.map(({ name, title, description, inputSchema }) => ({
      name,
      title,
      description,
      inputSchema,
      annotations: { readOnlyHint: true, openWorldHint: false },
    })),
  };
}

/** Runs a tool. A bad argument is a tool error the model can read and correct, not a protocol error. */
function callTool(params: JsonObject, context: ToolContext): JsonObject | null {
  const tool = typeof params.name === "string" ? findTool(params.name) : undefined;
  if (!tool) return null;
  const args = isObject(params.arguments) ? params.arguments : {};
  try {
    const result = tool.run(args, context);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  } catch (error) {
    if (!(error instanceof ToolInputError)) throw error;
    return { content: [{ type: "text", text: error.message }], isError: true };
  }
}

/**
 * Answers one JSON-RPC message. Returns nothing for a notification, which
 * expects no reply.
 */
export function handleRpc(message: unknown, context: ToolContext): RpcResponse | null {
  if (!isObject(message) || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return failure(null, INVALID_REQUEST, "Expected a JSON-RPC 2.0 request.");
  }
  const { id, method } = message;
  if (typeof id !== "string" && typeof id !== "number") return null;
  const params = isObject(message.params) ? message.params : {};

  switch (method) {
    case "initialize":
      return { jsonrpc: "2.0", id, result: initialize(params) };
    case "ping":
      return { jsonrpc: "2.0", id, result: {} };
    case "tools/list":
      return { jsonrpc: "2.0", id, result: listTools() };
    case "tools/call": {
      const result = callTool(params, context);
      return result
        ? { jsonrpc: "2.0", id, result }
        : failure(id, INVALID_PARAMS, `Unknown tool: ${String(params.name)}`);
    }
    default:
      return failure(id, METHOD_NOT_FOUND, `Method not found: ${method}`);
  }
}
