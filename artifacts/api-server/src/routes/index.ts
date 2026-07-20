import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import categoriesRouter from "./categories";
import brandsRouter from "./brands";
import reviewsRouter from "./reviews";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import vehiclesRouter from "./vehicles";
import wishlistRouter from "./wishlist";
import usersRouter from "./users";
import adminRouter from "./admin";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(categoriesRouter);
router.use(brandsRouter);
router.use(reviewsRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(vehiclesRouter);
router.use(wishlistRouter);
router.use(usersRouter);
router.use(adminRouter);
router.use(paymentsRouter);

export default router;
