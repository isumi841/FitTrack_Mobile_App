import test from 'node:test';
import assert from 'node:assert/strict';
import { exerciseVideo, validateExerciseForm } from '../../shared/exercise-validation.ts';

test('YouTube links normalize to a video URL and direct media links remain playable', () => {
  const id = 'dQw4w9WgXcQ';
  for (const url of [`https://www.youtube.com/watch?v=${id}&feature=share`, `https://youtu.be/${id}?si=share`,
    `https://youtube.com/shorts/${id}`, `https://m.youtube.com/watch?v=${id}`, `https://www.youtube-nocookie.com/embed/${id}`, `https://youtube.com/live/${id}`]) {
    assert.deepEqual(exerciseVideo(url), { kind: 'youtube', url: `https://www.youtube.com/watch?v=${id}` });
  }
  for (const url of ['https://example.com/exercise.mp4?signature=abc', 'https://example.com/exercise.m3u8'])
    assert.deepEqual(exerciseVideo(url), { kind: 'file', url });
  for (const url of ['javascript:alert(1)', 'http://youtu.be/dQw4w9WgXcQ', 'https://youtube.com', 'https://youtube.com/playlist?list=123',
    'https://youtube.com/watch?v=bad', 'https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ/extra',
    'https://user:pass@youtube.com/watch?v=dQw4w9WgXcQ', 'https://example.com/page', 'https://youtube.com/demo.mp4'])
    assert.equal(exerciseVideo(url), null, url);
});

test('editor validates required fields, limits, whole-number order, step counts and optional video', () => {
  const valid = { name: 'Squat', target: '12 reps', position: '1', subtitle: '', steps: 'Stand tall.\nBend your knees.', video: '' };
  assert.deepEqual(validateExerciseForm(valid), {});
  for (const [key, value] of [['name', '  '], ['name', 'a'.repeat(101)], ['target', ''], ['target', 'a'.repeat(101)],
    ['subtitle', 'a'.repeat(201)], ['position', '1.5'], ['position', '1e2'], ['position', '0'], ['position', '10000'],
    ['steps', '   '], ['steps', Array(21).fill('Step').join('\n')], ['steps', 'a'.repeat(501)], ['video', 'https://example.com/page']]) {
    assert.ok(validateExerciseForm({ ...valid, [key]: value })[key], `${key}: ${value}`);
  }
  assert.deepEqual(validateExerciseForm({ ...valid, position: '9999', steps: Array(20).fill('a'.repeat(500)).join('\n'), video: 'https://youtu.be/dQw4w9WgXcQ' }), {});
});
