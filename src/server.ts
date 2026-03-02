import express from 'express';

const app = express();
app.use(express.json());


app.post('/sendurl', (req, res) => {
    console.log(req.body);
    res.json({message: "ok"})
})

app.listen(3000, () => {
    console.log("servidor conectado na porta 3000!");
})