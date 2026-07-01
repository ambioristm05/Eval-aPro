import mongoose from 'mongoose';
import { INSTRUMENT_STATUSES, INSTRUMENT_TYPES } from '../constants/instrument.constants.js';

const levelSchema = new mongoose.Schema(
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
    score: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const criterionSchema = new mongoose.Schema(
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
    maxScore: {
      type: Number,
      required: true,
      min: 0
    },
    levels: {
      type: [levelSchema],
      default: []
    }
  },
  { _id: true }
);

const indicatorSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true
    },
    score: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  { _id: true }
);

const instrumentSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: Object.values(INSTRUMENT_TYPES),
      required: true
    },
    criteria: {
      type: [criterionSchema],
      default: []
    },
    indicators: {
      type: [indicatorSchema],
      default: []
    },
    maxScore: {
      type: Number,
      min: 0,
      default: 0
    },
    evaluator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: Object.values(INSTRUMENT_STATUSES),
      default: INSTRUMENT_STATUSES.DRAFT
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

instrumentSchema.pre('validate', function calculateMaxScore() {
  const criteriaTotal = this.criteria.reduce((sum, criterion) => sum + Number(criterion.maxScore || 0), 0);
  const indicatorTotal = this.indicators.reduce((sum, indicator) => sum + Number(indicator.score || 0), 0);
  this.maxScore = Math.max(criteriaTotal, indicatorTotal, Number(this.maxScore || 0));
});

instrumentSchema.index({ evaluator: 1, status: 1 });
instrumentSchema.index({ type: 1 });
instrumentSchema.index({ title: 'text', description: 'text' });

export const Instrument = mongoose.model('Instrument', instrumentSchema);
