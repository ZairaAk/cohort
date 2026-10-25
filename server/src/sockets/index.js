import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { Group } from '../models/Group.js';
import { RoomTimers } from '../services/roomTimer.js';
import { recordFocusSession } from '../services/progress.js';

const roomName = (groupId) => `group:${groupId}`;

export function initSockets(httpServer) {
  const io = new Server(httpServer, { cors: { origin: env.clientOrigin } });

  // groupId -> Map(userId -> { name, sockets:Set<socketId> })
  const presence = new Map();

  const presenceList = (groupId) =>
    [...(presence.get(groupId)?.entries() ?? [])].map(([userId, p]) => ({ userId, name: p.name }));

  const stateOf = (groupId) => ({ timer: timers.get(groupId), presence: presenceList(groupId) });
  const broadcast = (groupId) => io.to(roomName(groupId)).emit('room:state', stateOf(groupId));

  const timers = new RoomTimers({
    onChange: broadcast,
    onFocusComplete: (groupId, minutes) => {
      // Everyone who stayed in the room through the focus block gets credit.
      for (const userId of presence.get(groupId)?.keys() ?? []) {
        recordFocusSession(userId, groupId, minutes).catch((err) =>
          console.error('Failed to record focus session', err)
        );
      }
    },
  });

  function removePresence(socket) {
    const { groupId, user } = socket.data;
    if (!groupId) return;
    const room = presence.get(groupId);
    const entry = room?.get(user.id);
    if (entry) {
      entry.sockets.delete(socket.id);
      if (entry.sockets.size === 0) room.delete(user.id);
      if (room.size === 0) presence.delete(groupId);
    }
    socket.leave(roomName(groupId));
    socket.data.groupId = null;
    socket.data.role = null;
    broadcast(groupId);
  }

  io.use(async (socket, next) => {
    try {
      const userId = verifyToken(socket.handshake.auth?.token);
      const user = await User.findById(userId).select('name');
      if (!user) return next(new Error('unauthorized'));
      socket.data.user = { id: String(user._id), name: user.name };
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const reply = (ack, payload) => typeof ack === 'function' && ack(payload);

    socket.on('room:join', async ({ groupId } = {}, ack) => {
      try {
        if (!mongoose.isValidObjectId(groupId)) return reply(ack, { ok: false, error: 'Invalid group' });
        const group = await Group.findById(groupId).select('members');
        const me = group?.members.find((m) => String(m.user) === socket.data.user.id);
        if (!group) return reply(ack, { ok: false, error: 'Group not found' });
        if (!me) return reply(ack, { ok: false, error: 'Join this group to enter its room' });

        if (socket.data.groupId) removePresence(socket);

        const id = String(group._id);
        socket.data.groupId = id;
        socket.data.role = me.role;
        socket.join(roomName(id));
        if (!presence.has(id)) presence.set(id, new Map());
        const room = presence.get(id);
        const entry = room.get(socket.data.user.id) ?? { name: socket.data.user.name, sockets: new Set() };
        entry.sockets.add(socket.id);
        room.set(socket.data.user.id, entry);

        broadcast(id);
        reply(ack, { ok: true, state: stateOf(id) });
      } catch (err) {
        console.error(err);
        reply(ack, { ok: false, error: 'Could not join the room' });
      }
    });

    socket.on('room:leave', () => removePresence(socket));

    socket.on('timer:start', (_payload, ack) => {
      const { groupId, user } = socket.data;
      if (!groupId) return reply(ack, { ok: false, error: 'Join a room first' });
      const started = timers.start(groupId, user.id);
      reply(ack, started ? { ok: true } : { ok: false, error: 'A session is already running' });
    });

    socket.on('timer:stop', (_payload, ack) => {
      const { groupId, user, role } = socket.data;
      if (!groupId) return reply(ack, { ok: false, error: 'Join a room first' });
      const current = timers.get(groupId);
      if (current.phase === 'idle') return reply(ack, { ok: false, error: 'Nothing is running' });
      if (current.startedBy !== user.id && role !== 'owner') {
        return reply(ack, { ok: false, error: 'Only the starter or group owner can stop the timer' });
      }
      timers.stop(groupId);
      reply(ack, { ok: true });
    });

    socket.on('disconnect', () => removePresence(socket));
  });

  return io;
}
