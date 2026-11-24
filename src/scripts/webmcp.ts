/**
 * WebMCP: offers the site's tools to an AI agent that is driving this browser
 * tab, so it can ask for the resume or the project list instead of reading
 * pixels. The tools are the ones the MCP endpoint serves; this only passes
 * them to the browser and forwards each call to /mcp.
 *
 * The API is new and only in some browsers. Where it is missing this does nothing.
 * https://developer.chrome.com/docs/ai/webmcp
 */

interface PageTool {
  name: string;
  description: string;
  inputSchema: unknown;
  execute(args: unknown): Promise<unknown>;
}

interface ModelContext {
  registerTool(tool: PageTool): unknown;
}

interface ListedTool {
  name: string;
  description: string;
  inputSchema: unknown;
}

/** The API moved from `navigator` to `document` while in trial, so look in both places. */
function modelContext(): ModelContext | undefined {
  const hosts = [document, navigator] as { modelContext?: ModelContext }[];
  return hosts.find((host) => typeof host.modelContext?.registerTool === "function")?.modelContext;
}

async function rpc(method: string, params: unknown): Promise<unknown> {
  const response = await fetch("/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: crypto.randomUUID(), method, params }),
  });
  const body: { result?: unknown; error?: { message: string } } = await response.json();
  if (body.error) throw new Error(body.error.message);
  return body.result;
}

export async function registerPageTools(): Promise<void> {
  const context = modelContext();
  if (!context) return;
  const listed = (await rpc("tools/list", {})) as { tools: ListedTool[] };
  for (const { name, description, inputSchema } of listed.tools) {
    context.registerTool({
      name,
      description,
      inputSchema,
      execute: (args) => rpc("tools/call", { name, arguments: args ?? {} }),
    });
  }
}
