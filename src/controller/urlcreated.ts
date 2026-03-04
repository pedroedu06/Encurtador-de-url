import { query } from "../postgres.js";


const encurtaURL = async (url: string) => {
    try {
        new URL(url);
    } catch {
        throw { code: 404, message: "error ao achar a url. " }
    }

    async function insertlink(url: string) {
        try {
            const result = await query(
                `INSERT INTO links (long_url)
                 VALUES ($1)
                 RETURNING id;                 
                `, [url]
            );

            const id = result.rows[0].id;
            console.log("link inserido com sucesso")
            return id;          
        } catch {
            throw {code: 503, message: "Erro ao inserir no banco de dados!"}
        }
    };
    
    return await insertlink(url);
}

export default encurtaURL;