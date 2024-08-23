import { Request, Response, Router } from "express";
import { isLoggedIn } from "../middleware/middleware";
import "dotenv/config";
import Stripe from 'stripe';

const { STRIPE_SECRET_KEY } = process.env;

export default class PaymentController {
    public router = Router();

    private stripe = new Stripe("sk_test_51PmvBZP65fH4yRpLbUkQ80KIrksYlA5bdfzNx3PKCDHtySJbjRuZPen5yt62aPF6GMVYLRkJ9ympLBkTtD5pJtbu00PgbfBhDR", {
        apiVersion: '2024-06-20',
    });

    constructor() {

        this.router.post("/payment", isLoggedIn, (req, res, next) => {
            this.payment(req, res).catch(next);
        });
        this.router.get('/secret', async (req, res) => {
            const intent = await this.createPaymentIntent();
            res.json({ client_secret: intent.client_secret });
        });

    }


    private async payment(req: Request, res: Response) {
        try {
            const { amount } = req.body as { amount: number };

            await this.stripe.products.create(
                {
                    name: "Subscription",
                    description: "Monthly Subscription to our platform for 10.00€",
                }
            ).then(product => {
                this.stripe.prices.create({
                    unit_amount: amount,
                    currency: 'eur',
                    recurring: { interval: 'month' },
                    product: product.id
                }).then(price => {
                    res.status(200).send({ price: price.id, product: product.id, success: true });
                })
            });
        } catch (error: any) {
            res.status(500).send({ error: error.message });
        }
    }

    private async createPaymentIntent() {
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: 1099,
            currency: 'eur',
            automatic_payment_methods: {
                enabled: true,
            },
        });
        return paymentIntent;
    }
}
