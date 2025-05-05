const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const pinataApiKey = process.env.PINATA_KEY;
const pinataSecretApiKey = process.env.PINATA_SECRET;

const uploadToPinata = async (fileBuffer, fileName) => {
    // Primero, guardamos el buffer como un archivo temporal
    const tempFilePath = path.join(__dirname, `../temp-${Date.now()}-${fileName}`);
    fs.writeFileSync(tempFilePath, fileBuffer);
    
    try {
        const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
        let data = new FormData();
        
        // Usamos un stream del archivo, que funciona mejor con form-data
        const fileStream = fs.createReadStream(tempFilePath);
        data.append('file', fileStream, fileName);
        
        const metadata = JSON.stringify({
            name: fileName
        });
        data.append('pinataMetadata', metadata);
        
        const options = JSON.stringify({
            cidVersion: 0,
        });
        data.append('pinataOptions', options);
        
        const response = await fetch(url, {
            method: 'POST',
            body: data,
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey
            }
        });
        
        // Limpiamos el archivo temporal
        fs.unlinkSync(tempFilePath);
        
        if (!response.ok) {
            throw new Error(`Error al subir el archivo: ${response.statusText}`);
        }
        
        const responseData = await response.json();
        return responseData;
    } catch (error) {
        // Si hay un error, aseguramos que se limpie el archivo temporal
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        console.error('Error al subir el archivo a Pinata:', error);
        throw error;
    }
};

module.exports = { uploadToPinata };