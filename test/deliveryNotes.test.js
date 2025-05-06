const supertest = require('supertest')
const {app, server} = require('../index')
const mongoose = require('mongoose')
const User = require('../models/nosql/user')
const Client = require('../models/nosql/client')
const Project = require('../models/nosql/project')
const DeliveryNote = require('../models/nosql/deliveryNote')
const {tokenSign} = require('../utils/handleJwt')
const path = require('path')

const fs = require('fs')

//Mock para las funciones de IPFS y PDF
jest.mock('../utils/handleUploadIPFS', () => ({
  uploadToPinata: jest.fn().mockImplementation(() => Promise.resolve({
    IpfsHash: 'QmTestHashForMockedIPFSUpload',
    PinSize: 1000,
    Timestamp: new Date().toISOString()
  }))
}))

//El mock para generatePDF debe evitar usar fs dentro de su implementación
jest.mock('../utils/generatePDF', () => ({
  generatePDF: jest.fn().mockImplementation((deliveryNote, filePath) => {
    //No usamos fs.writeFileSync dentro del mock
    //Simplemente devolvemos la promesa
    return Promise.resolve(filePath)
  })
}))

//Mock para fetch (usado en downloadDeliveryNotePDF)
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    arrayBuffer: () => Promise.resolve(Buffer.from('Mock PDF content')),
    statusText: 'OK'
  })
)

//inicializamos
const api = supertest(app)


let token = '' //token jwt para autenticación
let userId = '' //id del usuario
let clientId = '' //id del cliente para asociar proyectos y albaranes
let projectId = '' //id del proyecto para asociar albaranes
let deliveryNoteId = '' //id del albarán creado
let secondDeliveryNoteId = '' //id de un segundo albarán
let signedDeliveryNoteId = '' //id de un albarán firmado
let secondUserToken = '' //token de otro usuario
let secondUserId = '' //id del segundo usuario
let secondUserClientId = '' //id del cliente del segundo usuario
let secondUserProjectId = '' //id del proyecto del segundo usuario

//datos para los lbaranes de los tests
const hoursDeliveryNoteData = {
  type: 'hours',
  entries: [
    {
      description: 'Desarrollo de API',
      quantity: 8,
      unit: 'horas'
    },
    {
      description: 'Implementación de tests',
      quantity: 4,
      unit: 'horas'
    }
  ]
}

const materialsDeliveryNoteData = {
  type: 'materials',
  entries: [
    {
      description: 'Cable Ethernet Cat 6',
      quantity: 10,
      unit: 'metros'
    },
    {
      description: 'Router WiFi',
      quantity: 1,
      unit: 'unidad'
    }
  ]
}

//directorio temporal para los archivos
const setupTestStorage = () => {
  const storageDir = path.join(__dirname, '../storage')
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir)
  }
}

//Antes de todo
beforeAll(async () => {
  setupTestStorage() //confirmar que existe para evitar errores

  //conexión a BD
  await new Promise(resolve => mongoose.connection.once('connected', resolve))
  
  //limpiamos todo
  await User.deleteMany({})
  await Client.deleteMany({})
  await Project.deleteMany({})
  await DeliveryNote.deleteMany({})

  //usuario para pruebas
  const userData = {
    email: 'testuser@example.com',
    password: 'Password123',
    name: 'Test',
    lastname: 'User',
    nif: '12345678Z',
    isAutonomous: false,
    role: 'user',
    status: 'verified'
  }

  const user = await User.create(userData)
  userId = user._id.toString()

  //token con tokenSign
  token = await tokenSign(user)
  
  //cliente para asociar proyectos y albaranes
  const clientData = {
    name: 'Cliente Test',
    cif: 'B12345678',
    address: 'Calle Test 123',
    phone: '612345678',
    email: 'cliente@test.com',
    createdBy: userId
  }
  
  const client = await Client.create(clientData)
  clientId = client._id.toString()
  
  //proyecto para asociar albaranes
  const projectData = {
    name: 'Proyecto Test',
    description: 'Descripción del proyecto de prueba',
    client: clientId,
    createdBy: userId
  }
  
  const project = await Project.create(projectData)
  projectId = project._id.toString()
  
  //segundo usuario para pruebas
  const secondUserData = {
    email: 'seconduser@example.com',
    password: 'Password123',
    name: 'Second',
    lastname: 'User',
    nif: '87654321X',
    isAutonomous: false,
    role: 'user',
    status: 'verified'
  }

  const secondUser = await User.create(secondUserData)
  secondUserId = secondUser._id.toString()
  secondUserToken = await tokenSign(secondUser)
  
  //cliente para el segundo usuario
  const secondClientData = {
    name: 'Cliente Second User',
    cif: 'B87654321',
    address: 'Calle Second User 456',
    phone: '687654321',
    email: 'secondclient@test.com',
    createdBy: secondUserId
  }
  
  const secondClient = await Client.create(secondClientData)
  secondUserClientId = secondClient._id.toString()
  
  //proyecto para el segundo usuario
  const secondProjectData = {
    name: 'Proyecto Second User',
    description: 'Descripción del proyecto del segundo usuario',
    client: secondUserClientId,
    createdBy: secondUserId
  }
  
  const secondProject = await Project.create(secondProjectData)
  secondUserProjectId = secondProject._id.toString()
})

//función auxiliar para crear archivos temporales
const createTempFile = (filename, content) => {
  const filePath = path.join(__dirname, '../storage', filename)
  fs.writeFileSync(filePath, content)
  return filePath
}

//Después de todo
afterAll(async () => {
  //cerrar server y conexión
  await mongoose.connection.close()
  await server.close()
})

//Tests para albaranes 
describe('DeliveryNote API Tests', () => {
  
  //CREACIÓN DE ALBARANES
  
  test('Crear albarán de horas', async () => {
    const deliveryNoteData = {
      ...hoursDeliveryNoteData,
      client: clientId,
      project: projectId
    }
    
    const response = await api
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send(deliveryNoteData)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    
    //datos guardados
    expect(response.body._id).toBeDefined()
    expect(response.body.type).toBe('hours')
    expect(response.body.entries.length).toBe(2)
    expect(response.body.client).toBe(clientId)
    expect(response.body.project).toBe(projectId)
    expect(response.body.createdBy).toBe(userId)
    expect(response.body.signed).toBe(false)
    
    deliveryNoteId = response.body._id
  })
  
  test('Crear albarán de materiales', async() => {
    const deliveryNoteData = {
      ...materialsDeliveryNoteData,
      client: clientId,
      project: projectId
    }
    
    const response = await api
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send(deliveryNoteData)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    
    expect(response.body._id).toBeDefined()
    expect(response.body.type).toBe('materials')
    expect(response.body.entries.length).toBe(2)
    expect(response.body.client).toBe(clientId)
    expect(response.body.project).toBe(projectId)
    expect(response.body.createdBy).toBe(userId)
    
    secondDeliveryNoteId = response.body._id
  })
  
  test('Crear albarán sin token', async() => {
    const deliveryNoteData = {
      ...hoursDeliveryNoteData,
      client: clientId,
      project: projectId
    }
    
    const response = await api
      .post('/api/deliverynote')
      .send(deliveryNoteData)
      .expect(401)
    
    expect(response.text).toBe('TOKEN_REQUIRED')
  })
  
  test('Crear albarán con datos incompletos', async () => {
    const incompleteData = {
      type: 'hours',
      entries: [
        {
          description: 'Desarrollo de API',
          quantity: 8,
          unit: 'horas'
        }
      ]
      //sin client ni project
    }
    
    const response = await api
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send(incompleteData)
      .expect(response => {
        expect([400, 404, 500]).toContain(response.status)
      })
  })
  
  test('Crear albarán con tipo inválido', async () => {
    const invalidTypeData = {
      type: 'invalid_type', //tipo random para generar el error
      entries: [
        {
          description: 'Desarrollo de API',
          quantity: 8,
          unit: 'horas'
        }
      ],
      client: clientId,
      project: projectId
    }
    
    const response = await api
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidTypeData)
      .expect(response => {
        expect([400, 500]).toContain(response.status)
      })
  })
  
  test('Crear albarán con cliente inexistente', async () => {
    const nonExistingClientId = new mongoose.Types.ObjectId()
    
    const deliveryNoteData = {
      ...hoursDeliveryNoteData,
      client: nonExistingClientId,
      project: projectId
    }
    
    const response = await api
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send(deliveryNoteData)
      .expect(response => {
        expect([404, 500]).toContain(response.status)
      })
  })
  
  test('Crear albarán con proyecto inexistente', async () => {
    const nonExistingProjectId = new mongoose.Types.ObjectId()
    
    const deliveryNoteData = {
      ...hoursDeliveryNoteData,
      client: clientId,
      project: nonExistingProjectId
    }
    
    const response = await api
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send(deliveryNoteData)
      .expect(response => {
        expect([404, 500]).toContain(response.status)
      })
  })
  
  //OBTENCIÓN DE ALBARANES
  
  test('Obtener todos los albaranes del usuario', async () => {
    const response = await api
      .get('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    
    //Verificar que devuelve array con los albaranes creados
    expect(Array.isArray(response.body)).toBeTruthy()
    //Verificamos que hay al menos 1 albarán
    expect(response.body.length).toBeGreaterThan(0)
    
    //datos correctos
    const deliveryNoteFound = response.body.some(note => note._id === deliveryNoteId)
    expect(deliveryNoteFound).toBeTruthy()
    
    //Todos los albaranes pertenecen al usuario
    const allUserNotes = response.body.every(note => note.createdBy === userId)
    expect(allUserNotes).toBeTruthy()
  })
  
  test('Crear albarán para segundo usuario', async () => {
    const deliveryNoteData = {
      ...hoursDeliveryNoteData,
      client: secondUserClientId,
      project: secondUserProjectId
    }
    
    await api
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${secondUserToken}`)
      .send(deliveryNoteData)
      .expect(200)
  })
  
  test('Filtrado por usuario: otro usuario no ve los albaranes', async () => {
    const response = await api
      .get('/api/deliverynote')
      .set('Authorization', `Bearer ${secondUserToken}`)
      .expect(200)
    
    //el segundo usuario no debe ver los albaranes del primero
    const firstUserNoteFound = response.body.some(note => note._id === deliveryNoteId)
    expect(firstUserNoteFound).toBeFalsy()
    
    expect(response.body.length).toBeGreaterThan(0)
  })
  
  test('Obtener albarán específico por ID', async () => {
    const response = await api
      .get(`/api/deliverynote/${deliveryNoteId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    
    expect(response.body._id).toBe(deliveryNoteId)
    expect(response.body.type).toBe('hours')
    expect(response.body.client).toBeDefined()
    expect(response.body.project).toBeDefined()
    expect(response.body.createdBy).toBeDefined()
    
    //vemos si ha llegado el resto de info
    expect(typeof response.body.client).toBe('object')
    expect(typeof response.body.project).toBe('object')
    expect(typeof response.body.createdBy).toBe('object')
  })
  
  test('Obtener albarán con ID inexistente', async () => {
    const nonExistingId = new mongoose.Types.ObjectId()
    
    const response = await api
      .get(`/api/deliverynote/${nonExistingId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
    
    expect(response.text).toBe('DELIVERY_NOTE_NOT_FOUND')
  })
  
  test('Obtener albarán con ID inválido', async () => {
    const response = await api
      .get('/api/deliverynote/invalidid')
      .set('Authorization', `Bearer ${token}`)
      .expect(500)
  })
  
  //FIRMA DE ALBARANES
  
  test('Firmar albarán sin imagen', async() => {
    const response = await api
      .patch(`/api/deliverynote/sign/${secondDeliveryNoteId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)
    
    expect(response.text).toBe('SIGNATURE_IMAGE_REQUIRED')
  })
  
  test('Firmar albarán con ID inexistente', async () => {
    //archivo de imagen simple para la firma
    const testImagePath = createTempFile('test-signature2.png', 'fake image content')
    
    const nonExistingId = new mongoose.Types.ObjectId()
    
    const response = await api
      .patch(`/api/deliverynote/sign/${nonExistingId}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testImagePath)
      .expect(404)
    
    expect(response.text).toBe('DELIVERY_NOTE_NOT_FOUND')
    
    //eliminar el archivo de prueba
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath)
    }
  })
  
  test('Descargar PDF de albarán inexistente', async () => {
    const nonExistingId = new mongoose.Types.ObjectId()
    
    const response = await api
      .get(`/api/deliverynote/pdf/${nonExistingId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
    
    expect(response.text).toBe('DELIVERY_NOTE_NOT_FOUND')
  })
  
  //ELIMINACIÓN DE ALBARANES
  
  test('Eliminar albarán no firmado', async () => {
    const response = await api
      .delete(`/api/deliverynote/${secondDeliveryNoteId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    
    expect(response.body.message).toBe('Albarán eliminado correctamente')
    
    const checkResponse = await api
      .get(`/api/deliverynote/${secondDeliveryNoteId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
  })
  
  test('Eliminar albarán inexistente', async () => {
    const nonExistingId = new mongoose.Types.ObjectId()
    
    const response = await api
      .delete(`/api/deliverynote/${nonExistingId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
    
    expect(response.text).toBe('DELIVERY_NOTE_NOT_FOUND')
  })
  
  //TESTS DE SEGURIDAD
  
  test('Intentar acceder sin token a todos los endpoints', async () => {
    //get todos los albaranes
    await api
      .get('/api/deliverynote')
      .expect(401)
    
    //get albarán específico
    await api
      .get(`/api/deliverynote/${signedDeliveryNoteId}`)
      .expect(401)
    
    //endpoints principales sin token
  })
  
})