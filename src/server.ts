import App from "./app";
import CargoController from "./controllers/cargo.conteroller";
import CouponController from "./controllers/coupon.controller";
import ItemController from "./controllers/item.controller";
import JobController from "./controllers/job.controller";
import PaymentController from "./controllers/payment.controller";

new App([new CargoController(), new ItemController(), new PaymentController(), new JobController(), new CouponController()]);  
