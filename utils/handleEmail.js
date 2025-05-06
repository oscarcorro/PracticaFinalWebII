//require("dotenv").config();
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {

  const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
  
  oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
  });


  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        console.error("Error detallado al obtener token:", err);
        reject("Failed to create access token.");
      }
      console.log("Token de acceso obtenido correctamente");
      resolve(token);
    });
  });
  console.log("Creando transporter con nodemailer...");

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
  });
  console.log("Transporter creado con éxito");

  return transporter;
};

const sendEmail = async (emailOptions) => {
  try {
    console.log("Intentando enviar email a:", emailOptions.to);
    let emailTransporter = await createTransporter();
    await emailTransporter.sendMail(emailOptions);
  } catch (e) {
    console.error("Error en sendEmail:", e);
    throw(e)
  }
};

module.exports = { sendEmail }; 