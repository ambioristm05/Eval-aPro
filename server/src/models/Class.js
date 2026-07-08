import mongoose from 'mongoose';
import { ACADEMIC_STATUSES } from '../constants/academicHierarchy.constants.js';

const classSchema = new mongoose.Schema(
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
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true
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

classSchema.index({ evaluator: 1, course: 1, module: 1, status: 1 });
classSchema.index({ module: 1, order: 1 });

export const Class = mongoose.model('Class', classSchema);
