import mongoose from 'mongoose';
import { EVALUATION_STATUSES } from '../constants/evaluation.constants.js';

const answerSchema = new mongoose.Schema(
  {
    criterion: {
      type: mongoose.Schema.Types.ObjectId
    },
    indicator: {
      type: mongoose.Schema.Types.ObjectId
    },
    levelName: {
      type: String,
      trim: true
    },
    value: mongoose.Schema.Types.Mixed,
    score: {
      type: Number,
      min: 0,
      default: 0
    },
    observation: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: true }
);

const evaluationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    evaluator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true
    },
    instrument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Instrument',
      required: true
    },
    answers: {
      type: [answerSchema],
      default: []
    },
    score: {
      type: Number,
      min: 0,
      default: 0
    },
    maxScore: {
      type: Number,
      min: 0,
      default: 0
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    feedback: {
      type: String,
      trim: true,
      default: ''
    },
    suggestions: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: Object.values(EVALUATION_STATUSES),
      default: EVALUATION_STATUSES.DRAFT
    },
    studentReportEnabled: {
      type: Boolean,
      default: false
    },
    evaluatedAt: Date,
    publishedAt: Date
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

evaluationSchema.index({ evaluator: 1, student: 1, task: 1 }, { unique: true });
evaluationSchema.index({ student: 1, status: 1 });
evaluationSchema.index({ task: 1 });

export const Evaluation = mongoose.model('Evaluation', evaluationSchema);
