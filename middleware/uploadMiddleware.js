const multer = require("multer")

// Almacenamiento en disco
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const pathStorage = __dirname + "/../storage"
        callback(null, pathStorage) // carpeta donde se va a guardar todo
    },
    filename: function(req, file, callback) {
        const ext = file.originalname.split(".").pop()
        const filename = "file-" + Date.now() + "." + ext
        callback(null, filename)
    }
})

// Función para filtrar el tipo de archivo y el tamaño
const fileFilter = (req, file, callback) => {
    if(file.mimetype.startsWith("image/")) {
        callback(null, true)
    } else {
        callback(new Error("Formato no válido. Solo imágenes."), false)
    }
}

// Almacenamiento en memoria (para IPFS)
const memory = multer.memoryStorage();

// Middleware para almacenamiento en disco
const uploadMiddleware = multer({storage, fileFilter, limits: {fileSize: 5000000}})

// Middleware para almacenamiento en memoria
const uploadMiddlewareMemory = multer({storage: memory, fileFilter, limits: {fileSize: 5000000}})

module.exports = {uploadMiddleware, uploadMiddlewareMemory}