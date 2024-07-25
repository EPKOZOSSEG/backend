
import { Schema, model } from "mongoose";
import Joi from "joi";

const companyShema = new Schema(
    {
        _id: {
            type: Schema.Types.ObjectId,
            readonly: true
        },
        registeredName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        auth: {
            type: Array<string>(),
            default: []
        },
        phone: {
            type: String,
            nullable: true
        },
        location: {
            type: {street: String, city: String, county: String, zip: String, country: String},
            required: true
        },
        companyData: {
            type: {name: String, regNumber: String, taxNumber: String, empNumber: Number, description: String, webSite: String, logo: String},
            required: true
        },
        isSubscribed: {
            type: Boolean,
            default: false
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    { versionKey: false },
);

const validate = (message: object): Joi.ValidationResult => {
    const schema = Joi.object().keys({
        companyName: Joi.string().required(),
        email: Joi.string().required(),
        password: Joi.string().required(),
        phone: Joi.string().optional()
    });
    return schema.validate(message);
};


const companyModel = model("company", companyShema, "Company");


export default {companyModel, validate};