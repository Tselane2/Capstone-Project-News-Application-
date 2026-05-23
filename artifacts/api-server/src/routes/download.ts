import { Router, type IRouter } from "express";
import path from "path";
import fs from "fs";

const router: IRouter = Router();

const WORKSPACE = "/home/runner/workspace";

const FILES: Record<string, { file: string; name: string; type: string }> = {
  "/download":          { file: "the-press-room-source.tar.gz",  name: "the-press-room-source.tar.gz",  type: "application/gzip" },
  "/download/planning": { file: "the-press-room-planning.tar.gz", name: "the-press-room-planning.tar.gz", type: "application/gzip" },
  "/download/readme":   { file: "README.md",                      name: "README.md",                      type: "text/markdown" },
};

Object.entries(FILES).forEach(([route, { file, name, type }]) => {
  router.get(route, (_req, res) => {
    const filePath = path.resolve(WORKSPACE, file);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "File not found" });
      return;
    }
    res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
    res.setHeader("Content-Type", type);
    res.sendFile(filePath);
  });
});

export default router;
