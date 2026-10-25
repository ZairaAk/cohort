import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const requestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    subject: { type: String, required: true, trim: true, lowercase: true, maxlength: 40, index: true },
    description: { type: String, default: '', maxlength: 500 },
    weeklyGoalMinutes: { type: Number, default: 300 },
    members: { type: [memberSchema], default: [] },
    joinRequests: { type: [requestSchema], default: [] },
  },
  { timestamps: true }
);

groupSchema.index({ 'members.user': 1 });

export const Group = mongoose.model('Group', groupSchema);
