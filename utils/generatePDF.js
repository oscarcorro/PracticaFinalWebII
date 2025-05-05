const PDF = require("pdfkit")
const fs = require("fs")
const path = require("path")
const fetch = require("node-fetch")

const downloadImage = async (url, outputPath) => {
    try {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`Error al descargar la imagen: ${response.statusText}`)
        }
        const buffer = await response.buffer()
        fs.writeFileSync(outputPath, buffer)
        return outputPath
    } catch (error) {
        console.error("Error al descargar la imagen:", error)
        throw error
    }
}

const generatePDF = async (deliveryNote, filePath) => {
    return new Promise(async (resolve, reject) => {
        try{
            const doc = new PDF()
            const stream = fs.createWriteStream(filePath)
            doc.pipe(stream)

            //encabezado del PDF
            doc.fontSize(18).text("ALBARÁN", {aligne: "center"})
            doc.moveDown()
            //datos del cliente que ha generado el PDF
            doc.fontSize(12).text(`Cliente: ${deliveryNote.client.name}`)
            doc.text(`CIF: ${deliveryNote.client.cif}`)
            doc.text(`Dirección: ${deliveryNote.client.address}`)
            doc.text(`Email: ${deliveryNote.client.email}`)
            doc.moveDown()
            //proyecto del cliente
            doc.text(`Proyecto: ${deliveryNote.project.name}`)
            doc.text(`Información: ${deliveryNote.project.description}`)
            doc.moveDown()
            //creador
            doc.text(`Creado por: ${deliveryNote.createdBy.name} (${deliveryNote.createdBy.email})`)
            doc.moveDown()
            //entradas
            doc.fontSize(14).text("Entradas", {underline: true})
            deliveryNote.entries.forEach((entry, index) => {
                doc.fontSize(12).text(`${index + 1}. ${entry.description} - ${entry.quantity} ${entry.unit || ""}`)
            })
            doc.moveDown()
            //firma
            if (deliveryNote.signed && deliveryNote.signatureUrl) {
                doc.text("Albarán firmado")
                
                // Si la URL comienza con http o https, descargar la imagen primero
                if (deliveryNote.signatureUrl.startsWith("http")) {
                    try {
                        // Descargar la imagen de la firma a un archivo temporal
                        const tempImagePath = path.join(__dirname, `../temp-signature-${Date.now()}.png`)
                        await downloadImage(deliveryNote.signatureUrl, tempImagePath)
                        
                        // Añadir la imagen al PDF
                        doc.image(tempImagePath, {
                            fit: [100, 100],
                            align: "center"
                        })
                        
                        // Eliminar el archivo temporal
                        fs.unlinkSync(tempImagePath)
                    } catch (error) {
                        console.error("Error al procesar la firma:", error)
                        doc.text("Error al cargar la firma")
                    }
                } else {
                    // Si es una ruta local
                    doc.image(path.resolve(deliveryNote.signatureUrl), {
                        fit: [100, 100],
                        align: "center"
                    })
                }
            } else {
                doc.text("Albarán no firmado")
            }

            doc.end()
            stream.on("finish", resolve)
            stream.on("error", reject)  
        }catch(error){
            reject(error)
        }
    })
} 
module.exports = {generatePDF}