import { Request, Response, Router } from "express";
import Controller from "../interfaces/controller_interface";
import { getIDfromToken, hasPermission, isLoggedIn } from "../middleware/middleware";
import { CouponService } from "../services/coupon.service";
import { Roles } from "../auth/auth.roles";
import couponModel from "../models/coupon.model";

export default class CouponController implements Controller {
    public router = Router();
    public coupons = couponModel.couponModel;

    constructor() {
        this.router.get("/coupons", hasPermission([Roles.CouponView]), (req, res, next) => {
            this.getCoupons(req, res).catch(next);
        });
        this.router.get("/coupon", hasPermission([Roles.CouponView]), (req, res, next) => {
            this.getCouponsWithPag(req, res).catch(next);
        });
        this.router.get("/coupon/:id", hasPermission([Roles.CouponView]), (req, res, next) => {
            this.getOneCoupon(req, res).catch(next);
        });

        this.router.post("/coupon", hasPermission([Roles.CouponAdd]), (req, res, next) => {
            this.createCoupon(req, res).catch(next);
        });

        this.router.put("/coupon/:id", hasPermission([Roles.CouponEdit]), (req, res, next) => {
            this.updateCoupon(req, res).catch(next);
        });

        this.router.delete("/coupon/:id", hasPermission([Roles.CouponDelete]), (req, res, next) => {
            this.deleteCoupon(req, res).catch(next);
        });

    }

    private getCoupons = async (req: Request, res: Response) => {
        try {
            let data: any[] = [];
            data = await this.coupons.find();

            if (data.length > 0) {
                res.send(data);
            } else {
                res.status(404).send({ message: `Coupons not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private getCouponsWithPag = async (req: Request, res: Response) => {
        try {
            let data: any[] = [];
            const { filter, limit, offset } = CouponService.parseQueryParameters(req.query);
            data = await this.coupons.find(filter).limit(limit).skip(offset);

            if (data.length > 0) {
                res.send(data);
            } else {
                res.status(404).send({ message: `Coupons not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private getOneCoupon = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const data = await this.coupons.findOne({ _id: id });

            if (data) {
                res.send(data);
            } else {
                res.status(404).send({ message: `Coupon not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private createCoupon = async (req: Request, res: Response) => {
        try {
            const body = req.body;
            const { error } = couponModel.validate(body);
            if (error) {
                res.status(400).send({ message: error.details[0].message });
                return;
            }
            body["company_id"] = await getIDfromToken(req);
            const newCoupon = new this.coupons(body);
            await newCoupon.save();
            res.send(newCoupon);
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private updateCoupon = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const body = req.body;
            const { error } = couponModel.validate(body);
            if (error) {
                res.status(400).send({ message: error.details[0].message });
                return;
            }

            const data = await this.coupons.findOne({ _id: id });

            if (data) {
                const id = await getIDfromToken(req);
                if (id !== data.company_id) {
                    res.status(403).json({ error: "Access denied" });
                    return;
                }
                await this.coupons.updateOne({ _id: id }, body);
                res.send({ message: "Coupon updated successfully" });
            } else {
                res.status(404).send({ message: `Coupon not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private deleteCoupon = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const data = await this.coupons.findOne({ _id: id });
            if (data) {
                const id = await getIDfromToken(req);
                if (id !== data.company_id) {
                    res.status(403).json({ error: "Access denied" });
                    return;
                }
                await this.coupons.updateOne({ _id: id }, { isDeleted: true });
                res.send({ message: "Coupon deleted successfully" });
            } else {
                res.status(404).send({ message: `Coupon not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };
}
