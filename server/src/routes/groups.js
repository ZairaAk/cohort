import { Router } from 'express';
import mongoose from 'mongoose';
import { Group } from '../models/Group.js';
import { User } from '../models/User.js';
import { Resource } from '../models/Resource.js';
import { StudyLog } from '../models/StudyLog.js';
import { validate } from '../middleware/validate.js';
import { loadGroup, requireMember, requireOwner, isMember } from '../middleware/groupAccess.js';
import { groupCreateSchema, groupListQuery, resourceSchema } from '../validators/index.js';
import { asyncHandler, badRequest, conflict, forbidden, notFound } from '../utils/errors.js';
import { weekStart } from '../utils/time.js';

const router = Router();
router.param('id', loadGroup);

const summary = (g, userId) => ({
  id: String(g._id),
  name: g.name,
  subject: g.subject,
  description: g.description,
  weeklyGoalMinutes: g.weeklyGoalMinutes,
  memberCount: g.members.length,
  isMember: isMember(g, userId),
  hasRequested: g.joinRequests.some((r) => String(r.user) === String(userId)),
});

router.post(
  '/',
  validate(groupCreateSchema),
  asyncHandler(async (req, res) => {
    const group = await Group.create({
      ...req.body,
      members: [{ user: req.userId, role: 'owner' }],
    });
    res.status(201).json({ group: summary(group, req.userId) });
  })
);

router.get(
  '/',
  validate(groupListQuery, 'query'),
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.mine === 'true') filter['members.user'] = req.userId;
    const groups = await Group.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json({ groups: groups.map((g) => summary(g, req.userId)) });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const g = req.group;
    const base = summary(g, req.userId);
    if (!base.isMember) return res.json({ group: base });

    const populated = await Group.findById(g._id)
      .populate('members.user', 'name reputation')
      .populate('joinRequests.user', 'name');
    const owner = populated.members.find((m) => String(m.user._id) === String(req.userId))?.role === 'owner';

    res.json({
      group: {
        ...base,
        isOwner: owner,
        members: populated.members.map((m) => ({
          userId: String(m.user._id),
          name: m.user.name,
          reputation: m.user.reputation,
          role: m.role,
        })),
        joinRequests: owner
          ? populated.joinRequests.map((r) => ({ userId: String(r.user._id), name: r.user.name }))
          : [],
      },
    });
  })
);

router.post(
  '/:id/join-requests',
  asyncHandler(async (req, res) => {
    const g = req.group;
    if (isMember(g, req.userId)) throw conflict('You are already a member');
    if (g.joinRequests.some((r) => String(r.user) === req.userId)) {
      throw conflict('You already requested to join');
    }
    g.joinRequests.push({ user: req.userId });
    await g.save();
    res.status(201).json({ ok: true });
  })
);

router.post(
  '/:id/join-requests/:userId/approve',
  requireOwner,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const g = req.group;
    const idx = g.joinRequests.findIndex((r) => String(r.user) === userId);
    if (idx === -1) throw notFound('No such join request');
    g.joinRequests.splice(idx, 1);
    if (!isMember(g, userId)) g.members.push({ user: userId, role: 'member' });
    await g.save();
    res.json({ ok: true });
  })
);

router.post(
  '/:id/join-requests/:userId/reject',
  requireOwner,
  asyncHandler(async (req, res) => {
    const g = req.group;
    const before = g.joinRequests.length;
    g.joinRequests = g.joinRequests.filter((r) => String(r.user) !== req.params.userId);
    if (g.joinRequests.length === before) throw notFound('No such join request');
    await g.save();
    res.json({ ok: true });
  })
);

router.delete(
  '/:id/members/me',
  requireMember,
  asyncHandler(async (req, res) => {
    const g = req.group;
    const me = g.members.find((m) => String(m.user) === req.userId);
    if (me.role === 'owner') throw badRequest('Owners cannot leave their own group');
    g.members = g.members.filter((m) => String(m.user) !== req.userId);
    await g.save();
    res.json({ ok: true });
  })
);

// Weekly progress: total focus minutes vs goal, plus a per-member leaderboard.
router.get(
  '/:id/stats',
  requireMember,
  asyncHandler(async (req, res) => {
    const since = weekStart();
    const rows = await StudyLog.aggregate([
      { $match: { group: req.group._id, createdAt: { $gte: since } } },
      { $group: { _id: '$user', minutes: { $sum: '$minutes' } } },
      { $sort: { minutes: -1 } },
    ]);
    const users = await User.find({ _id: { $in: rows.map((r) => r._id) } }).select('name streak');
    const byId = new Map(users.map((u) => [String(u._id), u]));
    const leaderboard = rows.map((r) => ({
      userId: String(r._id),
      name: byId.get(String(r._id))?.name ?? 'Former member',
      streak: byId.get(String(r._id))?.streak?.count ?? 0,
      minutes: r.minutes,
    }));
    res.json({
      weekStart: since.toISOString(),
      goalMinutes: req.group.weeklyGoalMinutes,
      totalMinutes: leaderboard.reduce((s, r) => s + r.minutes, 0),
      leaderboard,
    });
  })
);

// Resources are visible and writable only to group members.
router.get(
  '/:id/resources',
  requireMember,
  asyncHandler(async (req, res) => {
    const items = await Resource.find({ group: req.group._id }).sort({ createdAt: -1 }).populate('uploader', 'name');
    res.json({
      resources: items.map((r) => ({
        id: String(r._id),
        title: r.title,
        url: r.url,
        uploaderId: String(r.uploader._id),
        uploaderName: r.uploader.name,
        createdAt: r.createdAt,
      })),
    });
  })
);

router.post(
  '/:id/resources',
  requireMember,
  validate(resourceSchema),
  asyncHandler(async (req, res) => {
    const r = await Resource.create({ ...req.body, group: req.group._id, uploader: req.userId });
    res.status(201).json({ resource: { id: String(r._id), title: r.title, url: r.url } });
  })
);

router.delete(
  '/:id/resources/:resourceId',
  requireMember,
  asyncHandler(async (req, res) => {
    const { resourceId } = req.params;
    if (!mongoose.isValidObjectId(resourceId)) throw notFound('Resource not found');
    const r = await Resource.findOne({ _id: resourceId, group: req.group._id });
    if (!r) throw notFound('Resource not found');
    const ownsGroup = req.group.members.some((m) => String(m.user) === req.userId && m.role === 'owner');
    if (String(r.uploader) !== req.userId && !ownsGroup) {
      throw forbidden('Only the uploader or group owner can delete this');
    }
    await r.deleteOne();
    res.json({ ok: true });
  })
);

export default router;
