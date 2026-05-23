import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import publishersRouter from "./publishers";
import articlesRouter from "./articles";
import newslettersRouter from "./newsletters";
import subscriptionsRouter from "./subscriptions";
import statsRouter from "./stats";
import downloadRouter from "./download";

const router: IRouter = Router();

router.use(healthRouter);
router.use(downloadRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(publishersRouter);
router.use(articlesRouter);
router.use(newslettersRouter);
router.use(subscriptionsRouter);
router.use(statsRouter);

export default router;
