import mongoose from 'mongoose';

const reportEntrySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: ''
    },
    time: {
      type: String,
      required: true,
      trim: true
    },
    task: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      trim: true,
      default: 'Not started'
    },
    priority: {
      type: String,
      trim: true,
      default: 'Medium'
    },
    category: {
      type: String,
      trim: true,
      default: 'Execution'
    },
    impact: {
      type: String,
      trim: true,
      default: ''
    },
    blocker: {
      type: String,
      trim: true,
      default: ''
    },
    nextStep: {
      type: String,
      trim: true,
      default: ''
    },
    dueDate: {
      type: String,
      trim: true,
      default: ''
    },
    subtasks: {
      type: [
        {
          title: {
            type: String,
            trim: true,
            default: ''
          },
          done: {
            type: Boolean,
            default: false
          }
        }
      ],
      default: []
    }
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reportDate: {
      type: String,
      required: true
    },
    entries: {
      type: [reportEntrySchema],
      default: []
    },
    generatedReport: {
      type: String,
      default: ''
    },
    columns: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

export const Report = mongoose.model('Report', reportSchema);
