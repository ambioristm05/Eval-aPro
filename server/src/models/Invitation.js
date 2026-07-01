import mongoose from 'mongoose';
import { USER_ROLES } from '../constants/user.constants.js';

const invitationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    role: {
      type: String,
      enum: [USER_ROLES.EVALUATOR],
      required: true
    },
    token: {
      type: String,
      required: true,
      unique: true,
      select: false
    },
    used: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      required: true
    },
    usedAt: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

invitationSchema.index({ email: 1, role: 1, used: 1 });
invitationSchema.index({ expiresAt: 1 });

export const Invitation = mongoose.model('Invitation', invitationSchema);
