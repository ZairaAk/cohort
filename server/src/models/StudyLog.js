import mongoose from 'mongoose';

// One row per completed focus session per member. Feeds weekly progress and streaks.
const studyLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    minutes: { type: Number, required: true, min: 1 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

studyLogSchema.index({ group: 1, createdAt: -1 });

export const StudyLog = mongoose.model('StudyLog', studyLogSchema);
