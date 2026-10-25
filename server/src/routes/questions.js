import { Router } from 'express';
import mongoose from 'mongoose';
import { Question } from '../models/Question.js';
import { Group } from '../models/Group.js';
import { validate } from '../middleware/validate.js';
import { isMember } from '../middleware/groupAccess.js';
import {
  questionCreateSchema,
  questionListQuery,
  answerSchema,
} from '../validators/index.js';
import { asyncHandler, forbidden, notFound } from '../utils/errors.js';
import { acceptAnswer } from '../services/reputation.js';

const router = Router();

async function assertGroupAccess(groupId, userId) {
  const group = await Group.findById(groupId).select('members');
  if (!group) throw notFound('Group not found');
  if (!isMember(group, userId)) throw forbidden('Join this group to access its questions');
}

const shapeQuestion = (q) => ({
  id: String(q._id),
  title: q.title,
  body: q.body,
  subject: q.subject,
  groupId: q.group ? String(q.group) : null,
  author: { id: String(q.author._id), name: q.author.name, reputation: q.author.reputation },
  answerCount: q.answers.length,
  accepted: Boolean(q.acceptedAnswer),
  acceptedAnswer: q.acceptedAnswer ? String(q.acceptedAnswer) : null,
  createdAt: q.createdAt,
});

router.get(
  '/',
  validate(questionListQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { subject, groupId } = req.query;
    const filter = {};
    if (groupId) {
      await assertGroupAccess(groupId, req.userId);
      filter.group = groupId;
    } else {
      filter.group = null; // public feed never includes group-private questions
    }
    if (subject) filter.subject = subject;
    const questions = await Question.find(filter).sort({ createdAt: -1 }).limit(50).populate('author', 'name reputation');
    res.json({ questions: questions.map(shapeQuestion) });
  })
);

router.post(
  '/',
  validate(questionCreateSchema),
  asyncHandler(async (req, res) => {
    const { groupId, ...rest } = req.body;
    if (groupId) await assertGroupAccess(groupId, req.userId);
    const q = await Question.create({ ...rest, group: groupId || null, author: req.userId });
    res.status(201).json({ id: String(q._id) });
  })
);

async function loadQuestion(req) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw notFound('Question not found');
  const q = await Question.findById(id)
    .populate('author', 'name reputation')
    .populate('answers.author', 'name reputation');
  if (!q) throw notFound('Question not found');
  if (q.group) await assertGroupAccess(q.group, req.userId);
  return q;
}

const shapeDetail = (q, userId) => ({
  ...shapeQuestion(q),
  canAccept: String(q.author._id) === String(userId),
  answers: q.answers.map((a) => ({
    id: String(a._id),
    body: a.body,
    createdAt: a.createdAt,
    author: { id: String(a.author._id), name: a.author.name, reputation: a.author.reputation },
    isAccepted: String(q.acceptedAnswer) === String(a._id),
  })),
});

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const q = await loadQuestion(req);
    res.json({ question: shapeDetail(q, req.userId) });
  })
);

router.post(
  '/:id/answers',
  validate(answerSchema),
  asyncHandler(async (req, res) => {
    const q = await loadQuestion(req);
    q.answers.push({ author: req.userId, body: req.body.body });
    await q.save();
    res.status(201).json({ ok: true });
  })
);

router.post(
  '/:id/accept/:answerId',
  asyncHandler(async (req, res) => {
    const q = await loadQuestion(req);
    await acceptAnswer(q, req.params.answerId, req.userId);
    res.json({ ok: true });
  })
);

export default router;
