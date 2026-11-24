import { describe, expect, it } from "vitest";
import { roles } from "@/content/experience";
import { projects } from "@/content/work";
import { resolveFacts } from "@/facts/store";
import { handleRpc } from "@/lib/mcp";
import { tools } from "@/lib/tools";

const context = { facts: resolveFacts(null) };

/** Sends one request and returns its result, failing the test if there is none. */
function request(method: string, params?: unknown): Record<string, unknown> {
  const response = handleRpc({ jsonrpc: "2.0", id: 1, method, params }, context);
  if (!response?.result) throw new Error(`no result for ${method}: ${JSON.stringify(response)}`);
  return response.result;
}

function call(name: string, args: Record<string, unknown> = {}) {
  return request("tools/call", { name, arguments: args }) as {
    content: { type: string; text: string }[];
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
  };
}

describe("MCP server", () => {
  it("agrees on a protocol version the client asked for", () => {
    const result = request("initialize", { protocolVersion: "2025-06-18" });
    expect(result.protocolVersion).toBe("2025-06-18");
    expect(result.capabilities).toEqual({ tools: {} });
  });

  it("offers its newest version to a client asking for an unknown one", () => {
    expect(request("initialize", { protocolVersion: "1999-01-01" }).protocolVersion).toBe(
      "2025-11-25",
    );
  });

  it("lists every tool with a description and an object schema", () => {
    const listed = request("tools/list").tools as { name: string }[];
    expect(listed.map((tool) => tool.name)).toEqual(tools.map((tool) => tool.name));
    for (const tool of tools) {
      expect(tool.description.length).toBeGreaterThan(20);
      expect(tool.inputSchema.type).toBe("object");
    }
  });

  it("does not reply to notifications", () => {
    const notification = { jsonrpc: "2.0", method: "notifications/initialized" };
    expect(handleRpc(notification, context)).toBeNull();
  });

  it("reports unknown methods, unknown tools and malformed requests", () => {
    expect(handleRpc({ jsonrpc: "2.0", id: 1, method: "nope" }, context)?.error?.code).toBe(-32601);
    const unknownTool = { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "nope" } };
    expect(handleRpc(unknownTool, context)?.error?.code).toBe(-32602);
    expect(handleRpc("hello", context)?.error?.code).toBe(-32600);
  });
});

describe("tools", () => {
  it("runs every tool with no arguments and returns the same data as text and as an object", () => {
    for (const tool of tools) {
      const result = call(tool.name);
      expect(result.isError).toBeUndefined();
      expect(JSON.parse(result.content[0]?.text ?? "")).toEqual(result.structuredContent);
    }
  });

  it("returns the same roles and projects as the page", () => {
    const experience = call("get_experience").structuredContent as { roles: { company: string }[] };
    expect(experience.roles.map((role) => role.company)).toEqual(roles.map((role) => role.company));
    const listed = call("list_projects").structuredContent as {
      projects: { name: string; numbers: { source: string }[] }[];
    };
    expect(listed.projects.map((project) => project.name)).toEqual(projects.map((p) => p.name));
    for (const project of listed.projects) {
      for (const number of project.numbers) expect(number.source).toMatch(/^https:\/\//);
    }
  });

  it("filters by argument", () => {
    const dashlane = call("get_experience", { company: "dash" }).structuredContent as {
      roles: { company: string }[];
    };
    expect(dashlane.roles.map((role) => role.company)).toEqual(["Dashlane"]);
    const papers = call("list_writing", { kind: "paper" }).structuredContent as {
      items: { kind: string }[];
    };
    expect(papers.items.length).toBeGreaterThan(0);
    expect(papers.items.every((item) => item.kind === "paper")).toBe(true);
  });

  it("answers a bad argument with an error the model can read", () => {
    const result = call("list_writing", { kind: "novel" });
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("paper, post, press");
  });
});
