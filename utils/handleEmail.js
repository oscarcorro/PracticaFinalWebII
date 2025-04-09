//require("dotenv").config();
const nodemailer = require("nodemailer"); //librería para envair correos
const { google } = require("googleapis"); //api de google para la autenticación
const OAuth2 = google.auth.OAuth2; //autenticación de google

const createTransporter = async () => {
    const oauth2Client = new OAuth2( //datos del cliente para la autenticación
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
    );
    oauth2Client.setCredentials({ //token de actualización
        refresh_token: process.env.REFRESH_TOKEN    
    });
    const accessToken = await new Promise((resolve, reject) => {
        oauth2Client.getAccessToken((err, token) => {
            if (err) {
                reject("Failed to create access token.");
            }
            resolve(token);
            }
        );
    });
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: process.env.EMAIL,
            accessToken,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN
        }
    })
    return transporter;
}

const sendEmail = async (emailOptions) => {
    try {
        let emailTransporter = await createTransporter();
        await emailTransporter.sendMail(emailOptions);
    } catch (e) {
        console.log(e)
    }
}
    
module.exports = { sendEmail }