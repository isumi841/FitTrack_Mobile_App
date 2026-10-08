export const VIDEO_URL_ERROR = 'Enter a valid HTTPS YouTube video, MP4, or HLS (.m3u8) link.';

export function exerciseVideo(value: string): { kind: 'youtube' | 'file'; url: string } | null {
  if (!value || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase();
    const youtube = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host);
    if (youtube) {
      const path = url.pathname.split('/').filter(Boolean);
      const id = host.endsWith('youtu.be') && path.length === 1 ? path[0]
        : url.pathname === '/watch' ? url.searchParams.get('v')
        : path.length === 2 && ['shorts', 'embed', 'live'].includes(path[0]) ? path[1] : null;
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? { kind: 'youtube', url: `https://www.youtube.com/watch?v=${id}` } : null;
    }
    return /\.(mp4|m3u8)$/i.test(url.pathname) ? { kind: 'file', url: value } : null;
  } catch { return null; }
}

export type ExerciseForm = { name: string; target: string; subtitle: string; position: string; steps: string; video: string };
export type ExerciseField = keyof ExerciseForm;
export function validateExerciseForm(form: ExerciseForm): Partial<Record<ExerciseField, string>> {
  const errors: Partial<Record<ExerciseField, string>> = {};
  for (const [key, label, max, required] of [
    ['name', 'Exercise name', 100, true], ['target', 'Target', 100, true], ['subtitle', 'Description', 200, false],
  ] as const) {
    const text = form[key].trim();
    if (required && !text) errors[key] = `${label} is required.`;
    else if (text.length > max) errors[key] = `${label} must be ${max} characters or fewer.`;
  }
  if (!/^\d+$/.test(form.position) || Number(form.position) < 1 || Number(form.position) > 9999)
    errors.position = 'Enter a whole number from 1 to 9999.';
  const steps = form.steps.split('\n').map(step => step.trim()).filter(Boolean);
  if (!steps.length) errors.steps = 'Add at least one instruction step.';
  else if (steps.length > 20) errors.steps = 'Use up to 20 steps, one per line.';
  else if (steps.some(step => step.length > 500)) errors.steps = 'Each instruction step must be 500 characters or fewer.';
  if (form.video.trim() && !exerciseVideo(form.video.trim())) errors.video = VIDEO_URL_ERROR;
  return errors;
}
