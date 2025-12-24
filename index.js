import { createReadStream } from "fs";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import bodyParser from "body-parser";
import appSrc from "./app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const appJsPath = join(__dirname, "app.js");

const app = appSrc(express, bodyParser, createReadStream, appJsPath);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});