const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

// Just show me ALL todos, from ALL users. Maybe only accessible by an Admin user?
app.get('/api/todos', async(req, res) => {
  const userId = req.userId;
  const data = await client.query(`
    SELECT id, todo, completed, user_id
    FROM todos
    WHERE user_id=${userId}
  `);

  res.json(data.rows);
});

// Get all todos from an individual user by their ID
app.get('/api/todos/:id', async(req, res) => {
  const userId = req.userId;
  const data = await client.query(`
    SELECT id, todo, completed, user_id
    FROM todos
    WHERE user_id=${userId}
  `);

  res.json(data.rows);
});

// Create a todo for an user by their ID, contained in the request body
// The route path does not include the ID, because the todo does not exist yet
app.post('/api/todos', async(req, res) => {
  try {
    const userId = req.userId;
    const makeTodo = {
      todo: req.body.todo,
      completed: req.body.completed,
      user_id: userId,
    };

    const data = await client.query(`
      INSERT INTO todos(todo, completed, user_id)
      VALUES($1, $2, $3)
      RETURNING *
      `, [makeTodo.todo, makeTodo.completed, userId]
    );

    res.json(data.rows);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Update a pre-existing todo of a specific user. Todo is identified by ID in the request PARAMS
// User is identified by ID in the request BODY
app.put('/api/todos/:id', async(req, res) => {
  const todoId = req.params.id;

  try {
    const userId = req.userId;

    const updateTodo = {
      todo: req.body.todo,
      completed: req.body.completed,
      user_id: userId,
    };

    const data = await client.query(`
      UPDATE todos
        SET todo=$1, completed=$2
        WHERE todos.id = $3 AND todos.user_id = $4
        RETURNING *
        `, [updateTodo.todo, updateTodo.completed, todoId, userId]
    );

    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('*', (req, res) => {
  res.status(404).json({ message: 'You dun goofed! ' });
});

app.use(require('./middleware/error'));

module.exports = app;
