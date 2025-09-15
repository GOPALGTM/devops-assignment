const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Pool } = require('pg');

const app = express();
const port = 3001;

// Database connection with hardcoded values - issues to fix
const pool = new Pool({
  host: 'localhost', // Hardcoded - should use environment variable
  port: 5432, // Hardcoded - should use environment variable
  database: 'todo_app', // Hardcoded - should use environment variable
  user: 'postgres', // Hardcoded - should use environment variable
  password: 'password123', // Hardcoded - should use environment variable
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Simple in-memory storage for todos (fallback)
let todos = [
  { id: 1, text: 'Learn DevOps', completed: false },
  { id: 2, text: 'Fix hardcoded values', completed: false },
  { id: 3, text: 'Deploy to production', completed: false }
];
let nextId = 4;

// Middleware configurationda
app.use(cors({
  origin: '*', 
  credentials: true
}));

app.use(morgan('combined'));
app.use(express.json());

// Database initialization
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        text VARCHAR(255) NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'degraded', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Get all todos
app.get('/api/todos', async (req, res) => {
  try {
    // Try database first, fallback to in-memory
    const result = await pool.query('SELECT * FROM todos ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Database error, using in-memory storage:', error);
    res.json(todos);
  }
});

// Create a new todo
app.post('/api/todos', async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    // Try database first
    const result = await pool.query(
      'INSERT INTO todos (text, completed) VALUES ($1, $2) RETURNING *',
      [text, false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Database error, using in-memory storage:', error);
    // Fallback to in-memory
    const newTodo = {
      id: nextId++,
      text: text,
      completed: false
    };
    todos.push(newTodo);
    res.status(201).json(newTodo);
  }
});

// Update a todo
app.put('/api/todos/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { text, completed } = req.body;

  try {
    // Try database first
    const result = await pool.query(
      'UPDATE todos SET text = COALESCE($1, text), completed = COALESCE($2, completed) WHERE id = $3 RETURNING *',
      [text, completed, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Database error, using in-memory storage:', error);
    // Fallback to in-memory
    const todoIndex = todos.findIndex(todo => todo.id === id);
    
    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    if (text !== undefined) todos[todoIndex].text = text;
    if (completed !== undefined) todos[todoIndex].completed = completed;

    res.json(todos[todoIndex]);
  }
});

// Delete a todo
app.delete('/api/todos/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    // Try database first
    const result = await pool.query('DELETE FROM todos WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Database error, using in-memory storage:', error);
    // Fallback to in-memory
    const todoIndex = todos.findIndex(todo => todo.id === id);
    
    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    todos.splice(todoIndex, 1);
    res.status(204).send();
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const server = app.listen(port, async () => {
  console.log(`Todo API server running on port ${port}`);
  await initDatabase();
});