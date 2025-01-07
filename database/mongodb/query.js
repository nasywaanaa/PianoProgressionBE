const mongoose = require("mongoose");
const schema = require("./schema");
const bcrypt = require("bcrypt");

const Users = mongoose.model("User", schema.userSchema);
const Schedule = mongoose.model("Schedule", schema.scheduleSchema);
const Task = mongoose.model("Task", schema.taskSchema);

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
    resetTaskStatusById
    // generateSchedule,
    // getSchedules,
    // deleteSchedules,
};