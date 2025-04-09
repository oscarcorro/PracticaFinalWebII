const multer = require("multer")

//función para almacenar
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const pathStorage = __dirname+"/../storage"
        callback(null, pathStorage) //carpeta donde se va a guardar todo
    },
    filename: function(req, file, callback) {
        const ext = file.originalname.split(".").pop()
        const filename = "file-"+Date.now()+"."+ext
        callback(null, filename)
    }
})

//función para filtrar el tipo de archivo y el tamaño
const fileFilter = (req, file, callback) => {
    if(file.mimetype.startsWith("image/")) {
        callback(null, true)
    } else {
        callback(new Error("Formato no válido. Solo imágenes."), false)
    }
}

const uploadMiddleware = multer({storage, fileFilter, limits: 500})
module.exports = {uploadMiddleware}