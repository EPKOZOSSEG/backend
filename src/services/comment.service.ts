export class CommentService {
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
}