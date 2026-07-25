import { Router } from "express";
import { requireAdmin } from "../middleware/auth";
import { uploadImage } from "../middleware/upload";
import * as admin from "../controllers/admin.controller";

const router = Router();

router.post("/login", admin.login);

router.use(requireAdmin);

router.get("/new-provinces", admin.listNewProvinces);
router.post("/new-provinces", admin.createNewProvince);
router.put("/new-provinces/:id", admin.updateNewProvince);
router.delete("/new-provinces/:id", admin.deleteNewProvince);

router.get("/old-provinces", admin.listOldProvinces);
router.post("/old-provinces", admin.createOldProvince);
router.put("/old-provinces/:id", admin.updateOldProvince);
router.delete("/old-provinces/:id", admin.deleteOldProvince);

router.get("/puzzle-image", admin.getPuzzleImageConfig);
router.post("/puzzle-image", uploadImage.single("image"), admin.uploadPuzzleImage);
router.put("/puzzle-image/:id/assignments", admin.savePuzzleImageAssignments);
router.put("/puzzle-image/:id/settings", admin.putPuzzleImageSettings);

router.get("/scores", admin.listScores);
router.delete("/scores/:id", admin.deleteScore);
router.delete("/scores", admin.clearScores);

export default router;
