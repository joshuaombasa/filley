const express = require('express')
const multer = require('multer')
const path = require('path')
const mysql = require('mysql2/promise')
const bcrypt = require('bcrypt')
const fs = require('fs/promises')
const { check, validationResult } = require('express-validator')
const port = 3000
const saltRounds = 10

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'obomo'
}

const app = express()
app.use(cors())

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, path.join(__dirname, '../frontend/public'))
    },
    filename: function (req, file, callback) {
        const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9)
        const fileExtension = file.originalname.split('.').pop()
        callback(null, `profile_${uniqueSuffix}.${fileExtension}`)
    }
})

const upload = multer({ storage: storage })

const router = express.Router()

router.post('',  [
    check('email', "Please enter a valid email").isEmail(),
    check('password', "Please enter a password whose length is greater than 7").isLength({ min: 7 })
], upload.single('profilepicture'), async (req, res) => {
    const { firstname, lastname, email, password } = req.body
    const errors = validationResult(req)

    if (!errors.isEmpty) {
        return res.status(400).json(errors.array())
    }

    try {
        const connection = await mysql.createConnection(DB_CONFIG)
        const siqnupSql = `INSERT INTO employees (firstname,  lastname, email, password, filename) 
        VALUES (?, ?, ?, ?, ?)`
        const hashedPassword = await bcrypt.hash(password, saltRounds)
        console.log(hashedPassword)
        await connection.query(siqnupSql, [firstname, lastname, email, hashedPassword, req.file.filename])

        connection.end()
        return res.status(200).json(`${firstname} ${lastname} signup successful`)
    } catch (error) {
        return res.status(400).json(error)
    }
})

router.get('/', async (req, res) => {
    try {
        const connection = await mysql.createConnection(DB_CONFIG)
        getEmployeesSql = `SELECT id, firstname,  lastname, email, filename FROM employees`
        const [rows] = await connection.query(getEmployeesSql)
        res.status(200).json({ employees: rows })
    } catch (error) {
        res.status(400).json(error)
    }
})

router.delete('/id', async (req,res) => {
    const employeeId = req.params.id


    try {
        
        const connection = await mysql.createConnection(DB_CONFIG)
        const getEmployeeImageSql = `SELECT filename FROM employees WHERE id=?`
        const [ImageResultRows] = await connection.query(getEmployeeImageSql, [parseInt(employeeId)])

       

        if (ImageResultRows.length === 0) {
            connection.end
            return res.status(400).json('Employee does not exists')
        }

        const deleteEmployeeSql = `DELETE FROM employees WHERE id=?`
        await connection.query(deleteEmployeeSql, [parseInt(employeeId)])

        const imagePath = path.join(__dirname, '../frontend/public', ImageResultRows[0].filename)

        await fs.unlink(imagePath)

        connection.end()

        return res.status(200).json('employee deleted successfully')

    } catch(error) {
        return res.status(400).json(error)
    }
})


module.exports = router