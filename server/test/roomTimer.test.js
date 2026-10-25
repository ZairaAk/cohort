import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { RoomTimers } from '../src/services/roomTimer.js';

function setup() {
  mock.timers.enable({ apis: ['setTimeout'] });
  let clock = 0;
  const changes = [];
  const completed = [];
  const timers = new RoomTimers({
    focusMs: 1000,
    breakMs: 500,
    now: () => clock,
    onChange: (id) => changes.push(timers.get(id).phase),
    onFocusComplete: (id, minutes) => completed.push([id, minutes]),
  });
  return { timers, changes, completed, tick: (ms) => { clock += ms; mock.timers.tick(ms); } };
}

test('focus then break then idle, firing completion once', () => {
  const { timers, changes, completed, tick } = setup();
  assert.equal(timers.start('g1', 'u1'), true);
  assert.equal(timers.get('g1').phase, 'focus');

  tick(1000);
  assert.equal(timers.get('g1').phase, 'break');
  assert.equal(completed.length, 1);

  tick(500);
  assert.equal(timers.get('g1').phase, 'idle');
  assert.deepEqual(changes, ['focus', 'break', 'idle']);
  mock.timers.reset();
});

test('cannot start while a session is running', () => {
  const { timers } = setup();
  assert.equal(timers.start('g1', 'u1'), true);
  assert.equal(timers.start('g1', 'u2'), false);
  mock.timers.reset();
});

test('stopping cancels the timer without recording a completed session', () => {
  const { timers, completed, tick } = setup();
  timers.start('g1', 'u1');
  assert.equal(timers.stop('g1'), true);
  tick(5000);
  assert.equal(timers.get('g1').phase, 'idle');
  assert.equal(completed.length, 0);
  mock.timers.reset();
});

test('rooms are independent', () => {
  const { timers } = setup();
  timers.start('g1', 'u1');
  assert.equal(timers.get('g2').phase, 'idle');
  mock.timers.reset();
});
