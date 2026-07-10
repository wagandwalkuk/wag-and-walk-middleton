export default {
  fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === "wagandwalk.uk") {
      url.hostname = "www.wagandwalk.uk";
      return Response.redirect(url.toString(), 301);
    }

    return env.ASSETS.fetch(request);
  },
};
