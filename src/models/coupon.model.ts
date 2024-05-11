
import { Schema, model } from "mongoose";
import Joi from "joi";

const couponSchema = new Schema(
    {
        _id: {
            type: Schema.Types.ObjectId,
            readonly: true
        },
        company_id: {
            type: Schema.Types.ObjectId,
            readonly: true
        },
        title:{
            type: String,
            required: true
        },
        description:{
            type: String,
            required: true
        },
        percent:{
            type: Number,
            required: true
        },
        type: {
            type: String,
            required: true
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
        title: Joi.string().required(),
        description: Joi.string().required(),
        percent: Joi.number().required(),
        type: Joi.string().required()
    });
    return schema.validate(message);
};

const couponModel = model("coupon", couponSchema, "Coupon");


export default {couponModel, validate};