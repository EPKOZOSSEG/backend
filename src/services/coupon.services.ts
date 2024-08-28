import couponModel from "../models/coupon.model";

export class CouponService {
    static parseQueryParameters(query: any) {
        const title = query.title as string;
        const percent = query.percent as string;
        const type = query.type as string;

        const limit = parseInt(query.limit as string);
        const offset = parseInt(query.offset as string);

        const filter: any = {};
        if (title) filter.title = new RegExp(".*" + title + ".*");
        if (percent) filter.percent = percent;
        if (type) filter.type = type;


        return { filter, limit, offset };
    }


    public async insertCoupons(id: string, number: number, data: any[]) {
        const coupons = couponModel.couponModel;

        if(number < 10){
            if(Math.random() > 0.5){ return data; }
        }else{
            if(Math.random() > 0.2){ return data; }
        }
        number = Math.floor(number / 10) + 1;

        const res = await coupons.aggregate([{ $match: { "collectedBy": { $nin: [id] } } }, { $sample: { size: number } }]);

        if (res.length === 0) {
            return data;
        } else {
            const pos = this.getRandomPosition(data.length, res.length);
            let result = [...data];

            pos.sort((a, b) => a - b);
            res.forEach((coupon, index) => {
                result.splice(pos[index], 0, coupon);
            });

            return result;
        }
    }

    private getRandomPosition(size: number, number: number) {
        let positions: number[] = [];
        for (let i = 0; i < number; i++) {
            let position = Math.floor(Math.random() * size);
            if (positions.includes(position)) {
                i--;
            } else {
                positions.push(position);
            }
        }
        return positions;
    }
}