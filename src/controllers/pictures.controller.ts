import { Request, Response, Router } from "express";
import { isLoggedIn } from "../middleware/middleware";
import path from "path";
import fs from 'fs';

export default class PictureController {
    public router = Router();

    constructor() {

        this.router.get("/picture/:pictureName", isLoggedIn, (req, res, next) => {
            this.getPicture(req, res).catch(next);
        });
    }

    private getPicture = async (req: Request, res: Response) => {
        try {
            let picName = req.params.pictureName;

            const filePath = path.join(__dirname, '../../.pictures', picName);

            const img = await fs.promises.readFile(filePath);
            const base64Image = img.toString('base64');

            if (base64Image) {
                res.send(base64Image);
            } else {
                res.status(404).send({ message: `Cargos not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };


}
