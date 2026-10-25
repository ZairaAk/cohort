import { Router } from 'express';
import { User } from '../models/User.js';
import { rankMatches } from '../services/matching.js';
import { asyncHandler, notFound } from '../utils/errors.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const me = await User.findById(req.userId).lean();
    if (!me) throw notFound('Account no longer exists');

    const profileReady = me.subjects?.length > 0 && me.availability?.length > 0;
    if (!profileReady) return res.json({ profileReady: false, matches: [] });

    const candidates = await User.find({
      _id: { $ne: me._id },
      'subjects.0': { $exists: true },
      'availability.0': { $exists: true },
    })
      .select('name subjects availability reputation')
      .limit(500)
      .lean();

    const matches = rankMatches(me, candidates).map((m) => ({
      userId: String(m.user._id),
      name: m.user.name,
      reputation: m.user.reputation,
      subjects: m.user.subjects,
      score: m.score,
      sharedSubjects: m.sharedSubjects,
      overlapMinutes: m.overlapMinutes,
    }));

    res.json({ profileReady: true, matches });
  })
);

export default router;
