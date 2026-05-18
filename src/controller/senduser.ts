import { query } from '../postgres';
import redis from '../redisconect';

const sendUser = async (shortcode: string) => {
    try {
        const cached = await redis.get(`url:${shortcode}`)
        if (cached) return cached

        const result = await query(
            `SELECT long_url 
             FROM links
             WHERE shortcode = $1
            `, [shortcode]
        );

        const long_url = result.rows[0].long_url;

        await redis.set(`url:${shortcode}`, long_url, {EX:3600})

        return long_url;
    } catch (err) {
        throw { code: 422, message: "erro ao verificar no banco!", err };
    }
}

export default sendUser;