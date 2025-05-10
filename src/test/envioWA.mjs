import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';
import { env } from 'process';

const root = process.cwd();
const envPath = path.join(root, '../', '.env');
dotenv.config({ path: envPath });
   
// const agent = new https.Agent({  
//   rejectUnauthorized: false
// });

const url = process.env.URL_WHATSAPP;
const token = process.env.TOKEN_WHATSAPP;

const enviarWhatsappOk = async () => {
    try {
        let data = {
            numero: '5491162524514',
            mensaje: 'Build App Consulotorio Ok.',
            media: '',
            token: token
        };
        data = await fetch(`${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        const res = await data.json();
        return res;
    } catch (error) {
        console.error('Error:', error);
        return false
    }
}

enviarWhatsappOk();