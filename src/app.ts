import express, { Router } from "express";
import mongoose from "mongoose";
import IController from "./interfaces/controller_interface";
import cors from "cors";
import http from 'http';
import dotenv from 'dotenv';
import AuthController from "./controllers/auth.controller";




export default class App {
    public app: express.Application;


    constructor(controllers: IController[]) {
        this.app = express();
        this.app.use(express.json());
        this.app.use(cors());
        dotenv.config();

        const server = http.createServer(this.app);


        this.connectToTheDatabase().then(() => {
            const port: number | any = process.env.PORT || 8000;
            server.listen(port, "0.0.0.0", function () {
                console.log('Server is running on port ' + port);
            });
        });

        controllers.forEach(controller => {
            this.app.use("/api", controller.router);
        });

        this.app.use("/auth", new AuthController().router);

        setInterval(this.checkTimeIsUp, 1000 * 60 * 20);
    }

    private async connectToTheDatabase() {
        mongoose.set("strictQuery", true);
        try {
            console.log("Connecting to the database...")
            await mongoose.connect("mongodb+srv://admin:admin@bluecard.gssoqxv.mongodb.net/", { connectTimeoutMS: 10000 });
            console.log("Connected to the database");
        } catch (error: any) {
            console.log({ message: error.message });
        }

    }

    private checkTimeIsUp = async () => {
        try {
            const now = new Date();
            const users = await mongoose.connection.db.collection("User").find({ isDeleted: false }).toArray();
            const places = await mongoose.connection.db.collection("Place").find({ $and: [{ schedule: { $elemMatch: { day: now.getDay() } } }, { auto: true }] }).toArray();
            let timesUp: number = 0;
            let auto: number = 0;
            users.forEach(async (element: any) => {
                if (element.startAt) {
                    const startAt = new Date(element.startAt);
                    const diff = now.getTime() - startAt.getTime();
                    const diffInHours = diff / (1000 * 3600);
                    if (diffInHours > 12) {
                        timesUp++;
                        await mongoose.connection.db.collection("User").updateOne({ _id: element._id }, { $set: { startAt: null } });
                    }
                }
            });
            places.forEach(async (element: any) => {
                if (element.schedule) {
                    const schedule = element.schedule;
                    for (const sch of schedule) {
                        if (sch.start && sch.end && sch.day == now.getDay()) {
                            const start = sch.start.split(":");
                            const end = sch.end.split(":");
                            const startAt = new Date();
                            startAt.setHours(parseInt(start[0]));
                            startAt.setMinutes(parseInt(start[1]));
                            startAt.setMinutes(startAt.getMinutes() - 30);
                            const endAt = new Date();
                            endAt.setHours(parseInt(end[0]));
                            endAt.setMinutes(parseInt(end[1]));
                            endAt.setMinutes(endAt.getMinutes() + 30);
                            if (now.getTime() > startAt.getTime() && now.getTime() < endAt.getTime() && !element.startAt) {
                                auto++;
                                await mongoose.connection.db.collection("Place").updateOne({ _id: element._id }, { $set: { startAt: new Date() } });
                            }
                            if (now.getTime() > endAt.getTime() && element.startAt) {
                                auto++;
                                await mongoose.connection.db.collection("Place").updateOne({ _id: element._id }, { $set: { startAt: null } });

                            }
                        }
                    }
                }
            });
            console.log(`${new Date().toLocaleDateString("hu-HU", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })} | ${timesUp} users found! ${auto} places found!`);
        } catch (error: any) {
            console.log({ message: error.message });
        }
    };
}
