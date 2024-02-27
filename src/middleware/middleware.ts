import jwt from "jsonwebtoken";

const { ACCESS_TOKEN_SECRET = "secret" } = process.env;


async function isLoggedIn(req: any, res: any, next: any, auth?: Array<string>) {
    try {
        // check if auth header exists
        if (req.headers.authorization) {
            // parse token from header
            const token = req.headers.authorization.split(" ")[1]; //split the header and get the token
            if (token) {
                const payload: any = await jwt.verify(token, ACCESS_TOKEN_SECRET);
                if (payload) {
                    // store user data in request object
                    req.user = payload;
                    if (auth && payload.auth.some((r: string) => auth.includes(r))){
                        next();
                    } else {
                        res.status(403).json({ error: "Access denied" });
                    }
                } else {
                    res.status(400).json({ error: "token verification failed" });
                }
            } else {
                res.status(400).json({ error: "malformed auth header" });
            }
        } else {
            res.status(400).json({ error: "No authorization header" });
        }
    } catch (error) {
        res.status(400).json({ error });
    }
}

function hasPermission(auth: Array<string>) {
    return function (req: any, res: any, next: any) {
        isLoggedIn(req, res, next, auth);
    }
}


async function getIDfromToken(req: any) {
    if (req.headers.authorization) {
        // parse token from header
        const token = req.headers.authorization.split(" ")[1]; //split the header and get the token
        if (token) {
            const payload: any = jwt.verify(token, ACCESS_TOKEN_SECRET);
            if (payload) {
                // store user data in request object
                return payload.id;
            }
        }
    }
    return null;
}

export { isLoggedIn, hasPermission, getIDfromToken };