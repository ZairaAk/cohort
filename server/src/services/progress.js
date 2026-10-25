import { StudyLog } from '../models/StudyLog.js';
import { User } from '../models/User.js';
import { nextStreak } from './streak.js';
import { dayKey } from '../utils/time.js';

// Called when a focus session finishes, once per member who was in the room.
export async function recordFocusSession(userId, groupId, minutes) {
  await StudyLog.create({ user: userId, group: groupId, minutes });
  const user = await User.findById(userId).select('streak');
  if (!user) return;
  const updated = nextStreak(user.streak, dayKey());
  await User.updateOne({ _id: userId }, { $set: { streak: updated } });
}
