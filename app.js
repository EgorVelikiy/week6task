import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEXT_PLAIN_HEADER = { "Content-Type": "text/plain; charset=utf-8", };

const SYSTEM_LOGIN = "20cf5726-c4a6-4653-b049-6e72b934e3d4";

function readFileAsync(filePath, createReadStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        const stream = createReadStream(filePath);
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        stream.on("error", (err) => reject(err));
    });
}

function generateSha1Hash(text, crypto) {
    return crypto.createHash("sha1").update(text).digest("hex");
}

export default function (express, bodyParser, createReadStream, crypto, http) {
    const app = express();
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.use((req, res, next) => {
        res.set({
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS,POST,PUT,PATCH,DELETE",
            "Access-Control-Allow-Headers": "*",
        });
        if (req.method === "OPTIONS") {
            res.sendStatus(204); return;
        }
        next();
    })

    app.get("/", (_req, res) => {
        res.send(SYSTEM_LOGIN);
    });

    app.use((req, res, next) => {
        if (!req.originalUrl.endsWith("/")) {
            res.redirect(307, req.originalUrl + "/");
            return;
        }
        next();
    });

    app.get("/login/", (_req, res) => {
        res.set(TEXT_PLAIN_HEADER).send(SYSTEM_LOGIN);
    });

    app.get("/code/", async (_req, res) => {
        const appJsPath = path.join(__dirname, "app.js");
        const fileContent = await readFileAsync(appJsPath, createReadStream);
        res.set(TEXT_PLAIN_HEADER).send(fileContent);
    });

    app.get("/sha1/:input/", (req, res) => {
        const hash = generateSha1Hash(req.params.input, crypto)
        res.set(TEXT_PLAIN_HEADER).send(hash);
    });

    app.all("/req/", (req, res) => {
        const addr = req.method === "POST" ? req.body.addr : req.query.addr;
        http.get(addr, response => {
            let data = "";
            response.on("data", chunk => {
                data += chunk;
            });
            response.on("end", () => {
                res.set(TEXT_PLAIN_HEADER).send(data);
            });
        });
    });

    app.all(/.*/, (req, res) => {
        res.set(TEXT_PLAIN_HEADER).send(SYSTEM_LOGIN);
    });

    return app;
}