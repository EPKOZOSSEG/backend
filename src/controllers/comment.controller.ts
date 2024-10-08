import { Request, Response, Router } from "express";
import Controller from "../interfaces/controller_interface";
import { getIDfromToken, hasPermission, isLoggedIn } from "../middleware/middleware";
import { CommentService } from "../services/comment.services";
import { Roles } from "../auth/auth.roles";
import commentModel from "../models/comment.model";
import mongoose from "mongoose";

export default class CommentController implements Controller {
    public router = Router();
    public comments = commentModel.commentModel;

    constructor() {
        this.router.get("/comments", hasPermission([Roles.CommentView]), (req, res, next) => {
            this.getComments(req, res).catch(next);
        });
        this.router.get("/comment", hasPermission([Roles.CommentView]), (req, res, next) => {
            this.getCommentsWithPag(req, res).catch(next);
        });
        this.router.get("/comment/:id", hasPermission([Roles.CommentView]), (req, res, next) => {
            this.getOneComment(req, res).catch(next);
        });

        this.router.post("/comment", hasPermission([Roles.CommentAdd]), (req, res, next) => {
            this.createComment(req, res).catch(next);
        });

        this.router.post("/comment/likes/:id/:type", hasPermission([Roles.CommentView]), (req, res, next) => {
            this.createCommentLike(req, res).catch(next);
        });

        // this.router.put("/comment/:id", hasPermission([Roles.CommentEdit]), (req, res, next) => {
        //     this.updateComment(req, res).catch(next);
        // });

        this.router.delete("/comment/:id", hasPermission([Roles.CommentDelete]), (req, res, next) => {
            this.deleteComment(req, res).catch(next);
        });

    }

    private getComments = async (req: Request, res: Response) => {
        try {
            let data: any[] = [];
            data = await this.comments.find();

            if (data.length > 0) {
                res.send(data);
            } else {
                res.status(404).send({ message: `Comments not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private getCommentsWithPag = async (req: Request, res: Response) => {
        try {
            let data: any[] = [];
            const { filter, limit, offset } = CommentService.parseQueryParameters(req.query);
            data = await this.comments.find(filter).limit(limit).skip(offset);

            if (data.length > 0) {
                res.send(data);
            } else {
                res.status(404).send({ message: `Comments not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private getOneComment = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const data = await this.comments.findOne({ _id: id });

            if (data) {
                res.send(data);
            } else {
                res.status(404).send({ message: `Comment not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private createComment = async (req: Request, res: Response) => {
        try {
            const body = req.body;
            const { error } = commentModel.validate(body);
            if (error) {
                res.status(400).send({ message: error.details[0].message });
                return;
            }
            body["_id"] = new mongoose.Types.ObjectId();
            body["isDeleted"] = false;
            const newComment = new this.comments(body);

            const data = await this.comments.findOne({ _id: body.refernce_id });
            if(data){
                await this.comments.updateOne({ _id: body.refernce_id }, { $inc: { replys: data.replys+1 } });
            }
            await newComment.save();
            res.send(newComment);
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private createCommentLike = async (req: Request, res: Response) => {
        try {
            const { id, type } = req.params;
            const data = await this.comments.findOne({ _id: id });
            if (data) {
                switch(type){
                    case "like":
                        await this.comments.updateOne({ _id: id }, { $inc: { like: data.like+1 } });
                        break;
                    case "dislike":
                        await this.comments.updateOne({ _id: id }, { $inc: { dislike: data.dislike+1 } });
                        break;
                    case "unlike":
                        await this.comments.updateOne({ _id: id }, { $inc: { like: data.like-1 } });
                        break;
                    case "undislike":
                        await this.comments.updateOne({ _id: id }, { $inc: { dislike: data.dislike-1 } });
                        break;
                }
                res.send({ message: "Comment liked successfully" });
            } else {
                res.status(404).send({ message: `Comment not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    }

    private deleteComment = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const data = await this.comments.findOne({ _id: id });
            if (data) {
                // await this.comments.updateOne({ _id: id }, { isDeleted: true });
                await this.comments.deleteOne({ _id: id });
                res.send({ message: "Comment deleted successfully" });
            } else {
                res.status(404).send({ message: `Comment not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };
}
