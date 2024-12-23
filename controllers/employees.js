const employeesRouter = require('express').Router()


/**
* Retrieve all employees
*/
employeesRouter.get('/', async (req, res) => {
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
employeesRouter.delete(':id', async (req, res) => {
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

module.exports = employeesRouter