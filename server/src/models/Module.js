import mongoose from 'mongoose';
import { ACADEMIC_STATUSES } from '../constants/academicHierarchy.constants.js';

const moduleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: Object.values(ACADEMIC_STATUSES),
      default: ACADEMIC_STATUSES.ACTIVE
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    evaluator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    order: {
      type: Number,
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

moduleSchema.index({ evaluator: 1, course: 1, status: 1 });
moduleSchema.index({ course: 1, order: 1 });

export const Module = mongoose.model('Module', moduleSchema);
