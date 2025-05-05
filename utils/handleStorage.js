const multer = require('multer');

//almacenar archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const pathStorage = `${__dirname}/../storage`;
        cb(null, pathStorage);
    },
    filename: (req, file, cb) => {
        const ext = file.originalname.split('.').pop();
        const filename = `file-${Date.now()}.${ext}`;
        cb(null, filename);
    }
});

//almacenamiento en disco
const uploadMiddleware = multer({ storage });

//almacenamiento en memoria (para IPFS)
const memory = multer.memoryStorage();
const uploadMiddlewareMemory = multer({ storage: memory });

module.exports = { uploadMiddleware, uploadMiddlewareMemory };