import mongoose from 'mongoose';
import { Group } from '../models/Group.js';
import { asyncHandler, forbidden, notFound } from '../utils/errors.js';

export const isMember = (group, userId) => group.members.some((m) => String(m.user) === String(userId));
export const isOwner = (group, userId) =>
  group.members.some((m) => String(m.user) === String(userId) && m.role === 'owner');

// router.param handler: loads req.group or 404s.
export const loadGroup = asyncHandler(async (req, _res, next, id) => {
  if (!mongoose.isValidObjectId(id)) throw notFound('Group not found');
  const group = await Group.findById(id);
  if (!group) throw notFound('Group not found');
  req.group = group;
  next();
});

export function requireMember(req, _res, next) {
  if (!isMember(req.group, req.userId)) return next(forbidden('Join this group to access this'));
  next();
}

export function requireOwner(req, _res, next) {
  if (!isOwner(req.group, req.userId)) return next(forbidden('Only the group owner can do that'));
  next();
}
