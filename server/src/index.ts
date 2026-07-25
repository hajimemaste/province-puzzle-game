import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import adminRoutes from "./routes/admin.routes";
import gameRoutes from "./routes/game.routes";
import { piecesDir, originalsDir } from "./services/puzzleImage.service";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

app.use("/pieces", express.static(piecesDir()));
app.use("/originals", express.static(originalsDir()));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/admin", adminRoutes);
app.use("/api/game", gameRoutes);

// In production the client build is copied next to this compiled server
// (see Dockerfile) so a single Railway service can serve both API and app.
const clientDistPath = path.join(__dirname, "..", "client-dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
