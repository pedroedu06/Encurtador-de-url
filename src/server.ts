import express from "express";
import encurtaURL from "./controller/urlcreated";
import shortIdCreated from "./controller/urlshortener";
import sendUser from "./controller/senduser";
import redis from "./redisconect";

const app = express();
app.use(express.json());

//register the user url in database after that do the process for encrypted de url

app.post('/sendurl', async (req, res) => {
    try {
        const urlid = await encurtaURL(req.body.url);
        const resultfinal = await shortIdCreated(urlid);
        console.log(resultfinal);
        res.json({ message: "ok" })
    } catch (err: any) {
        console.error(err)
        res.status(err?.code || 500).json({ error: err?.message || "internal error" })
    }
})

//redirect user for url 

app.get('/senduser/:shortcode', async (req, res) => {
    try {
        const { shortcode } = req.params;

        const cached = await redis.get(shortcode);
        if (cached) {
            return res.redirect(302, cached);
        }

        const long_url = await sendUser(shortcode);
        if (!long_url) {
            throw { code: 400, message: "falha ao buscar no banco" };
        }

        await redis.set(shortcode, long_url, {EX: 3600});

        res.redirect(302, long_url);
    } catch (err: any) {
        console.error(err)
        res.status(err?.code || 500).json({error: err?.message || "internal error"});
    }
})

app.listen(3000, () => {
    console.log("servidor conectado na porta 3000!");
})