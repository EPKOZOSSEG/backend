import { Request, Response, Router } from "express";
import Controller from "../interfaces/controller_interface";
import { getIDfromToken, hasPermission, isLoggedIn } from "../middleware/middleware";
import cargosModel from "../models/cargos.model";
import { CargoService } from "../services/cargo.services";
import { Roles } from "../auth/auth.roles";
import mongoose from "mongoose";
import { PictureServices } from "../services/picture.services";
import { AuthServices } from "../services/auth.services";

export default class CargoController implements Controller {
    public router = Router();
    public cargos = cargosModel.cargoModel;
    public pictureService = new PictureServices("cargos");
    public authService = new AuthServices();
    public upload = this.pictureService.upload;
    public cpUpload = this.pictureService.cpUpload;
    public storage = this.pictureService.storage;

    constructor() {
        this.router.get("/cargos", hasPermission([Roles.CargoView]), (req, res, next) => {
            this.getCargos(req, res).catch(next);
        });
        this.router.get("/cargo", hasPermission([Roles.CargoView]), (req, res, next) => {
            this.getCargosWithPag(req, res).catch(next);
        });

        this.router.get("/cargo/:id", hasPermission([Roles.CargoView]), (req, res, next) => {
            this.getOneCargo(req, res).catch(next);
        });

        this.router.post("/cargo", hasPermission([Roles.CargoAdd]), this.cpUpload, (req, res, next) => {
            this.createCargo(req, res).catch(next);
        });

        this.router.put("/cargo/:id", hasPermission([Roles.CargoEdit]), this.cpUpload, (req, res, next) => {
            this.updateCargo(req, res).catch(next);
        });

        this.router.delete("/cargo/:id", hasPermission([Roles.CargoDelete]), (req, res, next) => {
            this.deleteCargo(req, res).catch(next);
        });

    }

    private getCargos = async (req: Request, res: Response) => {
        try {
            let data: any[] = [];
            data = await this.cargos.find();


            if (data.length > 0) {
                res.send(data);
            } else {
                res.status(404).send({ message: `Cargos not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private getCargosWithPag = async (req: Request, res: Response) => {
        try {
            let data: any[] = [];
            const { filter, limit, offset } = CargoService.parseQueryParameters(req.query);
            const companyFilter = await this.authService.getCompanyIdByName(req.query.companyName as string);
            data = await this.cargos.find({...companyFilter, ...filter}).limit(limit).skip(offset);
            
            data = await this.pictureService.convertData(data);

            if (data.length > 0) {
                res.send(data);
            } else {
                res.status(404).send({ message: `Cargos not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private getOneCargo = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            let data = await this.cargos.findOne({ _id: id });
            data = await this.pictureService.convertDataOne(data);

            if (data) {
                res.send(data);
            } else {
                res.status(404).send({ message: `Cargo not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private createCargo = async (req: Request, res: Response) => {
        try {
            const body = req.body;
            const files: any = req.files;
            const fileNames = files.pictures.map((file: any) => file.filename);
            const { error } = cargosModel.validate(body);
            if (error) {
                res.status(400).send({ message: error.details[0].message });
                return;
            }
            body["_id"] = new mongoose.Types.ObjectId();
            body["isDeleted"] = false;
            body["company_id"] = await getIDfromToken(req);
            body["pictures"] = fileNames;
            const newCargo = new this.cargos(body);
            await newCargo.save();
            res.send(newCargo);
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private updateCargo = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const body = req.body;
            const files: any = req.files;
            const fileNames = files.pictures.map((file: any) => file.filename);
            const { error } = cargosModel.validate(body);

            if (error) {
                res.status(400).send({ message: error.details[0].message });
                return;
            }

            const data = await this.cargos.findOne({ _id: id });

            if (data) {
                const id = await getIDfromToken(req);
                if (id !== data.company_id?.toString()) {
                    res.status(403).json({ error: "Access denied" });
                    return;
                }
                body["pictures"] = fileNames;
                await this.cargos.updateOne({ _id: data._id }, body);
                res.send({ message: "Cargo updated successfully" });
            } else {
                res.status(404).send({ message: `Cargo not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private deleteCargo = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const data = await this.cargos.findOne({ _id: id });
            if (data) {
                const id = await getIDfromToken(req);
                if (id !== data.company_id?.toString()) {
                    res.status(403).json({ error: "Access denied" });
                    return;
                }
                await this.cargos.updateOne({ _id: data._id }, { isDeleted: true });
                res.send({ message: "Cargo deleted successfully" });
            } else {
                res.status(404).send({ message: `Cargo not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };
}
