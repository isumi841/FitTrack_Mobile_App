export type Exercise = { id: string; name: string; subtitle: string; cue: string; steps: string[]; video: string | number | null };
// Add your own licensed MP4s here, for example:
// video: require('../../../assets/videos/wall-push-ups.mp4')
// A direct HTTPS MP4 URL is also supported. YouTube page URLs are not MP4 sources.
export const exercises: Exercise[] = [
  { id: 'march', name: 'March in Place', subtitle: 'Warm up legs & balance', cue: 'Keep your steps light and controlled.', video: null, steps: ['Stand tall with your feet hip-width apart.', 'Lift one knee, then lower your foot gently.', 'Alternate legs at a comfortable pace.', 'Keep breathing steadily and use a wall for balance if needed.'] },
  { id: 'wall-push-ups', name: 'Wall Push-Ups', subtitle: 'Gentle upper body strength', cue: 'Slow, controlled movement.', video: null, steps: ['Face a wall, standing roughly an arm’s length away.', 'Place your palms on the wall at chest height.', 'Bend your elbows slowly, bringing your chest towards the wall.', 'Press through your palms to return, keeping your body aligned.'] },
  { id: 'chair', name: 'Chair Sit-to-Stand', subtitle: 'Lower body & core stability', cue: 'Use a stable chair and move with control.', video: null, steps: ['Place a sturdy chair against a wall.', 'Sit with feet flat and about hip-width apart.', 'Lean slightly forward and press through your feet to stand.', 'Lower yourself slowly back onto the seat.'] },
  { id: 'side-steps', name: 'Standing Side Steps', subtitle: 'Improve balance & coordination', cue: 'Small steps. Steady rhythm.', video: null, steps: ['Stand tall with space on both sides.', 'Step gently to your right and bring your other foot alongside.', 'Repeat to the left.', 'Keep your knees relaxed and move at your own pace.'] },
  { id: 'calf-raises', name: 'Calf Raises', subtitle: 'Ankle & calf conditioning', cue: 'Rise slowly, lower gently.', video: null, steps: ['Stand near a wall or stable chair for support.', 'Keep your feet about hip-width apart.', 'Lift both heels slowly, rising onto the balls of your feet.', 'Lower your heels gently to the floor.'] },
];
export const workout = { id: 'beginner-full-body', name: 'Beginner Full Body', rounds: 3, workSeconds: 40, restSeconds: 20 };
export const formatTime = (seconds: number) => `${Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, '0')}:${Math.floor(Math.max(0, seconds) % 60).toString().padStart(2, '0')}`;
