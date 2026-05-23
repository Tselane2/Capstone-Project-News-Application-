import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ── Request logging ───────────────────────────────────────────────────────────
// Log method, path (without query string), and response status for every
// request. Sensitive query params are intentionally stripped from the URL.
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ── Standard middleware ───────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API routes ────────────────────────────────────────────────────────────────
// All routes are mounted under /api so they're cleanly separated from any
// static assets served by the frontend proxy.
app.use("/api", router);

// ── Global error handler ──────────────────────────────────────────────────────
// Catches any error thrown (or passed to next()) inside a route handler.
// Without this, unhandled rejections would leave the client waiting forever.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  req.log.error({ err }, "Unhandled route error");
  res.status(500).json({ error: "An unexpected server error occurred" });
});

export default app;
