import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User, publicUser } from '../models/User.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { registerSchema, loginSchema } from '../validators/index.js';
import { asyncHandler, conflict, unauthorized, notFound } from '../utils/errors.js';
import { signToken } from '../utils/jwt.js';

const router = Router();

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (await User.exists({ email })) throw conflict('An account with this email already exists');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  })
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+passwordHash');
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) throw unauthorized('Invalid email or password');
    res.json({ token: signToken(user._id), user: publicUser(user) });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw notFound('Account no longer exists');
    res.json({ user: publicUser(user) });
  })
);

export default router;
