import { Request, Response, Router } from "express";
import Controller from "../interfaces/controller_interface";
import userModel from "../models/user.model"
import mongoose from "mongoose";
import placeModel from "../models/places.model";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { isLoggedIn, isLoggedInWithRole, getIDfromToken } from "../middleware/middleware";

export default class UserController implements Controller {
    public router = Router();
    public user = userModel;
    public place = placeModel;

    constructor() {

        this.router.put("/user/start/:where", isLoggedInWithRole(["user"]), (req, res, next) => {
            this.startTime(req, res).catch(next);
        });

        this.router.get("/users", isLoggedInWithRole(["admin"]), (req, res, next) => {
            this.getUser(req, res).catch(next);
        });

        this.router.put("/user/:id", isLoggedInWithRole(["admin"]), (req, res, next) => {
            this.put(req, res).catch(next);
        });

        this.router.delete("/user", isLoggedInWithRole(["user", "moderator"]), (req, res, next) => {
            this.delete(req, res).catch(next);
        });

        this.router.delete("/user/:id", isLoggedInWithRole(["admin"]), (req, res, next) => {
            this.deleteById(req, res).catch(next);
        });

        this.router.get("/settings", isLoggedInWithRole(["user", "moderator", "admin"]), (req, res, next) => {
            this.getSettings(req, res).catch(next);
        });

        this.router.put("/settings", isLoggedInWithRole(["user", "moderator", "admin"]), (req, res, next) => {
            this.settings(req, res).catch(next);
        });

    }

    private getUser = async (req: Request, res: Response) => {
        try {

            const lastWeek = req.query.lastWeek;
            const where = req.query.where;

            let data: any[] = [];

            if (lastWeek) {
                data = await this.getUserByWeek(req, res);
            } else if (where) {
                data = await this.lastWhere(req, res);
            } else {
                data = await this.user.find();
            }

            if (data.length > 0) {
                res.send(data);
            } else {
                res.status(404).send({ message: `Felhasználó nem található!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private getSettings = async (req: Request, res: Response) => {
        try {
            const id = await getIDfromToken(req);
            const data = await this.user.findById(id);
            if (data) {
                res.send(data.settings);
            } else {
                res.status(404).send({ message: `Felhasználó nem található!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }   
    }

    private getUserByWeek = async (req: Request, res: Response) => {
        try {
            const data = await this.user.find({ $and: [{ "createdAt": { "$gte": new Date(new Date().setDate(new Date().getDate() - 7)), "$lt": new Date() } }] });
            return data;
        } catch (error: any) {
            res.status(400).send({ message: error.message });
            return [];
        }
    };

    private lastWhere = async (req: Request, res: Response) => {
        try {
            const where = req.query.where;
            const data = await this.user.find({ $and: [{ "where": { "$eq": where } }] });
            return data;
        } catch (error: any) {
            res.status(400).send({ message: error.message });
            return [];
        }
    };

    private put = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const body = req.body;
            const modificationResult = await this.user.replaceOne({ _id: id }, body, { runValidators: true });
            if (modificationResult.modifiedCount) {
                res.send({ message: `OK` });
            } else {
                res.status(404).send({ message: `Felhasználó a(z) ${id} azonosítóval nem található!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private delete = async (req: Request, res: Response) => {
        try {
            const id = await getIDfromToken(req);
            const updatedDoc = await this.user.findById(id);
            const body = updatedDoc;
            if (body) {
                body.isDeleted = true;
                const modificationResult = await this.user.replaceOne({ _id: id }, body, { runValidators: true });
                if (modificationResult.modifiedCount) {
                    res.send({ message: `OK` });
                } else {
                    res.status(404).send({ message: `Felhasználó a(z) ${id} azonosítóval nem található!` });
                }
            } else {
                res.status(404).send({ message: `Felhasználó a(z) ${id} azonosítóval nem található!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private deleteById = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const updatedDoc = await this.user.findById(id);
            const body = updatedDoc;
            if (body) {
                body.isDeleted = true;
                const modificationResult = await this.user.replaceOne({ _id: id }, body, { runValidators: true });
                if (modificationResult.modifiedCount) {
                    res.send({ message: `OK` });
                } else {
                    res.status(404).send({ message: `Felhasználó a(z) ${id} azonosítóval nem található!` });
                }
            } else {
                res.status(404).send({ message: `Felhasználó a(z) ${id} azonosítóval nem található!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private startTime = async (req: Request, res: Response) => {
        try {

            const id = await getIDfromToken(req);
            const where = req.params.where;
            const updatedDoc = await this.user.findById(id);
            const place = await this.place.findById({ _id: where });

            if (updatedDoc && updatedDoc.startAt == null && place?.startAt != null) {
                const body = updatedDoc;
                body.startAt = new Date();
                body.where = place._id.toString();
                const modificationResult = await this.user.replaceOne({ _id: id }, body, { runValidators: true });
                if (modificationResult.modifiedCount) {
                    res.send({ message: `OK` });
                } else {
                    res.status(404).send({ message: `Felhasználó a(z) ${id} azonosítóval nem található!` });
                }
            } else {
                if (place?.startAt == null) {
                    res.status(404).send({ message: `Nincs jelenleg óra!` });
                }
                res.status(404).send({ message: `Felhasználó a(z) ${id} azonosítóval nem található vagy folyatban van egy óra!` });
            }

        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private settings = async (req: Request, res: Response) => {
        try {
            const id = await getIDfromToken(req);
            const updatedDoc = await this.user.findById(id);
            const body = updatedDoc;
            if (body) {
                body.settings = req.body.settings;
                const modificationResult = await this.user.replaceOne({ _id: id }, body, { runValidators: true });
                if (modificationResult.modifiedCount) {
                    res.send({ message: `OK` });
                } else {
                    res.status(400).send({ message: `Nem történt módosítás!` });
                }
            } else {
                res.status(404).send({ message: `Felhasználó a(z) ${id} azonosítóval nem található!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };
}
