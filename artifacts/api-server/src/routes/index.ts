import { Router, type IRouter } from "express";
import healthRouter from "./health";
import comfortWorkshopRouter from "./comfort-workshop";

const router: IRouter = Router();

router.use(healthRouter);
router.use(comfortWorkshopRouter);

export default router;
