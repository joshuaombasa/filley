const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs/promises');
const { check, validationResult } = require('express-validator');


const employeesRouter = require('./controllers/employees')
const signupRouter = require('./controllers/signup')

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


app.use('/employees', employeesRouter)

app.use('/signup',signupRouter)

// Start the server
app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
