// Server-owned Pomodoro timers, one per study room. The server is the single source of truth, so every
// member sees the same phase and end time no matter when they joined. Clients only render `endsAt`.

export class RoomTimers {
  constructor({
    focusMs = 25 * 60 * 1000,
    breakMs = 5 * 60 * 1000,
    now = () => Date.now(),
    onChange = () => {},
    onFocusComplete = () => {},
  } = {}) {
    this.focusMs = focusMs;
    this.breakMs = breakMs;
    this.now = now;
    this.onChange = onChange;
    this.onFocusComplete = onFocusComplete;
    this.rooms = new Map(); // groupId -> { phase, endsAt, startedBy, handle }
  }

  get(groupId) {
    const room = this.rooms.get(String(groupId));
    return {
      phase: room?.phase ?? 'idle',
      endsAt: room?.endsAt ?? null,
      startedBy: room?.startedBy ?? null,
      focusMs: this.focusMs,
      breakMs: this.breakMs,
      serverNow: this.now(),
    };
  }

  // Returns false if a session is already running.
  start(groupId, startedBy) {
    const id = String(groupId);
    if (this.rooms.has(id)) return false;
    this.#enter(id, 'focus', this.focusMs, startedBy);
    return true;
  }

  stop(groupId) {
    const id = String(groupId);
    const room = this.rooms.get(id);
    if (!room) return false;
    clearTimeout(room.handle);
    this.rooms.delete(id);
    this.onChange(id);
    return true;
  }

  #enter(id, phase, durationMs, startedBy) {
    const handle = setTimeout(() => this.#advance(id), durationMs);
    handle.unref?.();
    this.rooms.set(id, { phase, endsAt: this.now() + durationMs, startedBy, handle });
    this.onChange(id);
  }

  #advance(id) {
    const room = this.rooms.get(id);
    if (!room) return;
    if (room.phase === 'focus') {
      this.onFocusComplete(id, Math.round(this.focusMs / 60000));
      this.#enter(id, 'break', this.breakMs, room.startedBy);
    } else {
      this.rooms.delete(id);
      this.onChange(id);
    }
  }
}
