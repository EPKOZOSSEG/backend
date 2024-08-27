import companyModel from "../models/company.model";

export class AuthServices {
    static parseQueryParameters(query: any) {
        const groupName = query.groupName as string;

        const limit = parseInt(query.limit as string);
        const offset = parseInt(query.offset as string);

        const filter: any = {};
        if (groupName) filter.groupName = new RegExp(".*" + groupName + ".*");


        return { filter, limit, offset };
    }

    public getCompanyIdByName = async (companyName: string) => {
        if(!companyName) return {};
        const c = companyModel.companyModel;
        const company = await c.find({ "companyData.companyName": companyName });
        if(company.length == 0) return {"company_id": "null"};
        return { "company_id": company[0]._id };
    }
}