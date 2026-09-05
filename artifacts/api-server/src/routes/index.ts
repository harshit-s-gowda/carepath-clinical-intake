import { Router, type IRouter } from "express";
import clinicalRouter from "./clinical";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(clinicalRouter);

export default router;
