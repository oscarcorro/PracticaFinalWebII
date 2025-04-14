const {handleHttpError} = require("../utils/handleError") //manejar errores
const Project = require("../models/nosql/project")
const {matchedData} = require("express-validator") //comprobar info

//Crear un nuevo proyecto
const createProject = async(req, res) => {
    try{
        const userId = req.user.id //id del usuario que ha iniciado seisón
        const {name, client} = matchedData(req)
        //comprobar si ya existe un proyecto con este nombre asociado al mismo cliente y usuario
        const existingProject = await Project.findOne({name, client, createdBy: userId})
        if(existingProject)
            return handleHttpError(res, "PROJECT_ALREADY_EXISTS", 404)
        //si no existe creamos un nuevo proyecto
        const newProject = await Project.create({
            ...matchedData(req),
            createdBy: userId
        })

        res.status(200).json(newProject)
    }catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_CREATING_PROJECT", 500)
    }
}

//actualizar proyecto
const updateProject = async(req, res) => {
    try{
        const {id} = req.params //id del proyecto que se va a ctualizar
        const data = matchedData(req) //datos ya validados

        const updatedProject = await Project.findByIdAndUpdate(id, data, {new: true}) //actualizar proyecto
        if(!updatedProject)
            return handleHttpError(res, "PROJECT_NOT_FOUND", 404)

        res.json(updatedProject)
    }catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_UPDATING_PROJECT", 500)
    }
}

//Obtener lista de proyectos 
const getProjects = async(req, res) => {
    try{
        const userId = req.user.id //usuario al que estan asociados los proyectos
        const userCompany = req.user.company?.cif //si tiene empresa, obtenemos el cif

        const projects = await Project.find({
            $or: [
                { createdBy: userId },
                { 'company.cif': userCompany }
            ]
        })
        res.json(projects)
    }catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_GET_PROJECTS", 500)
    }
}

//Obtener un proyecto por su id
const getProject = async(req, res) => {
    try {
        const {id} = req.params // id del proyecto
        const project = await Project.findById(id)
        //si no existe el proyecto manejamos el error
        if(!project)
            return handleHttpError(res, "PROJECT_NOT_FOUND", 404)

        res.json(project)
    }catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_GET_PROJECT", 500)
    }
}

//Archivar un proyecto (soft-delete)
const archiveProject = async(req, res) =>{
    try {
        const {id} = req.params //id del proyecto
        const project = await Project.findById(id)

        if(!project)
            return handleHttpError(res, "PROJECT_NOT_FOUND", 404)

        await project.delete() //eliminado con soft-gelete

        res.json({message: "Proyecto archivado (soft-delete)"})
    }catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_DELETE_PROJECT", 500)
    }
}

//Eliminar un proyecto (hard-delete)
const deleteProject = async(req, res) => {
    try{
        const {id} = req.params //id del poryecto a eliminar
        const project = await Project.findByIdAndDelete(id) //asi lo eliminamos permanentemente

        if(!project)
            return handleHttpError(res, "PROJECT_NOT_FOUND", 404)

        res.json({message: "Proyecto eliminado permanentemente"})
    }catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_DELETE_PROJECT", 500)
    }
}

//Listar los proyectos archivados (eliminados con soft-delete)
const listArchivedProjects = async(req, res) => {
    try{
        const userId = req.user.id
        const userCompany = req.user.company?.cif

        //buscar los proyectos archivados
        const projects = await Project.findDeleted({
            $or: [
            { createdBy: userId },
            { 'company.cif': userCompany }
            ]
        })

        res.json(projects)
    }catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_LIST_ARCHIVED_PROJECTS", 500)
    }
}

//Recuperar un proyecto
const restoreProject = async(req, res) => {
    try{
        const {id} = req.params //id del proyecto a recuperar
        const project = await Project.findOneDeleted({_id: id}) //proyecto que queremos recuperar

        if(!project)
            return handleHttpError(res, "PROJECT_NOT_FOUND", 404)

        await project.restore() //recuperar proyecto archivado

        res.json({message: "Proyecto recuperado correctamente"})
    }catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_RESTORE_PROJECT", 500)
    }
}

module.exports = {createProject, updateProject, getProjects, getProject, archiveProject, deleteProject, listArchivedProjects, restoreProject}