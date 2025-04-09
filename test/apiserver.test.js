const supertest = require('supertest') //importar supertest para simular peticiones HTTP
const {app, server} = require('../index.js') //importar app
const api = supertest(app) //nueva instancia de supertest sobre nuestra app
const {encrypt} = require('../utils/handlePassword.js') //encriptar contraseña
const {tokenSign} = require('../utils/handleJwt') //firmar tokens
const usersModel = require("../models/nosql/user.js")
const mongoose = require("mongoose") //importar para conexión a la BD
const initialUsers = [ //datos iniciales para el test
    {name: "Marcos",
        age: 23,
        email: "marcos@correo.es",
        password: "mipassword"
    }
]
let token 
//ejecutamos una vez antes de todos los test
beforeAll(async () => {
    await new Promise((resolve) => mongoose.connection.once('connected', resolve)); //esperar la conexión con BD
    await usersModel.deleteMany({}) //borar todos los usuarios
    //encriptar la contraseña y copiar el usuario con esta
    const password = await encrypt(initialUsers[0].password)
    const body = initialUsers[0]
    body.password = password
    const userData = await usersModel.create(body)
    userData.set("password", undefined, {strict: false}) //borramos la password de la memoria (no de la BD)
    token = await tokenSign(userData, process.env.JWT_SECRET)
})
//test para comprobar que podemos obtener los usuarios
it('should get all users', async () => {
    const response = await api.get('/api/users')
    .auth(token, { type: 'bearer' })
    .expect(200)
    .expect('Content-Type', /application\/json/)
    expect(response.body.length).toBe(1)
})
//cerrar el servidor
afterAll(async()=> {
    server.close()
    await mongoose.connection.close();
})