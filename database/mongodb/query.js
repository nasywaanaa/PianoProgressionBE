const mongoose = require("mongoose");
const schema = require("./schema");
const bcrypt = require("bcrypt");

const Users = mongoose.model("User", schema.userSchema);
const Schedule = mongoose.model("Schedule", schema.scheduleSchema);
const Task = mongoose.model("Task", schema.taskSchema);
const Question = mongoose.model("Question", schema.questionSchema);
const Flashcard = mongoose.model("Flashcard", schema.flashcardSchema);

async function getUsers() {
    return Users.find();
}

async function createUser(user) {
    user.password = await bcrypt.hash(user.password, 10);
    return Users.create(user);
}

async function updateUser(id, user) {
    return Users.findByIdAndUpdate(id, user, { new: true });
}

async function deleteUser(id) {
    return Users.findByIdAndDelete(id);
}

async function findByName(name) {
    return Users.find({ name: name });
}

async function findOneByEmail(email) {
    return Users.findOne({ email: email });
}


// Fungsi untuk mendapatkan task berdasarkan ID
async function getTaskById(id) {
    // Validasi apakah ID valid sebagai ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid task ID");
    }
  
    // Query database untuk mendapatkan task berdasarkan ID
    return Task.findById(id).populate("userId"); // Tambahkan populate jika userId adalah referensi
  }
  
  // Fungsi untuk membuat task baru
  async function createTask(task) {
    return Task.create(task);
  }
  
  // Fungsi untuk mendapatkan semua task milik user tertentu
  async function getTasks(userId) {
    return Task.find({ userId }).sort({ createdAt: -1 }); // Urutkan dari yang terbaru
  }
  
  // Fungsi untuk menghapus task berdasarkan ID
  async function deleteTask(taskId) {
    return Task.findByIdAndDelete(taskId);
  }
  
  // Fungsi untuk memperbarui task berdasarkan ID
  async function updateTask(taskId, updates) {
    return Task.findByIdAndUpdate(taskId, updates, { new: true });
  }

  // Fungsi untuk mendapatkan semua task berdasarkan account ID (userId)
  async function getTasksByAccountId(accountId) {
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      throw new Error("Invalid account ID");
    }
  
    return Task.find({ userId: accountId }).sort({ createdAt: -1 }); // Urutkan berdasarkan tanggal pembuatan
  }

  async function updateTaskStatusById(taskId, userId) {
    return Task.findOneAndUpdate(
      { _id: taskId, userId: userId },
      { $set: { status: 'submitted' } },
      { new: true } 
    );
  }  
  
  async function resetTaskStatusById(taskId, userId) {
    return Task.findOneAndUpdate(
      { _id: taskId, userId: userId, status: 'submitted' }, // Cari task berdasarkan kondisi
      { $set: { status: 'unanswered' } }, // Perbarui status menjadi "unanswered"
      { new: true } // Kembalikan dokumen yang sudah diperbarui
    );
  }

  async function getUnansweredTasks(userId, currentDate) {
    return Task.find({
      userId: userId, // Task milik user tertentu
      status: 'unanswered', // Status task harus unanswered
      deadline: { $gte: currentDate }, // Deadline belum lewat
    }).sort({ deadline: 1 }); // Urutkan berdasarkan deadline terdekat
  }

  async function deleteTaskByIdAndAccount(taskId, accountId) {
    return Task.findOneAndDelete({
      _id: taskId,
      userId: accountId, // Ensure the task belongs to the specified account
    });
  }  

  async function createSchedules(schedules) {
    return Schedule.insertMany(schedules); // Menyimpan array schedule ke database
  }

  async function getSchedules(userId, date = null) {
    const filter = { userId: userId }; // Filter untuk user tertentu
    if (date) {
      filter.date = date; // Tambahkan filter tanggal jika diberikan
    }
    return Schedule.find(filter).sort({ date: 1 }); // Urutkan berdasarkan tanggal
  }

  async function deleteSchedules(userId) {
    return Schedule.deleteMany({ userId: userId }); // Hapus semua jadwal untuk user tertentu
  }
  
  async function deleteScheduleById(scheduleId, userId) {
    return Schedule.findOneAndDelete({
      _id: scheduleId,
      userId: userId, // Pastikan hanya user terkait yang dapat menghapus
    });
  }

  async function updateScheduleById(scheduleId, userId, updateData) {
    return Schedule.findOneAndUpdate(
      {
        _id: scheduleId,
        userId: userId, // Pastikan hanya user terkait yang dapat mengubah
      },
      { $set: updateData }, // Perubahan data (misalnya, tanggal baru)
      { new: true } // Return jadwal yang sudah diperbarui
    );
  }  

  async function createFlashcard(flashcardData) {
    return Flashcard.create(flashcardData);
  }

  async function getFlashcardsByUserId(userId) {
    return Flashcard.find({ userId: userId }).sort({ createdAt: -1 }); // Urutkan berdasarkan waktu pembuatan
  }

  async function deleteFlashcardById(flashcardId, userId) {
    return Flashcard.findOneAndDelete({ _id: flashcardId, userId: userId });
  }

  async function addQuestionToFlashcard(flashcardId, userId, questionData) {
    return Flashcard.findOneAndUpdate(
      { _id: flashcardId, userId: userId },
      { $push: { questions: questionData } },
      { new: true }
    );
  }

  async function deleteQuestionFromFlashcard(flashcardId, userId, questionId) {
    return Flashcard.findOneAndUpdate(
      { _id: flashcardId, userId: userId },
      { $pull: { questions: { _id: questionId } } },
      { new: true }
    );
  }

  async function updateFlashcard(flashcardId, userId, updateData) {
    return Flashcard.findOneAndUpdate(
      { _id: flashcardId, userId: userId },
      { $set: updateData },
      { new: true }
    );
  }

  async function updateQuestionInFlashcard(flashcardId, userId, questionId, updateData) {
    return Flashcard.findOneAndUpdate(
      { _id: flashcardId, userId: userId, 'questions._id': questionId },
      { $set: { 'questions.$': updateData } },
      { new: true }
    );
  }

  async function getFlashcardByIdAndAccountId(flashcardId, accountId) {
    try {
      return await Flashcard.findOne({ _id: flashcardId, userId: accountId });
    } catch (err) {
      console.error('Error fetching flashcard by ID and Account ID:', err);
      throw err;
    }
  }
  

  
  
  
module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    findByName,
    findOneByEmail,
    findOneByEmail,
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    getTaskById,
    getTasksByAccountId,
    updateTaskStatusById,
    resetTaskStatusById,
    getUnansweredTasks,
    deleteTaskByIdAndAccount,
    createSchedules,
    getSchedules,
    deleteSchedules,
    deleteScheduleById,
    updateScheduleById,
    createFlashcard,
    getFlashcardsByUserId,
    deleteFlashcardById,
    addQuestionToFlashcard,
    deleteQuestionFromFlashcard,
    updateFlashcard,
    updateQuestionInFlashcard,
    getFlashcardByIdAndAccountId,
    // generateSchedule,
    // getSchedules,
    // deleteSchedules,
};