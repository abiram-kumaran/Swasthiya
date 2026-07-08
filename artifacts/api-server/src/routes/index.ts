import { Router, type IRouter } from "express";
import healthRouter from "./health";
import centersRouter from "./centers";
import inventoryRouter from "./inventory";
import logsRouter from "./logs";
import attendanceRouter from "./attendance";
import dispatchRouter from "./dispatch";
import chatRouter from "./chat";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(centersRouter);
router.use(inventoryRouter);
router.use(logsRouter);
router.use(attendanceRouter);
router.use(dispatchRouter);
router.use(chatRouter);
router.use(aiRouter);

export default router;
