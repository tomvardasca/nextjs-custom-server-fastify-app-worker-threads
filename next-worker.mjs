import Next from "next";
import http from "http";

const dev = process.env.NODE_ENV !== "production";

async function initialize() {
  const app = Next({ dev });
  const handle = app.getRequestHandler();
  await app.prepare();
  return async ({ req, port }) => {
    const request = new http.IncomingMessage({});
    request.url = req.url;
    request.method = req.method;
    request.headers = req.headers;
    const response = new http.ServerResponse(request);

    const responseProxy = new Proxy(response, {
      get: function (target, property, receiver) {
        const value = Reflect.get(target, property, receiver);

        if (typeof value === "function") {
          if (value.name === "end") {
            return function () {
              return port.postMessage({ fn: "send", args: [arguments[0]] });
            };
          }
          if (value.name === "getHeader") {
            return function () {
              value.apply(target, arguments);
            };
          }
          if (value.name === "hasHeader") {
            return function () {
              value.apply(target, arguments);
            };
          }
          if (value.name === "setHeader") {
            return function () {
              value.apply(target, arguments);
              return port.postMessage({
                fn: "header",
                args: [arguments[0], arguments[1]],
              });
            };
          }
          if (value.name === "writeHead") {
            return function () {
              return port.postMessage({ fn: "status", args: [arguments[0]] });
            };
          }
          return value.bind(target);
        }

        return value;
      },
    });
    await app.render(request, responseProxy, "/a", "");
    port.postMessage({ p: "send", value: true });
  };
}

export default initialize();
