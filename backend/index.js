require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3001;

// parse JSON bodies
app.use(express.json());

// wire auth routes
const authRoutes = require('./auth/routes');
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Hello from InterLink Backend!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
