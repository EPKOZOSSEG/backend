import { Request, Response, Router } from "express";
import Controller from "../interfaces/controller_interface";
import { isLoggedIn } from "../middleware/middleware";
import cargosModel from "../models/cargos.model";
import { CargoService } from "../services/cargo.services";
import logModel from "../models/log.model";
import mongoose from "mongoose";

export default class LogController {
    public router = Router();
    public logModel = logModel.logModel;

    constructor() {

        this.router.get("/logs", isLoggedIn, (req, res, next) => {
            this.getLogs(req, res).catch(next);
        });
    }

    private getLogs = async (req: Request, res: Response) => {
        try {
            let data: any[] = [];
            data = await this.logModel.find();

            if (data.length > 0) {
                res.send(data);
            } else {
                res.status(404).send({ message: `Cargos not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };


    public createLog = async (method: string, path: string, status: string, message: string) => {
        try {
            
            const createdDocument = new this.logModel({
                _id: new mongoose.Types.ObjectId(),
                path: path,
                method: method,
                status: status,
                message: message,
                date: new Date()
            });
            
            await createdDocument.save();
        } catch (error: any) {
            // res.status(400).send({ message: error.message });
        }
    };
}
