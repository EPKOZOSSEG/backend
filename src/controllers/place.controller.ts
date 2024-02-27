import { Request, Response, Router } from "express";
import Controller from "../interfaces/controller_interface";
import placeModel from "../models/places.model"
import mongoose from "mongoose";
import { getIDfromToken, isLoggedInWithRole } from "../middleware/middleware";

export default class PlaceController implements Controller {
    public router = Router();
    public place = placeModel;

    constructor() {

        this.router.get("/allplaces", isLoggedInWithRole(["moderator", "admin"]), (req, res, next) => {
            this.getPlaces(req, res).catch(next);
        });

        this.router.get("/places", isLoggedInWithRole(["moderator", "admin"]), (req, res, next) => {
            this.getPlacesByDay(req, res).catch(next);
        });

        this.router.put("/place/start/:id", isLoggedInWithRole(["moderator"]), (req, res, next) => {
            this.startTime(req, res).catch(next);
        });

        this.router.put("/place/end/:id", isLoggedInWithRole(["moderator"]), (req, res, next) => {
            this.endTime(req, res).catch(next);
        });

        this.router.put("/place/auto", isLoggedInWithRole(["moderator"]), (req, res, next) => {
            this.autoMode(req, res).catch(next);
        });

        this.router.put("/place/auto/:id", isLoggedInWithRole(["moderator"]), (req, res, next) => {
            this.autoModeByID(req, res).catch(next);
        });

        this.router.post("/place", isLoggedInWithRole(["moderator", "admin"]), (req, res, next) => {
            this.create(req, res).catch(next);
        });

        this.router.put("/place/:id", isLoggedInWithRole(["moderator", "admin"]), (req, res, next) => {
            this.put(req, res).catch(next);
        });

        this.router.delete("/place/:id", isLoggedInWithRole(["moderator", "admin"]), (req, res, next) => {
            this.delete(req, res).catch(next);
        });


    }

    private create = async (req: Request, res: Response) => {
        try {
            const body = req.body;
            const createdDocument = new this.place({
                ...body
            });
            createdDocument["_id"] = new mongoose.Types.ObjectId();
            const savedDocument = await createdDocument.save();
            res.send({ new: savedDocument, message: "OK" });
        } catch (error: any | Error) {
            res.status(400).send({ message: error.message });
        }
    };

    private delete = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const updatedDoc = await this.place.deleteOne({ _id: id });
            if (updatedDoc) {
                res.send({ message: `OK` });
            } else {
                res.status(404).send({ message: `Hely a(z) ${id} azonosítóval nem található!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private put = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const body = req.body;
            const modificationResult = await this.place.replaceOne({ _id: id }, body, { runValidators: true });
            if (modificationResult.modifiedCount) {
                res.send({ message: `OK` });
            } else {
                res.status(404).send({ message: `Hely a(z) ${id} azonosítóval nem található!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private getPlaces = async (req: Request, res: Response) => {
        try {
            const id = await getIDfromToken(req);

            if (id) {
                const data = await this.place.find({ "startBy": { "$eq": id } });
                if (data.length > 0) {
                    res.send(data);
                } else {
                    res.status(404).send({ message: `Hely nem található!` });
                }
            } else {
                res.status(400).send({ message: `Access denied!` });
            }

        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private getPlacesByDay = async (req: Request, res: Response) => {
        try {
            const id = await getIDfromToken(req);
            const day = parseInt(req.query.day as string);
            if (id) {
                const data = await this.place.find({ $and: [{ "startBy": { "$eq": id } }, { "schedule": { "$elemMatch": { "day": day } } }] });

                res.send(data);
            } else {
                res.status(400).send({ message: `Access denied!` });
            }

        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private startTime = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const updatedDoc = await this.place.findById(id);
            if (updatedDoc && updatedDoc.startAt == null) {
                const body = updatedDoc;
                body.startAt = new Date();
                body.blocked = [];
                body.allowed = [];
                const modificationResult = await this.place.replaceOne({ _id: id }, body, { runValidators: true });
                if (modificationResult.modifiedCount) {
                    res.send({ message: `OK` });
                } else {
                    res.status(404).send({ message: `Hely a(z) ${id} azonosítóval nem található!` });
                }
            } else {
                res.status(404).send({ message: `Hely a(z) ${id} azonosítóval nem található!` });
            }

        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private endTime = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const place = await this.place.findById(id);
            const body = place;
            if (body) {
                const blocking = await mongoose.connection.db.collection("User").find({ "$and": [{ where: id }, { startAt: { $ne: null } }] }).toArray();
                const allowing = await mongoose.connection.db.collection("User").find({ "$and": [{ where: id }, { startAt: { $eq: null } }] }).toArray();

                body.blocked = blocking;
                body.allowed = allowing;

                await mongoose.connection.db.collection("User").updateMany({ startAt: { $ne: null } }, { $set: { startAt: null } });

                body.startAt = undefined;
                const modificationResult = await this.place.replaceOne({ _id: req.params.id }, body, { runValidators: true });
                if (modificationResult.modifiedCount) {
                    res.send({ message: `OK` });
                }
            } else {
                res.status(404).send({ message: `Hely a(z) ${id} azonosítóval nem található!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private autoMode = async (req: Request, res: Response) => {
        try {
            const id = await getIDfromToken(req);
            const updatedDoc = await this.place.updateMany({ startBy: id }, { auto: true }, { runValidators: true });
            if (updatedDoc && updatedDoc.modifiedCount > 0) {
                res.send({ message: `OK` });
            } else {
                const updatedDoc = await this.place.updateMany({ startBy: id }, { auto: false }, { runValidators: true });
                if (updatedDoc && updatedDoc.modifiedCount > 0) {
                    res.send({ message: `OK` });
                } else {
                    res.status(404).send({ message: `Helyeket nem tudtukl módosítani!` });
                }
            }

        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private autoModeByID = async (req: Request, res: Response) => {
        try {
            const id = await getIDfromToken(req);
            const placeId = req.params.id;
            const updatedDoc = await this.place.updateMany({ $and: [{ startBy: id }, { _id: placeId }] }, { auto: req.query.auto }, { runValidators: true });
            if (updatedDoc && updatedDoc.modifiedCount > 0) {
                res.send({ message: `OK` });
            } else {
                res.status(404).send({ message: `Helyeket nem tudtukl módosítani!` });
            }

        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };
}
