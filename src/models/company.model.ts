
import { Schema, model } from "mongoose";
import Joi from "joi";

const companyShema = new Schema(
    {
        _id: {
            type: Schema.Types.ObjectId,
            readonly: true
        },
        companyName: {
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