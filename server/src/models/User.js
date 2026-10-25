import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, lowercase: true, maxlength: 40 },
    level: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false }
);

const slotSchema = new mongoose.Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 }, // 0 = Sunday
    startMin: { type: Number, required: true, min: 0, max: 1439 },
    endMin: { type: Number, required: true, min: 1, max: 1440 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    subjects: { type: [subjectSchema], default: [] },
    availability: { type: [slotSchema], default: [] },
    reputation: { type: Number, default: 0 },
    streak: {
      count: { type: Number, default: 0 },
      lastDay: { type: String, default: null }, // YYYY-MM-DD (UTC)
    },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);

export function publicUser(u) {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    subjects: u.subjects,
    availability: u.availability,
    reputation: u.reputation,
    streak: u.streak,
  };
}
