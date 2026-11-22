const ALLOWED_ORIGINS = new Set(["https://dickynews.github.io"]);
const cors = (origin) => ({
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "null",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, X-GitHub-Api-Version",
  "Access-Control-Max-Age": "86400", "Vary": "Origin"
});
function response(body, status, origin, extra = {}) {
  return new Response(body, { status, headers: { ...cors(origin),
    "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff", ...extra } });
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (!ALLOWED_ORIGINS.has(origin)) return new Response("Forbidden", { status: 403 });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    const url = new URL(request.url);
    if (url.pathname === "/device/code" && request.method === "POST") {
      const form = new URLSearchParams(await request.text()); form.set("client_id", env.GITHUB_CLIENT_ID);
      const upstream = await fetch("https://github.com/login/device/code", { method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded" }, body: form });
      return response(await upstream.text(), upstream.status, origin);
    }
    if (url.pathname === "/oauth/token" && request.method === "POST") {
      const form = new URLSearchParams(await request.text()); form.set("client_id", env.GITHUB_CLIENT_ID);
      const upstream = await fetch("https://github.com/login/oauth/access_token", { method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded" }, body: form });
      return response(await upstream.text(), upstream.status, origin);
    }
    if (url.pathname.startsWith("/api/") && request.method === "GET") {
      const token = request.headers.get("Authorization") || "";
      if (!token.startsWith("Bearer ")) return response(JSON.stringify({ message: "Authorization required" }), 401, origin);
      const apiPath = url.pathname.slice(4) + url.search, pathname = url.pathname.slice(4);
      const allowed = pathname === "/user" || pathname === "/user/installations" ||
        /^\/user\/installations\/\d+\/repositories$/.test(pathname) ||
        pathname === "/users/DickyNews/repos" ||
        /^\/repos\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/contents(?:\/.*)?$/.test(pathname);
      if (!allowed) return response(JSON.stringify({ message: "Endpoint not allowed" }), 403, origin);
      const upstream = await fetch("https://api.github.com" + apiPath, { headers: {
        "Authorization": token, "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "Dicky-News-Design-Studio"
      }});
      return response(await upstream.text(), upstream.status, origin);
    }
    return response(JSON.stringify({ error: "Not found" }), 404, origin);
  }
};
