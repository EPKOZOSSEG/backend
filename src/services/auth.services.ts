export class AuthServices {
    static parseQueryParameters(query: any) {
        const groupName = query.groupName as string;

        const limit = parseInt(query.limit as string);
        const offset = parseInt(query.offset as string);

        const filter: any = {};
        if (groupName) filter.groupName = new RegExp(".*" + groupName + ".*");


        return { filter, limit, offset };
    }
}