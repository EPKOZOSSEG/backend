import express, { NextFunction, Router } from "express";
import mongoose from "mongoose";
import IController from "./interfaces/controller_interface";
import cors from "cors";
import http from 'http';
import dotenv from 'dotenv';
import AuthController from "./controllers/auth.controller";
import LogController from "./controllers/log.controller";
import PictureController from "./controllers/pictures.controller";
import { getIDfromToken } from "./middleware/middleware";
import cargosModel from "./models/cargos.model";
import commentModel from "./models/comment.model";
import couponModel from "./models/coupon.model";




export default class App {
    public app: express.Application;

    public port: any | number = process.env.PORT || 8000;
    public mongoUrl = process.env.MONGO_URL || "mongodb+srv://admin:admin@epkozosseg.ezb3n.mongodb.net/?retryWrites=true&w=majority&appName=Epkozosseg";

    constructor(controllers: IController[]) {
        this.app = express();
        this.app.use(express.json());
        this.app.use(cors());
        dotenv.config();

        const server = http.createServer(this.app);
        
        this.app.use((req, res, next) => {
            res.on('finish', () => {
                console.log(`Response Status: ${req.method} ${req.path} : ${res.statusCode} - ${res.statusMessage}`);  
                // new LogController().createLog(req.method, req.path, res.statusCode, res.statusMessage).catch(next);
            });
            next();
        });

        this.connectToTheDatabase().then(() => {
            
            server.listen(this.port, "0.0.0.0", function () {
                console.log('Server is running');
            });
        });

        controllers.forEach(controller => {
            this.app.use("/api", controller.router);
        });

        this.app.use("/auth", new AuthController().router);
        this.app.use("", new PictureController().router);

        
    }

    private async connectToTheDatabase() {
        mongoose.set("strictQuery", true);
        try {
            console.log("Connecting to the database...")
            await mongoose.connect(this.mongoUrl, { connectTimeoutMS: 10000 });

            cargosModel.cargoModel.init();
            commentModel.commentModel.init();
            couponModel.couponModel.init();
            
            console.log("Connected to the database");
        } catch (error: any) {
            console.log({ message: error.message });
        }

    }
}
