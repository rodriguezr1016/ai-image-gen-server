import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import bcryptjs from 'bcryptjs'
import connectDB from './mongodb/connect.js';
import postRoutes from './routes/postRoute.js';
import dalleRoutes from './routes/dalleRoute.js';
import User from './mongodb/models/user.js';
import jwt from 'jsonwebtoken'

dotenv.config();

const app = express();
export const hashPassword = async (password) => {
  const salt = await bcryptjs.genSalt(10);
  return await bcryptjs.hash(password, salt);
};

export const checkPassword = async (plainPassword, hashedPassword) => {
  return await bcryptjs.compare(plainPassword, hashedPassword);
};

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/v1/post', postRoutes);
app.use('/api/v1/dalle', dalleRoutes);

app.get('/', async (req, res) => {
  res.status(200).json({
    message: 'Hello from DALL.E!',
  });
});
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate the data (e.g., check if the email already exists)
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).send('Email or Username already exists.');
    }
    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Save the new user to the database
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).send(newUser);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
app.post('/api/login',async(req, res) =>{
  try {
      const user = await User.findOne({email: req.body.email});
      if(!user) return res.status(400).send('Invalid email or password');
      const isValidPassword = await checkPassword(req.body.password, user.password);
      if(!isValidPassword) return res.status(400).send('Invalid email or password.');
      if( user && isValidPassword){
        const token = jwt.sign(
          {userId: user.id, username: user.username},
          process.env.JWT_SECRET,
          
        );

        res.json({token})
      }


  } catch (error) {
      res.status(500).send(error.message);
  }
});
const startServer = async () => {
  try {
    connectDB(process.env.MONGODB_URL);
    app.listen(8080, () => console.log('Server started on port 8080'));
  } catch (error) {
    console.log(error);
  }
};

startServer();