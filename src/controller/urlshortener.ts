import { query } from "../postgres.js";
import Sqids from "sqids";


const shortIdCreated = (id: number) => {
    const sqids = new Sqids({
        alphabet: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        minLength: 6
    })

    const shortcode = sqids.encode([id]);
    console.log('aqui o shortcode da url', shortcode);
    
    async function inserttable(shortcode:string, id: number) {
        try {
            const result = await query(
                `UPDATE links
                 SET shortcode = $1
                 WHERE id = $2 
                `,
                [shortcode, id]
            )
            console.log('tabela atualizada com sucesso!') 
        } catch (err) {
            throw {code: 503, message: "erro ao atualizar a tabela"}
        }
    }

    inserttable(shortcode, id)

    const link = `http://localhost:3000/senduser/${shortcode}`;
    
    return link;
}

export default shortIdCreated;