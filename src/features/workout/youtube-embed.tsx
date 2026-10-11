import { useState } from 'react';
import { Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { applicationId } from 'expo-application';
import { Button, s } from './ui';

export function YouTubeEmbed({ videoId, title }: { videoId: string; title: string }) {
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // YouTube requires the actual installed app identity as the native Referer.
  const referer = applicationId ? `https://${applicationId.toLowerCase()}` : null;
  if (!referer) return <Text style={s.body}>The embedded player is unavailable in this build. Open the video on YouTube below.</Text>;
  return <View style={{ gap: 10 }}>
    <View style={{ width: '100%', aspectRatio: 16 / 9, minHeight: 220, backgroundColor: '#000' }}>
      <WebView key={attempt} accessibilityLabel={`${title} video demonstration`}
        source={{ uri: `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?playsinline=1&rel=0`, headers: { Referer: referer } }}
        style={{ flex: 1, backgroundColor: '#000' }}
        allowsInlineMediaPlayback allowsFullscreenVideo mediaPlaybackRequiresUserAction
        originWhitelist={['https://*']} javaScriptEnabled scrollEnabled={false}
        onError={() => setError(true)} onHttpError={() => setError(true)}
      />
    </View>
    {error && <><Text accessibilityRole="alert" style={s.body}>The video could not load. Check your connection or open it on YouTube.</Text>
      <Button title="Retry video" secondary onPress={() => { setError(false); setAttempt(value => value + 1); }} /></>}
  </View>;
}
