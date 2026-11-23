import type { APIRoute } from "astro";
import { jsonResume } from "@/lib/structured-data";

export const GET: APIRoute = () =>
  new Response(JSON.stringify(jsonResume(), null, 2), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
