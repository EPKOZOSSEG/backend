export class JobService {
    static parseQueryParameters(query: any) {
        const name = query.name as string;
        const price = query.price as string;
        const currency = query.currency as string;
        const payment = query.payment as string;
        const location = query.location as string;

        const limit = parseInt(query.limit as string);
        const offset = parseInt(query.offset as string);

        const filter: any = {};
        if (name) filter.name = new RegExp(".*" + name + ".*");
        if (price) filter.price = price;
        if (currency) filter.currency = currency;
        if (payment) filter.payment = payment;
        if (location) filter.location = location;


        return { filter, limit, offset };
    }
}