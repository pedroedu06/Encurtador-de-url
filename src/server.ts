import express from "express";
import encurtaURL from "./controller/urlshortener.js";

const app = express();
app.use(express.json());


app.post('/sendurl', async (req, res) => {
    try {
        const urlid = await encurtaURL(req.body.url);
        console.log(urlid)
        res.json({ message: "ok" })
    } catch (err: any) {
        console.error(err)
        res.status(err?.code || 500).json({ error: err?.message || "internal error" })
    }
})

app.listen(3000, () => {
    console.log("servidor conectado na porta 3000!");
})