import { query } from '../postgres';

const sendUser = async (shortcode: string) => {
    try {
        const result = await query(
            `SELECT long_url 
             FROM links
             WHERE shortcode = $1
            `, [shortcode]
        );

        const long_url = result.rows[0].long_url;
        return long_url;
    } catch (err) {
        throw { code: 422, message: "erro ao verificar no banco!", err };
    }
}

export default sendUser;