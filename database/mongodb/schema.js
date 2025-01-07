const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  isAdmin: { type: Boolean, default: false }
});

// Task Schema
const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  writer: { type: String, required: true },
  deadline: { type: Date, required: true },
  grade: { type: String, required: false },
  additionalMaterial: { type: String, required: false },
  notes: { type: String, required: false },
  status: { type: String, enum: ['unanswered', 'submitted'], default: 'unanswered' },
  createdAt: { type: Date, default: Date.now },
});

// Schedule Schema
const scheduleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  date: { type: Date, required: true },
});

module.exports = {
  userSchema,
  taskSchema,
  scheduleSchema,
};