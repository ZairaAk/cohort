import { Router } from 'express';
import { User, publicUser } from '../models/User.js';
import { validate } from '../middleware/validate.js';
import { profileSchema } from '../validators/index.js';
import { asyncHandler, notFound } from '../utils/errors.js';

const router = Router();

router.put(
  '/me',
  validate(profileSchema),
  asyncHandler(async (req, res) => {
    const { name, subjects, availability } = req.body;
    const update = { subjects, availability };
    if (name) update.name = name;
    const user = await User.findByIdAndUpdate(req.userId, update, { new: true, runValidators: true });
    if (!user) throw notFound('Account no longer exists');
    res.json({ user: publicUser(user) });
  })
);

export default router;
