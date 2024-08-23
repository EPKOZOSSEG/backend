
import { Schema, model } from "mongoose";
import Joi from "joi";

const companyShema = new Schema(
    {
        _id: {
            type: Schema.Types.ObjectId,
            readonly: true
        },
        name: {
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
            type: {companyName: String, regNumber: String, taxNumber: String, empNumber: Number, description: String, webSite: String, logo: String},
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
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        phone: Joi.string().allow(null),
        location: Joi.object().keys({
            street: Joi.string().required(),
            city: Joi.string().required(),
            county: Joi.string().required(),
            zip: Joi.string().required(),
            country: Joi.string().required()
        }).required(),
        companyData: Joi.object().keys({
            companyName: Joi.string().required(),
            regNumber: Joi.string().required(),
            taxNumber: Joi.string().required(),
            empNumber: Joi.number().required(),
            description: Joi.string().required(),
            webSite: Joi.string().required(),
        }).required(),
        isSubscribed: Joi.boolean().default(false),
        isDeleted: Joi.boolean().default(false)
    });
    return schema.validate(message);
};


const companyModel = model("company", companyShema, "Company");


export default {companyModel, validate};