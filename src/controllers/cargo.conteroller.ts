import { Request, Response, Router } from "express";
import Controller from "../interfaces/controller_interface";
import { getIDfromToken, hasPermission, isLoggedIn } from "../middleware/middleware";
import cargosModel from "../models/cargos.model";
import { CargoService } from "../services/cargo.services";
import { Roles } from "../auth/auth.roles";
import mongoose from "mongoose";

export default class CargoController implements Controller {
    public router = Router();
    public cargos = cargosModel.cargoModel;

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

        this.router.post("/cargo", hasPermission([Roles.CargoAdd]), (req, res, next) => {
            this.createCargo(req, res).catch(next);
        });

        this.router.put("/cargo/:id", hasPermission([Roles.CargoEdit]), (req, res, next) => {
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
            data = await this.cargos.find(filter).limit(limit).skip(offset);

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
            const data = await this.cargos.findOne({ _id: id });

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
            console.log(req);
            const { error } = cargosModel.validate(body);
            if (error) {
                res.status(400).send({ message: error.details[0].message });
                return;
            }
            body["_id"] = new mongoose.Types.ObjectId();
            body["isDeleted"] = false;
            body["company_id"] = await getIDfromToken(req);
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
            const { error } = cargosModel.validate(body);
            if (error) {
                res.status(400).send({ message: error.details[0].message });
                return;
            }

            const data = await this.cargos.findOne({ _id: id });

            if (data) {
                const id = await getIDfromToken(req);
                if (id !== data.company_id) {
                    res.status(403).json({ error: "Access denied" });
                    return;
                }
                await this.cargos.updateOne({ _id: id }, body);
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
                if (id !== data.company_id) {
                    res.status(403).json({ error: "Access denied" });
                    return;
                }
                await this.cargos.updateOne({ _id: id }, { isDeleted: true });
                res.send({ message: "Cargo deleted successfully" });
            } else {
                res.status(404).send({ message: `Cargo not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };
}
