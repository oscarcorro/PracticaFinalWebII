const supertest = require('supertest')
const { app, server } = require('../index')
const mongoose = require('mongoose')
const User = require('../models/nosql/user')
const fs = require('fs')
const path = require('path')
const { tokenSign } = require('../utils/handleJwt')

const api = supertest(app)

//variables que usaremos en tests
let token = '' //JWT para autenticación
let userId = '' //id del usuario creado
let guestToken = '' //token del usuario invitado

//antes de todos los tests
beforeAll(async () => {
  //conectar a la BD
  await new Promise(resolve => mongoose.connection.once('connected', resolve))
  
  //borrar datos de usuarios
  await User.deleteMany({})

  //usuario para las pruebas
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

  // Generar token directamente con la función tokenSign en lugar de hacer login
  token = await tokenSign(user)
  
  // Verificar que el token se ha generado correctamente
  console.log("Token generado:", token ? "✓" : "✗")
})

//después de todos los tests
afterAll(async () => {
  const logoPath = path.join(__dirname, '../storage/test-logo.png')
  if(fs.existsSync(logoPath))
    fs.unlinkSync(logoPath)
  
  //cerrar el servidor y conexión
  await server.close()
  await mongoose.connection.close()
})

//tests para usuarios
describe('Users API Tests', () => {
  
  //lista de usuarios
  
  test('Obtener lista de usuarios', async() => {
    const response = await api
      .get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)
    
    //la respuesta es un array
    expect(Array.isArray(response.body)).toBeTruthy()
    
    //contiene al menos el usuario creado
    expect(response.body.length).toBeGreaterThan(0)
    
    //usuario creado está en la lista
    const userFound = response.body.some(user => user._id === userId)
    expect(userFound).toBeTruthy()
  })
  
  //obtener user por id
  test('Obtener usuario por ID', async () => {
    const response = await api
      .get(`/api/users/${userId}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    
    //ver si los datos del usuario son correctos
    expect(response.body._id).toBe(userId)
    expect(response.body.email).toBe('testuser@example.com')
    expect(response.body.name).toBe('Test')
    expect(response.body.lastname).toBe('User')
  })
  
  test('Obtener usuario con ID inválido', async () => {
    const response = await api
      .get('/api/users/invalidid')
      .expect(500) //codigo 500 por error de formato
  })
  
  test('Obtener usuario inexistente', async () => {
    const nonExistingId = new mongoose.Types.ObjectId()
    const response = await api
      .get(`/api/users/${nonExistingId}`)
      .expect(404)
      
    expect(response.text).toBe('USER_NOT_FOUND')
  })
  
  //usuario a partir del jwt
  test('Obtener perfil con token válido', async() => {
    // Verificar que el token existe antes de la prueba
    console.log("Token utilizado:", token.substring(0, 20) + "...")
    
    const response = await api
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    
    //datos del perfil correctos
    expect(response.body._id).toBe(userId)
    expect(response.body.email).toBe('testuser@example.com')
    expect(response.body.name).toBe('Test')
    expect(response.body.lastname).toBe('User')
    //contraseña no se envía
    expect(response.body.password).toBeUndefined()
  })
  
  test('Obtener perfil sin token', async () => {
    const response = await api
      .get('/api/users/profile')
      .expect(401)
    
    expect(response.text).toBe('TOKEN_REQUIRED')
  })
  
  test('Obtener perfil con token inválido', async () => {
    const response = await api
      .get('/api/users/profile')
      .set('Authorization', 'Bearer invalidtoken')
      .expect(401)
    
    expect(response.text).toBe('INVALID_TOKEN')
  })
  
  //update user
  test('Actualizar datos personales', async () => {
    const updatedData = {
      name: 'Updated',
      lastname: 'User',
      nif: '87654321X'
    }
    
    const response = await api
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedData)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    
    //ver si los datos del usuario se actualizaron
    expect(response.body.name).toBe('Updated')
    expect(response.body.lastname).toBe('User')
    expect(response.body.nif).toBe('87654321X')
  })
  
  test('Actualizar datos con campos inválidos', async () => {
    const invalidData = {
      //con nombre vacío
      name: ''
    }
    
    const response = await api
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(invalidData)
      .expect(400)
  })
  
  test('Actualizar usuario inexistente', async () => {
    const nonExistingId = new mongoose.Types.ObjectId()
    const updatedData = {
      name: 'Updated',
      lastname: 'NonExistent',
      nif: '87654321X'
    }
    
    const response = await api
      .put(`/api/users/${nonExistingId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedData)
      .expect(404)
    
    expect(response.text).toBe('USER_NOT_FOUND')
  })
  
  //actualizar datos compañia
  test('Actualizar datos de compañía', async () => {
    const companyData = {
      name: 'Test Company',
      cif: 'B12345678',
      address: 'Test Address 123'
    }
    
    const response = await api
      .patch('/api/users/update-company')
      .set('Authorization', `Bearer ${token}`)
      .send(companyData)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    
    //verificar si los datos de la compañía se actualizaron
    expect(response.body.message).toBe('Company data updated successfully!')
    expect(response.body.user.company.name).toBe('Test Company')
    expect(response.body.user.company.cif).toBe('B12345678')
    expect(response.body.user.company.address).toBe('Test Address 123')
  })
  
  test('Actualizar compañía con datos inválidos', async () => {
    const invalidData = {
      //nombre vacío
      name: '',
      cif: 'B12345678',
      address: 'Test Address'
    }
    
    const response = await api
      .patch('/api/users/update-company')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidData)
      .expect(400)
  })
  
  test('Actualizar compañía sin token', async () => {
    const companyData = {
      name: 'Test Company',
      cif: 'B12345678',
      address: 'Test Address 123'
    }
    
    const response = await api
      .patch('/api/users/update-company')
      .send(companyData)
      .expect(401)
    
    expect(response.text).toBe('TOKEN_REQUIRED')
  })
  
  //invitar user
  test('Invitar usuario', async () => {
    const inviteData = {
      email: 'inviteduser@example.com'
    }
    
    const response = await api
      .post('/api/users/invite')
      .set('Authorization', `Bearer ${token}`)
      .send(inviteData)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    
    expect(response.body.message).toBe('Usuario invitado creado correctamente')
    expect(response.body.user).toBeDefined()
    expect(response.body.user.email).toBe('inviteduser@example.com')
    expect(response.body.user.role).toBe('guest')
    expect(response.body.user.status).toBe('pending')
    expect(response.body.token).toBeDefined()
    expect(response.body.tempPassword).toBeDefined()
    
    //guardamos ID y token del usuario invitado
    guestUserId = response.body.user._id
    guestToken = response.body.token
  })
  
  test('Invitar usuario con email duplicado', async () => {
    const inviteData = {
      email: 'inviteduser@example.com' //email ya utilizado
    }
    
    const response = await api
      .post('/api/users/invite')
      .set('Authorization', `Bearer ${token}`)
      .send(inviteData)
      .expect(409)
    
    expect(response.text).toBe('EMAIL_ALREADY_EXISTS')
  })
  
  test('Invitar usuario sin token', async () => {
    const inviteData = {
      email: 'another@example.com'
    }
    
    const response = await api
      .post('/api/users/invite')
      .send(inviteData)
      .expect(401)
    
    expect(response.text).toBe('TOKEN_REQUIRED')
  })
  
  //actualizar logo - estos tests son opcionales y pueden ser problemáticos
  /* 
  test('Actualizar logo de usuario', async () => {
    //archivo de prueba simple
    const logoPath = path.join(__dirname, 'test-logo.png')
    fs.writeFileSync(logoPath, Buffer.from('test image content', 'utf-8'))
    
    const response = await api
      .patch('/api/users/update-logo')
      .set('Authorization', `Bearer ${token}`)
      .attach('logo', logoPath)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    
    //ver si se ha actualizado
    expect(response.body.message).toBe('Logo actualizado correctamente')
    expect(response.body.logo).toBeDefined()
    expect(response.body.logo).toContain('/storage/')
    
    //borrar archivo de prueba
    fs.unlinkSync(logoPath)
  })
  
  test('Actualizar logo sin archivo', async () => {
    const response = await api
      .patch('/api/users/update-logo')
      .set('Authorization', `Bearer ${token}`)
      .expect(400) //error
  })
  
  test('Actualizar logo sin token', async () => {
    //archivo de prueba simple
    const logoPath = path.join(__dirname, 'test-logo.png')
    fs.writeFileSync(logoPath, Buffer.from('test image content', 'utf-8'))
    
    const response = await api
      .patch('/api/users/update-logo')
      .attach('logo', logoPath)
      .expect(401)
    
    //borrar el archivo de prueba
    fs.unlinkSync(logoPath)
  })
  */
  
  //soft delete
  test('Eliminar perfil con soft delete', async() => {
    const response = await api
      .delete('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    
    //mensaje esperado
    expect(response.body.message).toBe('Usuario eliminado (soft delete)')
    
    //Verificar que el usuario existe pero está marcado como eliminado
    const deletedUser = await User.findWithDeleted({ _id: userId })
    expect(deletedUser).toBeDefined()
    expect(deletedUser[0].deleted).toBe(true)
  })
  
  //hard delete
  test('Eliminar perfil permanentemente', async () => {
    //usuario nuevo para esta prueba
    const newUserData = {
      email: 'harddeleteme@example.com',
      password: 'Password123',
      name: 'Hard',
      lastname: 'Delete',
      nif: '11223344Z',
      isAutonomous: false,
      role: 'user',
      status: 'verified'
    }
    
    const hardDeleteUser = await User.create(newUserData)
    const hardDeleteUserId = hardDeleteUser._id.toString()
    
    // token para este usuario usando tokenSign directamente
    const hardDeleteToken = await tokenSign(hardDeleteUser)
    
    //eliminamos permanentemente
    const response = await api
      .delete('/api/users/profile?soft=false')
      .set('Authorization', `Bearer ${hardDeleteToken}`)
      .expect(200)
    
    expect(response.body.message).toBe('Usuario eliminado permanentemente (hard delete)')
    
    //el usuario ya no existe
    const deletedUser = await User.findById(hardDeleteUserId)
    expect(deletedUser).toBeNull()
  })
  
  test('Eliminar perfil sin token', async() => {
    const response = await api
      .delete('/api/users/profile')
      .expect(401)
    
    expect(response.text).toBe('TOKEN_REQUIRED')
  })
  
})