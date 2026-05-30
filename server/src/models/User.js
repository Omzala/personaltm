import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      default: null
    },
    authProviders: {
      type: [String],
      enum: ['local', 'google'],
      default: []
    },
    googleId: {
      type: String,
      default: null
    },
    role: {
      type: String,
      trim: true,
      default: ''
    },
    department: {
      type: String,
      trim: true,
      default: ''
    },
    seniority: {
      type: String,
      enum: ['Intern', 'Junior', 'Mid-level', 'Senior', 'Lead', 'Manager'],
      default: 'Junior'
    },
    overallTasks: {
      type: [String],
      default: []
    },
    professionalQuestion: {
      type: String,
      trim: true,
      default: ''
    },
    keyResponsibility: {
      type: String,
      trim: true,
      default: ''
    },
    tools: {
      type: [String],
      default: []
    },
    managerExpectations: {
      type: String,
      trim: true,
      default: ''
    },
    reportTone: {
      type: String,
      enum: ['Professional', 'Detailed', 'Concise', 'Impact-focused'],
      default: 'Professional'
    },
    isOnboarded: {
      type: Boolean,
      default: false
    },
    reportColumns: {
      type: [String],
      default: []
    },
    reportDraft: {
      reportDate: {
        type: String,
        trim: true,
        default: ''
      },
      entries: {
        type: [Object],
        default: []
      },
      generatedReport: {
        type: String,
        default: ''
      },
      selectedReportId: {
        type: String,
        trim: true,
        default: ''
      }
    }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
