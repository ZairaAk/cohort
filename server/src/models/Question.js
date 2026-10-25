import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const questionSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // null = public question, otherwise visible only to members of that group
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null, index: true },
    subject: { type: String, required: true, trim: true, lowercase: true, maxlength: 40, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    answers: { type: [answerSchema], default: [] },
    acceptedAnswer: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

export const Question = mongoose.model('Question', questionSchema);
