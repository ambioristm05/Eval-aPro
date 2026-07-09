import mongoose from 'mongoose';
import { TASK_STATUSES } from '../constants/task.constants.js';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: Object.values(TASK_STATUSES),
      default: TASK_STATUSES.PENDING
    },
    evaluator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true
    },
    groups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
      }
    ],
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    instrument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Instrument'
    },
    dueDate: Date,
    weight: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

taskSchema.index({ evaluator: 1, status: 1 });
taskSchema.index({ evaluator: 1, class: 1, status: 1 });
taskSchema.index({ class: 1, dueDate: 1 });
taskSchema.index({ groups: 1 });
taskSchema.index({ students: 1 });
taskSchema.index({ dueDate: 1 });

export const Task = mongoose.model('Task', taskSchema);
