require('dotenv').config();
const mongodb = require('./database/mongodb/db');
const userQuery = require('./database/mongodb/query');
const cors = require('cors');
mongodb.connectDB();

// Import the express module to create and configure the HTTP server
const express = require('express');
// Import the body-parser middleware to parse incoming request bodies
const bodyParser = require('body-parser');
// Initialize an Express application
const app = express();
const router = express.Router(); // Initialize the router

app.use(cors());
// Define the port number on which the server will listen
const PORT = 8080;
// Import the bcrypt module for password hashing
const bcrypt = require('bcrypt');

// Import the jwt module for authentication and authorization checks
const jwt = require('jsonwebtoken');
// Import the verifyToken middleware to authenticate JWT tokens
const verifyToken = require('./middlewares/jwt');
// Import the passport middleware to authenticate and configure the passport authentication
// const { initializePassport, authenticatePassportJwt } = require('./middlewares/passport-jwt');
// Initialize Passport
//app.use(initializePassport());

// Middleware to verify JWT tokens

// Initialize an array to store user data
let users = [];

// Middleware to parse JSON bodies
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Start the server and listen on the defined port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.post('/register', async (req, res) => {
  // Async untuk concurrency, request dan responds
  try {
    const { name, email, password } = req.body; // Nerima dari frontend
    const isAdmin = false;
    const payload = { name, email, password, isAdmin }; // Untuk menyimpan ketiga variabel menjadi satu paket
    const user = await register(payload);

    userQuery.createUser(user).then((user) => {
      res.status(201).json({
        status: 'success',
        message: 'Register success',
        data: {}
      }); // Respond with the created user and status code 201
    });
  } catch (err) {
    console.error('Error POST Register:', err);
    res.status(400).json({
      status: 'error',
      message: 'Register error: ' + err.message,
      data: {}
    });
  }
});

async function register(payload) {
  try {
    // const test = await userQuery.getUsers()
    // console.log(test);
    // console.log(payload);
    const checkEmail = await userQuery.findOneByEmail(payload.email);
    const checkUser = await userQuery.findByName(payload.name);
    const allowedDomains = ['.com', '.org', '.net', '.ac.id', '.co.uk'];

    const isValid = allowedDomains.some((domain) =>
      payload.email.endsWith(domain)
    );

    if (!isValid) {
      throw new Error('Email tidak valid');
    }

    if (!payload.email.includes('@')) {
      throw new Error('Email not valid');
    }

    // if (checkEmail.length != 0 && checkEmail) {
    //   console.log(checkEmail);
    //   throw new Error('You already have an account, please log in!');
    // }

    if (checkEmail != null) {
      throw new Error('You already have an account, please log in!');
    }
    

    // if (checkUser && checkUser.length !=0) {
    //   throw new Error("Username unavailable, please choose other username");
    // }

    if (payload.password.length < 8) {
      throw new Error('Minimal 8 character, please re-generate the password');
    }

    // payload.password = await bcrypt.hash(payload.password, 10);

    return payload;
  } catch (error) {
    console.error('Error register', error);
    throw error;
  }
}

// Route to login user
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const payload = { email, password };
    const {token, isAdmin} = await login(payload, false); // Untuk nunggu sebentar saat lagi memproses
    res.status(200).json({
      status: 'success',
      message: 'Login success',
      data: {
        user: email,
        token: token,
        isAdmin: isAdmin
      }
    }); // Responds dan status yang dikirim, status bisa variatif tergantung message
  } catch (err) {
    console.error('Error POST Login:', err);
    res.status(400).json({
      status: 'error',
      message: 'Login error: ' + err.message,
      data: {}
    });
  }
});

app.get('/login/verify', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const email = user.email;
    const password = user.password;
    const payload = { email, password };
    const { token, isAdmin } = await login(payload, true); // Untuk nunggu sebentar saat lagi memproses
    res.status(200).json({
      status: 'success',
      message: 'Login success',
      data: {
        user: email,
        token: token,
        isAdmin: isAdmin
      }
    }); // Responds dan status yang dikirim, status bisa variatif tergantung message
  } catch (err) {
    console.error('Error POST Verify Login:', err);
    res.status(400).json({
      status: 'error',
      message: 'Verify Login error: ' + err.message,
      data: {}
    });
  }
});

async function login(payload, ishashed) {
  try {
    const checkUser = await userQuery.findOneByEmail(payload.email);
    if (!checkUser || !checkUser.password) {
      throw new Error('Invalid email or password');
    }

    const user = {
      email: checkUser.email,
      password: checkUser.password,
      isAdmin: checkUser.isAdmin
    };

    const isValidPassword = ishashed ? (payload.password === checkUser.password) : bcrypt.compareSync(
      payload.password,
      checkUser.password
    );

    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    const key = process.env.JWT_SECRET || 'default_secret_key'; // Bikin secret key
    const token = jwt.sign(user, key, { expiresIn: '30m' }); // jwt.sign untuk ngasilin token
    return {
      token: token,
      isAdmin: user.isAdmin
    }; // Generate token
  } catch (err) {
    console.error('Error login: ', err);
    throw err;
  }
}

app.post('/logout', verifyToken, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: 'No token provided'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Logout successful',
      data: {}
    });
  } catch (err) {
    console.error('Error POST /logout:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error: ' + err.message,
      data: {}
    });
  }
});



app.get('/tasks/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params; // Ambil account ID dari URL

    console.log("Account ID from URL:", id);
    console.log("User ID from Token:", req.user._id);

    // Ambil semua task yang terkait dengan account ID
    const tasks = await userQuery.getTasksByAccountId(id);

    res.status(200).json({
      status: 'success',
      message: 'Tasks fetched successfully',
      data: tasks
    });
  } catch (err) {
    console.error('Error GET /tasks/:id:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error: ' + err.message,
      data: {}
    });
  }
});

app.post('/tasks/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params; // Ambil account ID dari URL

    console.log("Account ID from URL:", id);
    console.log("User ID from Token:", req.user._id);

    // Validasi data dari req.body
    if (!req.body.title || !req.body.deadline) {
      return res.status(400).json({
        status: 'error',
        message: 'Task title and deadline are required',
        data: {}
      });
    }

    // Buat task baru yang terkait dengan account ID
    const task = { ...req.body, userId: id }; // Tambahkan account ID ke task
    const createdTask = await userQuery.createTask(task);

    res.status(201).json({
      status: 'success',
      message: 'Task created successfully',
      data: createdTask
    });
  } catch (err) {
    console.error('Error POST /tasks/:id:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error: ' + err.message,
      data: {}
    });
  }
});

app.patch('/tasks/:id', verifyToken, async (req, res) => {
  try {
    const taskId = req.params.id;

    console.log("Task ID from URL:", taskId);
    console.log("User ID from Token:", req.user._id);

    // Ambil task berdasarkan taskId
    const task = await userQuery.getTaskById(taskId);

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found',
      });
    }

    // Validasi apakah task milik user yang sedang login
    if (task.userId.toString() !== req.user._id) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to update this task',
      });
    }

    // Perbarui task
    const updatedTask = await userQuery.updateTask(taskId, req.body);
    res.status(200).json({
      status: 'success',
      message: 'Task updated successfully',
      data: updatedTask,
    });
  } catch (err) {
    console.error('Error PATCH /tasks/:id:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update task: ' + err.message,
    });
  }
});

app.put('/tasks/:taskid/:userid/status', verifyToken, async (req, res) => {
  try {
    const { taskid, userid } = req.params;

    console.log("Task ID from URL:", taskid); // Log Task ID
    console.log("User ID from URL:", userid); // Log User ID

    // Perbarui status task menjadi "submitted"
    const updatedTask = await userQuery.updateTaskStatusById(taskid, userid);

    if (!updatedTask) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found or not eligible for status update',
        data: {}
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Task status updated to submitted',
      data: updatedTask
    });
  } catch (err) {
    console.error('Error updating task status:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error: ' + err.message,
      data: {}
    });
  }
});

app.put('/tasks/:taskid/:userid/reset-status', verifyToken, async (req, res) => {
  try {
    const { taskid, userid } = req.params;

    console.log("Task ID from URL:", taskid); // Log Task ID
    console.log("User ID from URL:", userid); // Log User ID

    // Perbarui status task menjadi "submitted"
    const updatedTask = await userQuery.resetTaskStatusById(taskid, userid);

    if (!updatedTask) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found or not eligible for status update',
        data: {}
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Task status updated to submitted',
      data: updatedTask
    });
  } catch (err) {
    console.error('Error updating task status:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error: ' + err.message,
      data: {}
    });
  }
});

app.patch('/tasks/:id', verifyToken, async (req, res) => {
  try {
    const taskId = req.params.id;

    console.log("Task ID from URL:", taskId);
    console.log("User ID from Token:", req.user._id);

    // Ambil task berdasarkan taskId
    const task = await userQuery.getTaskById(taskId);

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found',
      });
    }

    // Validasi apakah task milik user yang sedang login
    if (task.userId.toString() !== req.user._id) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to update this task',
      });
    }

    // Perbarui task
    const updatedTask = await userQuery.updateTask(taskId, req.body);
    res.status(200).json({
      status: 'success',
      message: 'Task updated successfully',
      data: updatedTask,
    });
  } catch (err) {
    console.error('Error PATCH /tasks/:id:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update task: ' + err.message,
    });
  }
});

app.post('/schedule/generate', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id; // Ambil userId dari token
    const schedule = await userQuery.generateSchedule(userId, new Date());
    res.status(201).json({
      status: 'success',
      message: 'Schedule generated successfully',
      data: schedule,
    });
  } catch (err) {
    console.error('Error POST /schedule/generate:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate schedule: ' + err.message,
    });
  }
});

app.get('/schedule', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id; // Ambil userId dari token
    const date = req.query.date; // Opsional: Filter berdasarkan tanggal
    const schedules = await userQuery.getSchedules(userId, date);
    res.status(200).json({
      status: 'success',
      message: 'Schedules fetched successfully',
      data: schedules,
    });
  } catch (err) {
    console.error('Error GET /schedule:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch schedules: ' + err.message,
    });
  }
});

app.delete('/schedule', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id; // Ambil userId dari token
    await userQuery.deleteSchedules(userId);
    res.status(200).json({
      status: 'success',
      message: 'All schedules deleted successfully',
    });
  } catch (err) {
    console.error('Error DELETE /schedule:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete schedules: ' + err.message,
    });
  }
});


app.get('/', function(req, res){
  res.sendFile(__dirname + '/documentation.html');
});