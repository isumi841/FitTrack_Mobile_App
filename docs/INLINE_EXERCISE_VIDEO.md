# Inline exercise guidance

How to perform now combines the exercise title, playable demonstration, numbered
instructions, and Return to workout. The local note editor and separate watch-video
button are removed. Existing `/workout/video` links redirect to the combined screen.
Returning from session guidance uses the matching active/paused/completed session;
ordinary exercise guidance returns to its parent workout details.

## Playback

- YouTube: validated video links are embedded with controls and no autoplay. Web uses
  a platform-specific iframe with `strict-origin-when-cross-origin` referrer policy.
  Native uses `react-native-webview` and the real runtime application ID from
  `expo-application` as the Referer, as required by YouTube. No API key is needed.
- Direct HTTPS MP4/HLS and existing bundled video assets use `expo-video`.
- Players unmount when navigation loses focus or the app enters the background to
  stop hidden playback. Returning to the screen starts a fresh player.
- Missing/invalid videos retain the written instructions. Direct media and WebView
  transport errors offer retry; YouTube may display its own embedded-player error.
  An Open on YouTube fallback remains available for restricted/unavailable videos.
- YouTube completion is not tracked by this basic embed. Direct-video completion
  retains the existing local watched marker; opening an external link does not count.

The selected YouTube video must allow embedding and be available to the viewer.
Downloaded videos are not required. Owned/licensed MP4 files can be hosted and entered
as direct HTTPS links; uploading files through the admin editor is not implemented.

## Setup and review

`react-native-webview` and `expo-application` were installed through Expo's SDK-compatible
installer. Restart Expo after installing. Both modules are included in compatible
Expo Go; an existing custom development build must be rebuilt to include new native
dependencies. No generated native directories were added or edited.

Check an embeddable YouTube video on localhost web and on Android/iOS, fullscreen,
short links/Shorts, MP4/HLS, missing and unavailable videos, offline retry, navigation
away during playback, app backgrounding, and return-to-workout behavior. Browser and
device playback have not been exercised in this implementation pass.

References: [Expo WebView](https://docs.expo.dev/versions/v57.0.0/sdk/webview/),
[YouTube embedding](https://developers.google.com/youtube/player_parameters),
[YouTube client identification](https://developers.google.com/youtube/terms/required-minimum-functionality#api-client-identity-and-credentials).
