
import { Schema, model } from "mongoose";
import Joi from "joi";

const itemSchema = new Schema(
    {
        _id: {
            type: Schema.Types.ObjectId,
            readonly: true
        },
        company_id: {
            type: Schema.Types.ObjectId,
            readonly: true
        },
        name:{
            type: String,
            required: true
        },
        description:{
            type: String,
            required: true
        },
        price:{
            type: Number,
            required: true
        },
        currency:{
            type: String,
            required: true
        },
        location: {
            type: String,
            required: true
        },
        pictures:{
            type: Array<string>(),
            default: []
        },
        created_at: {
            type: Date,
            default: Date.now,
            readonly: true
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
        description: Joi.string().required(),
        price: Joi.number().required(),
        currency: Joi.string().required(),
        location: Joi.string().required(),
        pictures: Joi.array().items(Joi.string()).optional()
    });
    return schema.validate(message);
};

const itemModel = model("item", itemSchema, "Item");


export default {itemModel, validate};