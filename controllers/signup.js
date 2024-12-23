const signupRouter = require('express').Router()



signupRouter.post('/', [
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

module.exports = signupRouter