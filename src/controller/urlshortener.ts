import base62 from "base62";
import { query } from "../postgres.js";


const encurtaURL = (url: string) => {
    try {
        new URL(url);
    } catch {
        throw { code: 404, message: "error ao achar a url. "}
    }

    const shortcode = nanoid(6);

}

export default encurtaURL;