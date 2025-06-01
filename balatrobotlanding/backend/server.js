const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');

// Create Express app
const app = express();
const PORT = 3001;

// MongoDB connection string with credentials and authSource
const uri = "mongodb+srv://balatro:a2%239rxksh%21g6y8U@balatroagent.dxm3nnc.mongodb.net/balatroagent?retryWrites=true&w=majority&authSource=admin";

// Create a MongoClient with options
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 10000, // 10 seconds
  socketTimeoutMS: 45000, // 45 seconds
  maxPoolSize: 50,
  retryWrites: true,
  retryReads: true
});

// Middleware
app.use(cors({
  origin: 'http://localhost:1420', // Allow Tauri app to connect
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Database and collection names
const dbName = 'balatroagent';
const collectionName = 'users';

// Variable to track connection status
let isConnected = false;

// Connect to MongoDB with retry logic
async function connectToMongo(retries = 5, delay = 2000) {
  let currentTry = 0;
  
  while (currentTry < retries) {
    try {
      if (isConnected) {
        console.log("Already connected to MongoDB");
        return true;
      }
      
      await client.connect();
      await client.db("admin").command({ ping: 1 });
      console.log("Successfully connected to MongoDB!");
      isConnected = true;
      return true;
    } catch (error) {
      currentTry++;
      console.error(`Failed to connect to MongoDB (attempt ${currentTry}/${retries}):`, error);
      
      if (currentTry >= retries) {
        console.error("Maximum retries reached. Could not connect to MongoDB.");
        return false;
      }
      
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

// Initialize connection on startup
connectToMongo();

// Middleware to ensure MongoDB is connected
const ensureDbConnected = async (req, res, next) => {
  if (!isConnected) {
    const connected = await connectToMongo(3, 1000);
    if (!connected) {
      return res.status(500).json({
        success: false,
        message: 'Database connection unavailable. Please try again later.'
      });
    }
  }
  next();
};

// Apply DB connection middleware to all API routes
app.use('/api', ensureDbConnected);

// API Routes
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    
    // Validate username
    if (!username || typeof username !== 'string' || username.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Username is required' 
      });
    }
    
    // Get database and collection
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    // Create document
    const document = {
      username: username.trim(),
      createdAt: new Date()
    };
    
    // Insert document
    const result = await collection.insertOne(document);
    
    console.log(`Saved username ${username} with ID: ${result.insertedId}`);
    
    return res.status(201).json({
      success: true,
      message: 'Username saved to MongoDB',
      data: {
        id: result.insertedId,
        username: username.trim()
      }
    });
  } catch (error) {
    console.error('Error saving username:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save username',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Ping MongoDB to check connection
    await client.db("admin").command({ ping: 1 });
    res.status(200).json({ 
      status: 'ok', 
      message: 'Server is running and connected to MongoDB',
      database: dbName,
      collection: collectionName
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'MongoDB connection failed', 
      error: error.message,
      connectionString: uri.replace(/balatro:([^@]+)@/, 'balatro:***@') // Log connection string with hidden password
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoint available at http://localhost:${PORT}/api/users`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  try {
    if (isConnected) {
      await client.close();
      console.log('MongoDB connection closed');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
});
