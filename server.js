require('dotenv').config();
const mongodb = require('./database/mongodb/db');
const userQuery = require('./database/mongodb/query');
const cors = require('cors');
const axios = require('axios');

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

app.delete('/tasks/:idTask/:idAccount', verifyToken, async (req, res) => {
  try {
    const { idTask, idAccount } = req.params; // Extract task ID and account ID from URL

    console.log("Task ID from URL:", idTask);
    console.log("Account ID from URL:", idAccount);
    console.log("User ID from Token:", req.user._id);

    // Attempt to delete the task
    const deletedTask = await userQuery.deleteTaskByIdAndAccount(idTask, idAccount);

    // If no task was deleted, send a 404 response
    if (!deletedTask) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found or already deleted',
      });
    }

    // Send a success response
    res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully',
      data: deletedTask,
    });
  } catch (err) {
    console.error('Error DELETE /tasks/:idTask/:idAccount:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error: ' + err.message,
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

app.post('/schedule/generate/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("User ID from Token:", req.user._id);
    const currentDate = new Date();

    console.log(`Generating schedule for User ID: ${id}`);

    // Fetch all unanswered tasks
    const tasks = await userQuery.getUnansweredTasks(id, currentDate);

    if (tasks.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No tasks available for scheduling',
        data: [],
      });
    }

    // Sort tasks by deadline
    const sortedTasks = tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    // Fetch existing schedules
    const existingSchedules = await userQuery.getSchedules(id);

    // Extract task IDs from existing schedules
    const existingTaskIds = new Set(existingSchedules.map(sch => sch.taskId.toString()));
    const currentTaskIds = new Set(sortedTasks.map(task => task._id.toString()));

    // Check if tasks are the same
    const isScheduleUpToDate =
      existingTaskIds.size === currentTaskIds.size &&
      [...currentTaskIds].every(id => existingTaskIds.has(id));

    if (isScheduleUpToDate) {
      // If tasks are the same, return the existing schedule
      return res.status(200).json({
        status: 'success',
        message: 'Schedule is up-to-date. No changes needed.',
        data: existingSchedules,
      });
    }

    // If tasks are different, regenerate the schedule
    console.log('Regenerating schedules...');
    await userQuery.deleteSchedules(id); // Clear existing schedules

    const newSchedules = [];
    let currentDay = new Date(currentDate);

    for (const task of sortedTasks) {
      newSchedules.push({
        taskId: task._id,
        userId: id,
        date: new Date(currentDay),
      });

      // Increment day for the next task
      currentDay = new Date(currentDay.setDate(currentDay.getDate() + 1));
    }

    // Save new schedules to the database
    const createdSchedules = await userQuery.createSchedules(newSchedules);

    res.status(201).json({
      status: 'success',
      message: 'Schedule generated successfully',
      data: createdSchedules,
    });
  } catch (err) {
    console.error('Error POST /schedule/generate:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate schedule: ' + err.message,
    });
  }
});


// GET /schedule - Mendapatkan semua jadwal
app.get('/schedule/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const date = req.query.date ? new Date(req.query.date) : null; // Opsional: Filter berdasarkan tanggal

    console.log(`Fetching schedules for User ID: ${id}, Date: ${date || 'All'}`);

    const schedules = await userQuery.getSchedules(id, date);

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

// DELETE /schedule - Menghapus semua jadwal
app.delete('/schedule/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`Deleting all schedules for User ID: ${id}`);

    await userQuery.deleteSchedules(id);

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

app.delete('/schedule/:scheduleid/:userid/delete', verifyToken, async (req, res) => {
  try {
    const { scheduleid, userid } = req.params;

    console.log("Task ID from URL:", scheduleid); // Log Task ID
    console.log("User ID from URL:", userid); // Log User ID

    console.log(`Deleting schedule with ID: ${scheduleid} for User ID: ${userid}`);

    // Cari dan hapus jadwal berdasarkan ID dan user ID
    const deletedSchedule = await userQuery.deleteScheduleById(scheduleid, userid);

    if (!deletedSchedule) {
      return res.status(404).json({
        status: 'error',
        message: 'Schedule not found or not authorized to delete',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Schedule deleted successfully',
      data: deletedSchedule,
    });
  } catch (err) {
    console.error('Error DELETE /schedule/:id:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete schedule: ' + err.message,
    });
  }
});

app.patch('/schedule/:scheduleid/:userid/update', verifyToken, async (req, res) => {
  try {
    const { scheduleid, userid } = req.params;

    console.log("Schedule ID from URL:", scheduleid); // Log Schedule ID
    console.log("User ID from URL:", userid); // Log User ID

    const { date, taskUpdates } = req.body; // Data baru untuk jadwal dan task terkait

    // Validasi apakah ada data yang dikirimkan
    if (!date && !taskUpdates) {
      return res.status(400).json({
        status: 'error',
        message: 'Either new date or task updates are required to update the schedule',
      });
    }

    console.log(`Updating schedule with ID: ${scheduleid} for User ID: ${userid}`);

    // Cari dan update jadwal berdasarkan ID dan user ID
    const updatedSchedule = await userQuery.updateScheduleById(scheduleid, userid, { date });

    if (!updatedSchedule) {
      return res.status(404).json({
        status: 'error',
        message: 'Schedule not found or not authorized to update',
      });
    }

    // Jika ada pembaruan pada task terkait
    if (taskUpdates) {
      console.log("Updating task with data:", taskUpdates);

      const updatedTask = await userQuery.updateTask(updatedSchedule.taskId, taskUpdates);

      if (!updatedTask) {
        return res.status(404).json({
          status: 'error',
          message: 'Task not found or not authorized to update',
        });
      }

      console.log("Task updated successfully:", updatedTask);
    }

    res.status(200).json({
      status: 'success',
      message: 'Schedule and related task updated successfully',
      data: {
        schedule: updatedSchedule,
      },
    });
  } catch (err) {
    console.error('Error PATCH /schedule/:scheduleid/:userid/update:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update schedule and task: ' + err.message,
    });
  }
});

// Endpoint untuk mengintegrasikan API eksternal
app.post('/external/schedule', verifyToken, async (req, res) => {
  try {
      const { tasks } = req.body;

      // Validasi input tasks
      if (!tasks || tasks.length === 0) {
          return res.status(400).json({
              status: 'error',
              message: 'Tasks are required',
          });
      }

      // Memastikan setiap task memiliki task_name dan deadline
      const invalidTasks = tasks.filter(
          (task) => !task.task_name || !task.deadline
      );
      if (invalidTasks.length > 0) {
          return res.status(400).json({
              status: 'error',
              message: 'One or more tasks have invalid or missing fields: task_name and deadline are required.',
          });
      }

      // Mengirim request ke API eksternal (https://api.taskly.web.id)
      const response = await axios.post('https://api.taskly.web.id/external', {
          tasks,
      });

      // Menangani respon dari API eksternal
      const { scheduledTasks, unscheduledTasks } = response.data;

      res.status(200).json({
          status: 'success',
          message: 'Schedule generated successfully',
          data: {
              scheduledTasks,
              unscheduledTasks,
          },
      });
  } catch (error) {
      console.error('Error in external scheduling:', error);

      // Menangani error dari API eksternal atau sistem
      if (error.response) {
          // Error dari API eksternal
          return res.status(error.response.status).json({
              status: 'error',
              message: error.response.data.message || 'Error from external API',
          });
      }

      res.status(500).json({
          status: 'error',
          message: 'Internal Server Error',
      });
  }
});


app.post('/flashcard/:idAccount', verifyToken, async (req, res) => {
  try {
    const { idAccount } = req.params;
    const { title, description } = req.body;

    console.log("Account ID from URL:", idAccount);
    console.log("User ID from Token:", req.user._id);

    // Create flashcard for the specified account
    const flashcardData = {
      userId: idAccount,
      title,
      description,
      questions: [],
    };

    const newFlashcard = await userQuery.createFlashcard(flashcardData);

    res.status(201).json({
      status: 'success',
      message: 'Flashcard created successfully',
      data: newFlashcard,
    });
  } catch (err) {
    console.error('Error POST /flashcard/:idAccount:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create flashcard: ' + err.message,
    });
  }
});


app.get('/flashcard/:idAccount', verifyToken, async (req, res) => {
  try {
    const { idAccount } = req.params;

    console.log("Account ID from URL:", idAccount);
    console.log("User ID from Token:", req.user._id);

    const flashcards = await userQuery.getFlashcardsByUserId(idAccount);

    res.status(200).json({
      status: 'success',
      message: 'Flashcards fetched successfully',
      data: flashcards,
    });
  } catch (err) {
    console.error('Error GET /flashcard/:idAccount:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch flashcards: ' + err.message,
    });
  }
});

app.delete('/flashcard/:idFlashcard/:idAccount', verifyToken, async (req, res) => {
  try {
    const { idFlashcard, idAccount } = req.params;

    console.log("Flashcard ID from URL:", idFlashcard);
    console.log("Account ID from URL:", idAccount);

    const deletedFlashcard = await userQuery.deleteFlashcardById(idFlashcard, idAccount);

    if (!deletedFlashcard) {
      return res.status(404).json({
        status: 'error',
        message: 'Flashcard not found',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Flashcard deleted successfully',
      data: deletedFlashcard,
    });
  } catch (err) {
    console.error('Error DELETE /flashcard/:idFlashcard/:idAccount:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete flashcard: ' + err.message,
    });
  }
});

app.post('/flashcard/:idFlashcard/:idAccount/addquestion', verifyToken, async (req, res) => {
  try {
    const { idFlashcard, idAccount } = req.params;
    const { question, answer } = req.body;

    console.log("Flashcard ID from URL:", idFlashcard);
    console.log("Account ID from URL:", idAccount);

    const updatedFlashcard = await userQuery.addQuestionToFlashcard(idFlashcard, idAccount, { question, answer });

    res.status(200).json({
      status: 'success',
      message: 'Question added successfully',
      data: updatedFlashcard,
    });
  } catch (err) {
    console.error('Error POST /flashcard/:idFlashcard/:idAccount/addquestion:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add question: ' + err.message,
    });
  }
});

app.get('/flashcard/:idFlashcard/:idAccount/questions', verifyToken, async (req, res) => {
  try {
    const { idFlashcard, idAccount } = req.params;

    console.log("Flashcard ID from URL:", idFlashcard);
    console.log("Account ID from URL:", idAccount);
    console.log("User ID from Token:", req.user._id);

    // Fetch the flashcard to ensure it exists and belongs to the given account
    const flashcard = await userQuery.getFlashcardByIdAndAccountId(idFlashcard, idAccount);

    if (!flashcard) {
      return res.status(404).json({
        status: 'error',
        message: 'Flashcard not found for the specified account',
        data: [],
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Questions fetched successfully',
      data: flashcard.questions,
    });
  } catch (err) {
    console.error('Error GET /flashcard/:idFlashcard/:idAccount/questions:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch questions: ' + err.message,
    });
  }
});



app.delete('/flashcard/:idQuestion/:idFlashcard/:idAccount', verifyToken, async (req, res) => {
  try {
    const { idQuestion, idFlashcard, idAccount } = req.params;

    console.log("Question ID from URL:", idQuestion);
    console.log("Flashcard ID from URL:", idFlashcard);
    console.log("Account ID from URL:", idAccount);

    const updatedFlashcard = await userQuery.deleteQuestionFromFlashcard(idFlashcard, idAccount, idQuestion);

    res.status(200).json({
      status: 'success',
      message: 'Question deleted successfully',
      data: updatedFlashcard,
    });
  } catch (err) {
    console.error('Error DELETE /flashcard/:idQuestion/:idFlashcard/:idAccount:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete question: ' + err.message,
    });
  }
});

app.patch('/flashcard/:idFlashcard/:idAccount', verifyToken, async (req, res) => {
  try {
    const { idFlashcard, idAccount } = req.params;
    const { title, description } = req.body;

    console.log("Flashcard ID from URL:", idFlashcard);
    console.log("Account ID from URL:", idAccount);

    const updatedFlashcard = await userQuery.updateFlashcard(idFlashcard, idAccount, { title, description });

    res.status(200).json({
      status: 'success',
      message: 'Flashcard updated successfully',
      data: updatedFlashcard,
    });
  } catch (err) {
    console.error('Error PATCH /flashcard/:idFlashcard/:idAccount:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update flashcard: ' + err.message,
    });
  }
});


// app.get('/', function(req, res){
//   res.sendFile(__dirname + '/documentation.html');
// });

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the public route!' });
});
