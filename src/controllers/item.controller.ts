import { Request, Response, Router } from "express";
import Controller from "../interfaces/controller_interface";
import { getIDfromToken, hasPermission, isLoggedIn } from "../middleware/middleware";
import { ItemService } from "../services/item.service";
import { Roles } from "../auth/auth.roles";
import itemModel from "../models/item.model";

export default class ItemController implements Controller {
    public router = Router();
    public items = itemModel.itemModel;

    constructor() {
        this.router.get("/items", hasPermission([Roles.ItemView]), (req, res, next) => {
            this.getItems(req, res).catch(next);
        });
        this.router.get("/item", hasPermission([Roles.ItemView]), (req, res, next) => {
            this.getItemsWithPag(req, res).catch(next);
        });
        this.router.get("/item/:id", hasPermission([Roles.ItemView]), (req, res, next) => {
            this.getOneItem(req, res).catch(next);
        });

        this.router.post("/item", hasPermission([Roles.ItemAdd]), (req, res, next) => {
            this.createItem(req, res).catch(next);
        });

        this.router.put("/item/:id", hasPermission([Roles.ItemEdit]), (req, res, next) => {
            this.updateItem(req, res).catch(next);
        });

        this.router.delete("/item/:id", hasPermission([Roles.ItemDelete]), (req, res, next) => {
            this.deleteItem(req, res).catch(next);
        });

    }

    private getItems = async (req: Request, res: Response) => {
        try {
            let data: any[] = [];
            data = await this.items.find();

            if (data.length > 0) {
                res.send(data);
            } else {
                res.status(404).send({ message: `Items not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private getItemsWithPag = async (req: Request, res: Response) => {
        try {
            let data: any[] = [];
            const { filter, limit, offset } = ItemService.parseQueryParameters(req.query);
            data = await this.items.find(filter).limit(limit).skip(offset);

            if (data.length > 0) {
                res.send(data);
            } else {
                res.status(404).send({ message: `Items not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private getOneItem = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const data = await this.items.findOne({ _id: id });

            if (data) {
                res.send(data);
            } else {
                res.status(404).send({ message: `Item not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private createItem = async (req: Request, res: Response) => {
        try {
            const body = req.body;
            const { error } = itemModel.validate(body);
            if (error) {
                res.status(400).send({ message: error.details[0].message });
                return;
            }
            body["company_id"] = await getIDfromToken(req);
            const newItem = new this.items(body);
            await newItem.save();
            res.send(newItem);
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private updateItem = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const body = req.body;
            const { error } = itemModel.validate(body);
            if (error) {
                res.status(400).send({ message: error.details[0].message });
                return;
            }

            const data = await this.items.findOne({ _id: id });

            if (data) {
                const id = await getIDfromToken(req);
                if (id !== data.company_id) {
                    res.status(403).json({ error: "Access denied" });
                    return;
                }
                await this.items.updateOne({ _id: id }, body);
                res.send({ message: "Item updated successfully" });
            } else {
                res.status(404).send({ message: `Item not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private deleteItem = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const data = await this.items.findOne({ _id: id });
            if (data) {
                const id = await getIDfromToken(req);
                if (id !== data.company_id) {
                    res.status(403).json({ error: "Access denied" });
                    return;
                }
                await this.items.updateOne({ _id: id }, { isDeleted: true });
                res.send({ message: "Item deleted successfully" });
            } else {
                res.status(404).send({ message: `Item not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };
}
