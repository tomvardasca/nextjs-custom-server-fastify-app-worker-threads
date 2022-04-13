import Next from "next";
import { Piscina } from "piscina";

import fastifyFactory from "fastify";

const fastify = fastifyFactory({
  logger: { level: "error" },
  pluginTimeout: 0,
});

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== "production";

fastify.register((fastify, opts, next) => {
  const app = Next({ dev });
  const handle = app.getRequestHandler();

  const pool = new Piscina({
    filename: new URL("./next-worker.mjs", import.meta.url).href,
  });
  fastify.decorate("piscina", pool);
  fastify.decorate("run", (...args) => pool.run(...args));

  app
    .prepare()
    .then(() => {
      if (dev) {
        fastify.get("/_next/*", (req, reply) => {
          return handle(req.raw, reply.raw).then(() => {
            reply.sent = true;
          });
        });
      }

      fastify.get("/aw", async (req, reply) => {
        const { url, method, headers, body } = req;
        const channel = new MessageChannel();
        const p = new Promise((r) => {
          channel.port2.on("message", (args) => {
            if (args.fn && reply[args.fn]) {
              reply[args.fn].apply(reply, args.args);
            }
            if (args.p) {
              reply[args.p] = args.value;
            }
            if (args.p == "sent" && args.value) {
              r();
            }
          });
        });

        await fastify.run(
          {
            req: { url, method, headers, body },
            port: channel.port1,
          },
          { transferList: [channel.port1] },
        );
        await p;
        channel.port2.close();
      });

      fastify.get("/as", (req, reply) => {
        return app.render(req.raw, reply.raw, "/a", req.query).then(() => {
          reply.sent = true;
        });
      });

      fastify.get("/b", (req, reply) => {
        return app.render(req.raw, reply.raw, "/b", req.query).then(() => {
          reply.sent = true;
        });
      });

      fastify.all("/*", (req, reply) => {
        return handle(req.raw, reply.raw).then(() => {
          reply.sent = true;
        });
      });

      fastify.setNotFoundHandler((request, reply) => {
        return app.render404(request.raw, reply.raw).then(() => {
          reply.sent = true;
        });
      });

      next();
    })
    .catch((err) => next(err));
});

fastify.listen(port, (err) => {
  if (err) throw err;
  console.log(`> Ready on http://localhost:${port}`);
});
