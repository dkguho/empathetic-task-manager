require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const aiAndStatsRoutes = require('./routes/aiAndStatsRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

// মিডলওয়্যার
const allowedOrigins = [
  'http://localhost:3000',
  'https://client-five-murex.vercel.app'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. mobile apps or curl) or if origin is in the allowed list
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Explicitly handle preflight requests across all endpoints
app.options('*', cors());

app.use(express.json());

// ডাটাবেস কানেকশন
connectDB();

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiAndStatsRoutes);

// টেস্ট রাউট
app.get('/api/health', (req, res) => {
  res.json({ status: 'active', message: '🌱 Empathetic Task Manager Server is running smoothly!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});