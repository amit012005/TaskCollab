require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path'); 
const connectDB = require('./config/db');
const { setupSocket } = require('./socket');
const { setIO } = require('./services/socketEmitter');
const authRoutes = require('./routes/authRoutes');
const boardRoutes = require('./routes/boardRoutes');
const listRoutes = require('./routes/listRoutes');
const taskRoutes = require('./routes/taskRoutes');
const activityRoutes = require('./routes/activityRoutes');
const userRoutes = require('./routes/userRoutes');

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = createServer(app);

// Configure Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Configure Express CORS
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api', listRoutes);
app.use('/api', taskRoutes);
app.use('/api', activityRoutes);
app.use('/api/users', userRoutes);

// Health Check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// 2. Serve static files from the public folder (Frontend build)
app.use(express.static(path.join(__dirname, '../public')));

// 3. Handle React routing, return index.html for all non-API requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Setup Socket.io
setupSocket(io);
setIO(io);
app.set('io', io);

// Start Server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});