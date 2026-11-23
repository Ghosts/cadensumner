/**
 * Secrets set with `wrangler secret put`. Bindings declared in wrangler.jsonc
 * are typed by `wrangler types`; secrets are not, so they are listed here.
 */
interface Secrets {
  /** Read-only GitHub token used to count contributions. Without it that number is not refreshed. */
  GITHUB_TOKEN?: string;
}

interface Env extends Secrets {}

declare namespace Cloudflare {
  interface Env extends Secrets {}
}
