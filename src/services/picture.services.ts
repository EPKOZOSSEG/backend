import multer from "multer";
import path from "path";
import fs from "fs";

export class PictureServices {

    public caller: any = "";

    public upload = multer({ dest: ".pictures/" });
    public cpUpload = this.upload.fields([{ name: 'pictures', maxCount: 8 }])

    constructor(caller: string) {
        this.caller = caller;
    }

    public storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, `.pictures/${req.originalUrl.replace('/api/', '')}/`);
        },
        filename: function (req, file, cb) {
            const filename = req.body.name;
            cb(null, filename);
        }
    });

    public async convertData(data: any) {
        let datas = await Promise.all(data.map(async (item: any) => {
            const filePath = path.join(__dirname, '../../.pictures', item.pictures[0]);

            const img = await fs.promises.readFile(filePath);
            const base64Image = img.toString('base64');

            item.pictures = [base64Image];
            return item;
        }));
        return datas;
    }

    public async convertDataOne(data: any) {

        const base64Images = await Promise.all(data.pictures.map(async (file: string) => {
            const filePath = path.join(__dirname, '../../.pictures', file);

            // fs.promises.readFile használata promise-alapú fájl olvasásra
            const data = await fs.promises.readFile(filePath);
            const base64Image = data.toString('base64');
            return base64Image;
        }));

        data.pictures = base64Images;
        return data;
    }

}