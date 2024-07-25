export class CommentService {
    static parseQueryParameters(query: any) {

        const reference_id = query.reference_id as string;
        const firstName = query.firstName as string;
        const lastName = query.lastName as string;
        const comment = query.comment as string;
        

        const limit = parseInt(query.limit as string);
        const offset = parseInt(query.offset as string);

        const filter: any = {};
        if (reference_id) filter.reference_id = reference_id;
        if (firstName) filter.firstName = firstName;
        if (lastName) filter.lastName = lastName;
        if (comment) filter.comment = new RegExp(".*" + comment + ".*");

        return { filter, limit, offset };
    }
}