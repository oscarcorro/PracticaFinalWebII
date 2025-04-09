const express = require("express") //framework para crear el servidor
const fs = require("fs") //módulo de node.js para manejar archivos
const router = express.Router() //creamos un router
const removeExtension = (fileName) => { //extraemos la palabra de la ruta donde estemos, por ejemplo users.js devuelve users
    //solo la primera parte del split, lo de antes del punto
    return fileName.split('.').shift()
}
fs.readdirSync(__dirname).filter((file) => { //lee todos los archivos de este directorio
    const name = removeExtension(file) //extrae index, users, tracks, storage
    if(name != 'index'){
        router.use('/' + name, require('./'+name)) //http://localhost:3000/api/tracks
    }
})
module.exports = router //exportamos el router para que pueda ser importado en app.js