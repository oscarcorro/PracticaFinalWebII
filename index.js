//Servidor básico utilizando express y cors
const express = require('express') //framework que facilita la creación de servidores
const cors = require('cors') //middleware que permite solicitudes externas
require('dotenv').config()

const dbConnect = require("./config/mongo") //importamos la función que conecta con la BD

const swaggerUi = require("swagger-ui-express")
const swaggerSpecs = require("./docs/swagger")

const app = express() //instancia de express
app.use(cors()) //usa cors para permitir solicitudes externas
app.use(express.json()) //parsear JSON en las solicitudes

const usersRouter = require('./routes/users')
app.use('/api/users', usersRouter)
const authRouter = require('./routes/auth')
app.use('/api/auth', authRouter);
const mailRouter = require('./routes/email')
app.use('/api/email', mailRouter)
const clientRouter = require('./routes/client')
app.use('/api/client', clientRouter)

dbConnect() //conexión a la BD

app.use("/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpecs)
)

const PORT = process.env.PORT || 3000

const server = app.listen(PORT, () => {
    console.log(`Escuchando en el puerto ${PORT}`)
})

module.exports = {app, server}