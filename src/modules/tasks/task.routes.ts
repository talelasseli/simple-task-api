import { Router } from "express";
import * as controller from "./task.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);
//new changeeeeeee
router.get("/", controller.getTasks);
router.post("/", controller.createTask);
router.put("/:id", controller.updateTask);
router.delete("/:id", controller.deleteTask);
router.get("/:id", controller.getTask);
export default router;
