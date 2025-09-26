require('dotenv').config();
const cors = require('cors');
const express = require('express');
const { default: helmet } = require('helmet');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const authRouter =  require('./routers/authRouter');
const postRouter =  require('./routers/postRouter');

const port = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI, {
   dbName: process.env.DB_NAME,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Failed to connect to MongoDB', err);
});

app.use('/api/auth', authRouter);
app.use('/api/posts', postRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.listen(port, () => {
  console.log('Server is running on port', port);
});