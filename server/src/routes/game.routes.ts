import { Router } from "express";
import * as game from "../controllers/game.controller";

const router = Router();

router.get("/old-provinces", game.listOldProvinces);
router.post("/validate-merge", game.postValidateMerge);
router.post("/level1/complete", game.postLevel1Complete);
router.get("/puzzle-canvas", game.getPuzzleCanvas);
router.get("/pieces", game.listPieces);
router.post("/level2/complete", game.postLevel2Complete);
router.post("/verify-station-answer", game.postVerifyStationAnswer);
router.post("/score", game.postScore);
router.get("/leaderboard", game.getLeaderboard);

export default router;
