export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    if (host.endsWith(".workers.dev")) {
      const target = "https://qingmingyu.com" + url.pathname + url.search;
      return Response.redirect(target, 301);
    }

    return env.ASSETS.fetch(request);
  },
};
