//archivo para conectar nuestra aplicación con la BD de MongoDB
const mongoose = require('mongoose') //importamos la librería que permite comunicar con mongoDB

const dbConnect = () => { //función para conectarnos a la BD
    const db_uri = process.env.NODE_ENV === 'test' ? process.env.DB_URI:
    process.env.DB_URI_TEST //obtenemos la URI de la BD, que tenemos en el .env
    mongoose.set('strictQuery', false) //desactivamos strictQuery para realizar consultas sin definir explicitamente los campos
    try { //intentamos conectar a mongoDB
        mongoose.connect(db_uri)
    } catch(error) {
        console.err("Error conectando a la BD: ", error)
    }
    //Listen events
    mongoose.connection.on("connected", () => console.log("Conectado a la BD")) //se ejecuta cuando la conexión ha tenido éxito
}

module.exports = dbConnect //exportamos la función dbConnect para que pueda ser guardada por otros archivos