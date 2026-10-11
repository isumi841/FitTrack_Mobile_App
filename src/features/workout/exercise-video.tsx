import { useEventListener } from 'expo';
import * as Linking from 'expo-linking';
import { useFocusEffect } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { exerciseVideo } from '../../../shared/exercise-validation';
import type { Exercise } from './data';
import { useWorkout } from './store';
import { Button, Card, c, s } from './ui';
import { YouTubeEmbed } from './youtube-embed';

export function ExerciseVideo({ exercise }: { exercise: Exercise }) {
  const [focused, setFocused] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState !== 'background');
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);
  const video = typeof exercise.video === 'string' ? exerciseVideo(exercise.video) : null;
  if (exercise.video === null || (typeof exercise.video === 'string' && !video)) return <Card>
    <Text style={s.heading}>Video not available</Text><Text style={s.body}>Follow the step-by-step instructions below.</Text>
  </Card>;
  // Unmount embeds/players on blur and background so hidden screens cannot keep playing.
  if (!focused || !foreground) return <View style={{ width: '100%', aspectRatio: 16 / 9, minHeight: 220, backgroundColor: c.surface }} />;
  return video?.kind === 'youtube'
    ? <YouTubeVideo key={video.url} url={video.url} title={exercise.name} />
    : <DirectVideo key={`${exercise.id}:${exercise.video}`} exercise={exercise} />;
}

function YouTubeVideo({ url, title }: { url: string; title: string }) {
  const [error, setError] = useState('');
  const videoId = new URL(url).searchParams.get('v')!;
  return <View style={{ gap: 8 }}>
    <YouTubeEmbed videoId={videoId} title={title} />
    <View style={{ gap: 4 }}><Text style={[s.body, { fontSize: 12 }]}>If this video cannot play here, watch it on YouTube.</Text>
      <Pressable accessibilityRole="link" onPress={() => {
        setError('');
        void Linking.openURL(url).catch(() => setError('Could not open YouTube. Please try again.'));
      }} style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}>
        <Text style={{ color: c.accent, fontWeight: '600' }}>Open on YouTube ↗</Text>
      </Pressable>
      {!!error && <Text accessibilityRole="alert" style={s.body}>{error}</Text>}
    </View>
  </View>;
}

function DirectVideo({ exercise }: { exercise: Exercise }) {
  const { markViewed } = useWorkout();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return <View style={{ gap: 10 }}>
    <DirectPlayer key={attempt} exercise={exercise} onEnded={() => markViewed(exercise.id)} onError={setError} />
    {error && <><Text accessibilityRole="alert" style={s.body}>This video could not be played. Check your connection or follow the instructions below.</Text>
      <Button title="Retry video" secondary onPress={() => { setError(false); setAttempt(value => value + 1); }} /></>}
  </View>;
}
function DirectPlayer({ exercise, onEnded, onError }: { exercise: Exercise; onEnded: () => void; onError: (error: boolean) => void }) {
  const player = useVideoPlayer(exercise.video);
  useEventListener(player, 'playToEnd', onEnded);
  useEventListener(player, 'statusChange', event => onError(event.status === 'error'));
  return <VideoView player={player} nativeControls fullscreenOptions={{ enable: true }}
    style={{ width: '100%', aspectRatio: 16 / 9, minHeight: 220, backgroundColor: '#000' }} />;
}
