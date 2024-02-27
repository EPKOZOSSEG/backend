import { Request, Response, Router } from "express";
import Controller from "../interfaces/controller_interface";
import userModel from "../models/user.model"
import companyModel from "../models/company.model"
import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { hasPermission, getIDfromToken } from "../middleware/middleware";

const { ACCESS_TOKEN_SECRET = "secret" } = process.env;

export default class AuthController implements Controller {
    public router = Router();
    public user = userModel.userModel;
    public company = companyModel.companyModel;

    constructor() {
        this.router.post("/login-user", (req, res, next) => {
            this.loginUser(req, res).catch(next);
        });
        this.router.post("/login-company", (req, res, next) => {
            this.loginCompany(req, res).catch(next);
        });

        this.router.post("/register-user", async (req, res) => {
            this.registerUser(req, res);
        });
        this.router.post("/register-company", async (req, res) => {
            this.registerCompany(req, res);
        })

        this.router.put("/password", hasPermission(["user"]), (req, res, next) => {
            this.password(req, res).catch(next);
        });
    }

    private loginUser = async (req: Request, res: Response) => {
        const body = req.body;
        
        const user = await this.user.findOne({ email: body.email });
        if (user) {
            const result = await bcrypt.compare(body.password, user.password);
            if (result && !user.isDeleted) {
                const token = jwt.sign({ id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, isSubscribed: user.isSubscribed, auth: user.auth }, ACCESS_TOKEN_SECRET);
                res.send({ token: token  });
            } else {
                res.status(401).send({ message: "Hibás jelszó!" });
            }
        } else {
            res.status(404).send({ message: "Hibás felhasználónév!" });
        }
    };

    private loginCompany = async (req: Request, res: Response) => {
        const body = req.body;
        
        const company = await this.company.findOne({ email: body.email });
        if (company) {
            const result = await bcrypt.compare(body.password, company.password);
            if (result && !company.isDeleted) {
                const token = jwt.sign({ id: company.id, companyName: company.companyName, email: company.email, isSubscribed: company.isSubscribed, auth: company.auth }, ACCESS_TOKEN_SECRET);
                res.send({ token: token  });
            } else {
                res.status(401).send({ message: "Hibás jelszó!" });
            }
        } else {
            res.status(404).send({ message: "Hibás felhasználónév!" });
        }
    };

    private registerUser = async (req: Request, res: Response) => {
        const body = req.body;
        const { error } = userModel.validate(body);
        if (error) {
            res.status(400).send({ message: error.details[0].message });
            return;
        }
        const user = await this.user.findOne({ email: body.email });
        if (user) {
            res.status(409).send({ message: "Ez az email cím már foglalt!" });
            return;
        }
        body.password = await bcrypt.hash(body.password, 10);
        const newUser = new this.user(body);
        await newUser.save();
        res.send({ message: "OK" });
    }

    private registerCompany = async (req: Request, res: Response) => {
        const body = req.body;
        const { error } = companyModel.validate(body);
        if (error) {
            res.status(400).send({ message: error.details[0].message });
            return;
        }
        const company = await this.company.findOne({ email: body.email });
        if (company) {
            res.status(409).send({ message: "Ez az email cím már foglalt!" });
            return;
        }
        body.password = await bcrypt.hash(body.password, 10);
        const newCompany = new this.company(body);
        await newCompany.save();
        res.send({ message: "OK" });
    }

    private password = async (req: Request, res: Response) => {
        const body = req.body;
        const id = await getIDfromToken(req);
        const user = await this.user.findOne({ _id: id });
        if (user) {
            const result = await bcrypt.compare(body.oldpassword, user.password);
            if (result && !user.isDeleted) {
                user.password = await bcrypt.hash(body.newpassword, 10);
                await this.user.replaceOne({ _id: id }, user, { runValidators: true });
                res.send({ message: "OK" });
            } else {
                res.status(401).send({ message: "Hibás jelszó!" });
            }
        } else {
            res.status(404).send({ message: "Hibás felhasználónév!" });
        }
    };



}
