import mongoose from 'mongoose';
import { GROUP_STATUSES } from '../constants/group.constants.js';

const groupSchema = new mongoose.Schema(
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
    evaluator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    status: {
      type: String,
      enum: Object.values(GROUP_STATUSES),
      default: GROUP_STATUSES.ACTIVE
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

groupSchema.index({ evaluator: 1, name: 1 });
groupSchema.index({ status: 1 });

export const Group = mongoose.model('Group', groupSchema);
