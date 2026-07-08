import mongoose from 'mongoose';
import { ACADEMIC_STATUSES } from '../constants/academicHierarchy.constants.js';

const courseSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: Object.values(ACADEMIC_STATUSES),
      default: ACADEMIC_STATUSES.ACTIVE
    },
    evaluator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
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

courseSchema.index({ evaluator: 1, status: 1 });
courseSchema.index({ evaluator: 1, name: 1 });

export const Course = mongoose.model('Course', courseSchema);
