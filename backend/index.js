const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3001;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'interlink',
  password: 'your_password', // Change this to your PostgreSQL password
  port: 5432,
});

app.get('/', (req, res) => {
  res.send('Hello from InterLink Backend!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
