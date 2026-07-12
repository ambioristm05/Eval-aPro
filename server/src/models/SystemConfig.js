import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'system',
      unique: true,
      immutable: true,
    },
    institutionName: {
      type: String,
      trim: true,
      default: '',
    },
    evaluatorRegistrationOpen: {
      type: Boolean,
      default: false,
    },
    invitationExpiryDays: {
      type: Number,
      min: 1,
      max: 90,
      default: 7,
    },
    minPassingGrade: {
      type: Number,
      min: 0,
      max: 100,
      default: 60,
    },
    studentPrintDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { transform(doc, ret) { delete ret.__v; return ret; } },
  }
);

export const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
