import { Request, Response, Router } from "express";
import Controller from "../interfaces/controller_interface";
import { getIDfromToken, hasPermission, isLoggedIn } from "../middleware/middleware";
import { CouponService } from "../services/coupon.services";
import { Roles } from "../auth/auth.roles";
import couponModel from "../models/coupon.model";
import mongoose from "mongoose";
import { AuthServices } from "../services/auth.services";
import { PictureServices } from "../services/picture.services";

export default class CouponController implements Controller {
    public router = Router();
    public coupons = couponModel.couponModel;
    public pictureService = new PictureServices("coupon");
    public upload = this.pictureService.upload;
    public cpUpload = this.pictureService.cpUpload;
    public storage = this.pictureService.storage;
    public authService = new AuthServices();

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

        this.router.post("/coupon", hasPermission([Roles.CouponAdd]), this.cpUpload, (req, res, next) => {
            this.createCoupon(req, res).catch(next);
        });

        this.router.put("/coupon/:id", hasPermission([Roles.CouponEdit]), this.cpUpload, (req, res, next) => {
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
            
            const companyFilter = await this.authService.getCompanyIdByName(req.query.companyName as string);
            data = await this.coupons.find({...companyFilter, ...filter}).limit(limit).skip(offset);

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
            body["_id"] = new mongoose.Types.ObjectId();
            body["isDeleted"] = false;
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
                if (id !== data.company_id?.toString()) {
                    res.status(403).json({ error: "Access denied" });
                    return;
                }
                await this.coupons.updateOne({ _id: data._id }, body);
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
