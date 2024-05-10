import { Request, Response, Router } from "express";
import Controller from "../interfaces/controller_interface";
import { getIDfromToken, hasPermission, isLoggedIn } from "../middleware/middleware";
import { JobService } from "../services/job.service";
import { Roles } from "../auth/auth.roles";
import jobModel from "../models/job.model";

export default class JobController implements Controller {
    public router = Router();
    public jobs = jobModel.jobModel;

    constructor() {
        this.router.get("/jobs", hasPermission([Roles.JobView]), (req, res, next) => {
            this.getJobs(req, res).catch(next);
        });
        this.router.get("/job", hasPermission([Roles.JobView]), (req, res, next) => {
            this.getJobsWithPag(req, res).catch(next);
        });
        this.router.get("/job/:id", hasPermission([Roles.JobView]), (req, res, next) => {
            this.getOneJob(req, res).catch(next);
        });

        this.router.post("/job", hasPermission([Roles.JobAdd]), (req, res, next) => {
            this.createJob(req, res).catch(next);
        });

        this.router.put("/job/:id", hasPermission([Roles.JobEdit]), (req, res, next) => {
            this.updateJob(req, res).catch(next);
        });

        this.router.delete("/job/:id", hasPermission([Roles.JobDelete]), (req, res, next) => {
            this.deleteJob(req, res).catch(next);
        });

    }

    private getJobs = async (req: Request, res: Response) => {
        try {
            let data: any[] = [];
            data = await this.jobs.find();

            if (data.length > 0) {
                res.send(data);
            } else {
                res.status(404).send({ message: `Jobs not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private getJobsWithPag = async (req: Request, res: Response) => {
        try {
            let data: any[] = [];
            const { filter, limit, offset } = JobService.parseQueryParameters(req.query);
            data = await this.jobs.find(filter).limit(limit).skip(offset);

            if (data.length > 0) {
                res.send(data);
            } else {
                res.status(404).send({ message: `Jobs not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private getOneJob = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const data = await this.jobs.findOne({ _id: id });

            if (data) {
                res.send(data);
            } else {
                res.status(404).send({ message: `Job not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private createJob = async (req: Request, res: Response) => {
        try {
            const body = req.body;
            const { error } = jobModel.validate(body);
            if (error) {
                res.status(400).send({ message: error.details[0].message });
                return;
            }
            body["company_id"] = await getIDfromToken(req);
            const newJob = new this.jobs(body);
            await newJob.save();
            res.send(newJob);
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private updateJob = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const body = req.body;
            const { error } = jobModel.validate(body);
            if (error) {
                res.status(400).send({ message: error.details[0].message });
                return;
            }

            const data = await this.jobs.findOne({ _id: id });

            if (data) {
                const id = await getIDfromToken(req);
                if (id !== data.company_id) {
                    res.status(403).json({ error: "Access denied" });
                    return;
                }
                await this.jobs.updateOne({ _id: id }, body);
                res.send({ message: "Job updated successfully" });
            } else {
                res.status(404).send({ message: `Job not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };

    private deleteJob = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const data = await this.jobs.findOne({ _id: id });
            if (data) {
                const id = await getIDfromToken(req);
                if (id !== data.company_id) {
                    res.status(403).json({ error: "Access denied" });
                    return;
                }
                await this.jobs.updateOne({ _id: id }, { isDeleted: true });
                res.send({ message: "Job deleted successfully" });
            } else {
                res.status(404).send({ message: `Job not found!` });
            }
        } catch (error: any) {
            res.status(400).send({ message: error.message });
        }
    };
}
