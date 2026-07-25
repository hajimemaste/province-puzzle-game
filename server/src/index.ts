import "dotenv/config";
import express from "express";
import cors from "cors";
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

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
