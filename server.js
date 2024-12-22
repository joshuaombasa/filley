const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs/promises');
const { check, validationResult } = require('express-validator');

const app = express();
const port = 3000;
const saltRounds = 10;

// Database configuration
const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'obomo'
};

// Middleware
app.use(cors());
app.use(express.json());

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, path.join(__dirname, '../frontend/public'));
    },
    filename: (req, file, callback) => {
        const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1E9)}`;
        const fileExtension = path.extname(file.originalname);
        callback(null, `profile_${uniqueSuffix}${fileExtension}`);
    }
});

const upload = multer({ storage });

// Routes

/**
 * Signup route to register a new employee
 */
app.post('/signup', [
    check('email', "Please enter a valid email").isEmail(),
    check('password', "Password must be at least 7 characters long").isLength({ min: 7 })
], upload.single('profilepicture'), async (req, res) => {
    const { firstname, lastname, email, password } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const connection = await mysql.createConnection(DB_CONFIG);

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const signupSql = `INSERT INTO employees (firstname, lastname, email, password, filename) VALUES (?, ?, ?, ?, ?)`;

        await connection.query(signupSql, [firstname, lastname, email, hashedPassword, req.file.filename]);

        connection.end();
        res.status(201).json({ message: `${firstname} ${lastname} signup successful` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred during signup.' });
    }
});

/**
 * Retrieve all employees
 */
app.get('/employees', async (req, res) => {
    try {
        const connection = await mysql.createConnection(DB_CONFIG);
        const getEmployeesSql = `SELECT id, firstname, lastname, email, filename FROM employees`;
        const [rows] = await connection.query(getEmployeesSql);

        connection.end();
        res.status(200).json({ employees: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve employees.' });
    }
});

/**
 * Delete an employee by ID
 */
app.delete('/employees/:id', async (req, res) => {
    const employeeId = parseInt(req.params.id, 10);

    try {
        const connection = await mysql.createConnection(DB_CONFIG);

        // Retrieve the employee's profile picture filename
        const getEmployeeImageSql = `SELECT filename FROM employees WHERE id = ?`;
        const [imageResult] = await connection.query(getEmployeeImageSql, [employeeId]);

        if (imageResult.length === 0) {
            connection.end();
            return res.status(404).json({ error: 'Employee does not exist.' });
        }

        // Delete employee record
        const deleteEmployeeSql = `DELETE FROM employees WHERE id = ?`;
        await connection.query(deleteEmployeeSql, [employeeId]);

        // Delete profile picture file
        const imagePath = path.join(__dirname, '../frontend/public', imageResult[0].filename);
        await fs.unlink(imagePath);

        connection.end();
        res.status(200).json({ message: 'Employee deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete employee.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
