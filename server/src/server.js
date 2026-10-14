require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const aiAndStatsRoutes = require('./routes/aiAndStatsRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

// মিডলওয়্যার
app.use(cors());
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