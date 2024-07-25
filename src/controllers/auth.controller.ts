import { Request, Response, Router } from "express";
import Controller from "../interfaces/controller_interface";
import userModel from "../models/user.model"
import companyModel from "../models/company.model"
import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getIDfromToken, hasPermission } from "../middleware/middleware";
import authModel from "../models/auth.model";
import { AuthServices } from "../services/auth.services";
import { Roles } from "../auth/auth.roles";
import { PictureServices } from "../services/picture.services";

const { ACCESS_TOKEN_SECRET = "secret" } = process.env;

export default class AuthController implements Controller {
    public router = Router();
    public user = userModel.userModel;
    public company = companyModel.companyModel;
    public auth = authModel.authModel;
    public pictureService = new PictureServices("company");
    public upload = this.pictureService.upload;
    public cpUpload = this.pictureService.cpUpload;
    public storage = this.pictureService.storage;

    constructor() {

        this.router.post("/login", (req, res, next) => {
            this.Login(req, res).catch(next);
        });

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
        });

        this.router.post("/logout", (req, res) => {
            res.send({ message: "OK" });
        });

        this.router.post("/auths/new", hasPermission([Roles.AuthAdd]), (req, res) => {
            this.newAuthGroup(req, res);
        });

        this.router.get("/auths", hasPermission([Roles.AuthView]), (req, res) => {
            this.getAuthGroups(req, res);
        });

        this.router.put("/auths/modify/:id", hasPermission([Roles.AuthEdit]), (req, res) => {
            this.modifyAuth(req, res);
        });

        this.router.delete("/auths/delete/:id", hasPermission([Roles.AuthDelete]), (req, res) => {
            this.deletingAuth(req, res);
        });

        this.router.post("/set-auth/:id", hasPermission([Roles.RoleSet]), (req, res) => {
            this.setAuth(req, res);
        });

        this.router.delete("/delete-auth/:id", hasPermission([Roles.RoleDelete]), (req, res) => {
            this.deleteAuth(req, res);
        });

        this.router.put("/user-modify/:id", hasPermission([Roles.UserEdit]), (req, res) => {
            this.modifyUser(req, res);
        });

        this.router.put("/company-modify/:id", hasPermission([Roles.UserEdit]), (req, res) => {
            this.modifyCompany(req, res);
        });


        this.router.get("/user/:id", hasPermission([Roles.UserView]), (req, res) => {
            this.getUserByID(req, res);
        });


        this.router.get("/company/:id", hasPermission([Roles.UserView]), (req, res) => {
            this.getCompanyByID(req, res);
        });



        // this.router.put("/password", hasPermission(["user"]), (req, res, next) => {
        //     this.password(req, res).catch(next);
        // });
    }

    private Login = async (req: Request, res: Response) => {
        const body = req.body;
        const user = await this.user.findOne({ email: body.email });
        const company = await this.company.findOne({ email: body.email });
        if (user) {
            this.loginUser(req, res);
        } else if (company) {
            this.loginCompany(req, res);
        } else {
            res.status(404).send({ message: "Wrong username or password!!" });
        }
    };

    private loginUser = async (req: Request, res: Response) => {
        const body = req.body;

        const user = await this.user.findOne({ email: body.email });
        if (user) {
            const result = await bcrypt.compare(body.password, user.password);
            if (result && !user.isDeleted) {
                const token = jwt.sign({ firstName: user.firstName, lastName: user.lastName, email: user.email, isSubscribed: user.isSubscribed, auth: user.auth }, ACCESS_TOKEN_SECRET);
                res.send({ token: token, type: 'user' });
            } else {
                res.status(401).send({ message: "Wrong password!" });
            }
        } else {
            res.status(404).send({ message: "Wrong username or password!!" });
        }
    };

    private loginCompany = async (req: Request, res: Response) => {
        const body = req.body;

        const company = await this.company.findOne({ email: body.email });
        if (company) {
            const result = await bcrypt.compare(body.password, company.password);
            if (result && !company.isDeleted) {
                const token = jwt.sign({ _id: company._id, companyName: company.companyData.name, email: company.email, isSubscribed: company.isSubscribed, auth: company.auth }, ACCESS_TOKEN_SECRET);
                res.send({ token: token, type: 'company' });
            } else {
                res.status(401).send({ message: "Wrong password!" });
            }
        } else {
            res.status(404).send({ message: "Wrong username or password!!" });
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
            res.status(409).send({ message: "Choose a different email address!" });
            return;
        }
        body.password = await bcrypt.hash(body.password, 10);
        body["_id"] = new mongoose.Types.ObjectId();
        body["isDeleted"] = false;

        const newUser = new this.user(body);
        await newUser.save();
        res.send({ message: "OK" });
    }

    private registerCompany = async (req: Request, res: Response) => {
        const body = req.body;
        const files: any = req.files;
        const fileNames = files.pictures.map((file: any) => file.filename);
        const { error } = companyModel.validate(body);
        if (error) {
            res.status(400).send({ message: error.details[0].message });
            return;
        }
        const company = await this.company.findOne({ email: body.email });
        if (company) {
            res.status(409).send({ message: "Choose a different email address!" });
            return;
        }
        body.password = await bcrypt.hash(body.password, 10);
        body["_id"] = new mongoose.Types.ObjectId();
        body["pictures"] = fileNames;
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
                res.status(401).send({ message: "Wrong password!" });
            }
        } else {
            res.status(404).send({ message: "Wrong username or password!!" });
        }
    };

    public getAllAuths = async (req: Request, res: Response) => {
        try {
            const data = await this.auth.find();
            if (data.length > 0) {
                return data;
            } else {
                return { message: `Auth groups not found!` };
            }
        } catch (error: any) {
            return { message: error.message };
        }
    };

    private newAuthGroup = async (req: Request, res: Response) => {
        const body = req.body;
        const { error } = authModel.validate(body);
        if (error) {
            res.status(400).send({ message: error.details[0].message });
            return;
        }

        body["_id"] = new mongoose.Types.ObjectId();
        const newAuth = new this.auth(body);
        await newAuth.save();
        res.send({ message: "OK" });
    };

    private getAuthGroups = async (req: Request, res: Response) => {
        try {
            let data: any[] = [];
            const { filter, limit, offset } = AuthServices.parseQueryParameters(req.query);
            data = await this.auth.find(filter).limit(limit).skip(offset);

            if (data.length > 0) {
                res.send(data);
            } else {
                res.status(404).send({ message: `Auth groups not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private setAuth = async (req: Request, res: Response) => {
        const body = req.body;
        const { id } = req.params;
        const user = await this.user.findOne({ _id: id });
        if (user) {
            user.auth = body.auths;
            await this.user.replaceOne({ _id: id }, user, { runValidators: true });
            res.send({ message: "OK" });
        }
        const company = await this.company.findOne({ _id: id });
        if (company) {
            company.auth = body.auths;
            await this.company.replaceOne({ _id: id }, company, { runValidators: true });
            res.send({ message: "OK" });
        }
        res.status(404).send({ message: "Auth group not added!" });
    };

    private deleteAuth = async (req: Request, res: Response) => {
        const body: any = req.body;
        const { id } = req.params;
        const user = await this.user.findOne({ _id: id });
        if (user) {
            const authArray: any[] = user.auth;
            user.auth = authArray.filter((auth: string) => !body.auth.includes(auth));
            await this.user.replaceOne({ _id: id }, user, { runValidators: true });
            res.send({ message: "OK" });
        }
        const company = await this.company.findOne({ _id: id });
        if (company) {
            const authArray: any[] = company.auth;
            company.auth = authArray.filter((auth: string) => !body.auth.includes(auth));
            await this.company.replaceOne({ _id: id }, company, { runValidators: true });
            res.send({ message: "OK" });
        }
        res.status(404).send({ message: "Auth group not added!" });
    };

    private modifyAuth = async (req: Request, res: Response) => {
        const body = req.body;
        const { id } = req.params;
        const auth = await this.auth.findOne({ _id: id });
        if (auth) {
            auth.auths = body.auths;
            await this.auth.replaceOne({ _id: id }, auth, { runValidators: true });
            res.send({ message: "OK" });
        }
        res.status(404).send({ message: "Auth group not found!" });
    };

    private deletingAuth = async (req: Request, res: Response) => {
        const { id } = req.params;
        const auth = await this.auth.findOne({ _id: id });
        if (auth) {
            await this.auth.deleteOne({ _id: id });
            res.send({ message: "OK" });
        } else {
            res.status(404).send({ message: "Auth group not found!" });
        }
    };


    private modifyUser = async (req: Request, res: Response) => {
        const body = req.body;
        const { id } = req.params;
        const user = await this.user.findOne({ _id: id });
        if (user) {
            const id = await getIDfromToken(req);
            if (id !== user._id) {
                res.status(403).json({ error: "Access denied" });
                return;
            }
            await this.user.replaceOne({ _id: id }, body, { runValidators: true });
            res.send({ message: "OK" });
        }
        res.status(404).send({ message: "Auth group not added!" });
    }

    private modifyCompany = async (req: Request, res: Response) => {
        const body = req.body;
        const { id } = req.params;
        const company = await this.company.findOne({ _id: id });
        if (company) {
            const id = await getIDfromToken(req);
            if (id !== company._id) {
                res.status(403).json({ error: "Access denied" });
                return;
            }
            await this.company.replaceOne({ _id: id }, body, { runValidators: true });
            res.send({ message: "OK" });
        }
        res.status(404).send({ message: "Auth group not added!" });
    }

    private getUserByID = async (req: Request, res: Response) => {
        const { id } = req.params;
        const user = await this.user.findOne({ _id: id });
        if (user) {
            user.password = "";
            res.send(user);
        } else {
            res.status(404).send({ message: "User not found!" });
        }
    }

    private getCompanyByID = async (req: Request, res: Response) => {
        const { id } = req.params;
        const company = await this.company.findOne({ _id: id });
        if (company) {
            company.password = "";
            const data = await this.pictureService.convertDataOne(company);
            res.send(data);
        } else {
            res.status(404).send({ message: "Company not found!" });
        }
    }
}
