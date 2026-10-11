export function YouTubeEmbed({ videoId, title }: { videoId: string; title: string }) {
  return <iframe
    title={`${title} video demonstration`}
    src={`https://www.youtube.com/embed/${encodeURIComponent(videoId)}?playsinline=1&rel=0`}
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
    referrerPolicy="strict-origin-when-cross-origin"
    style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', minHeight: 220, border: 0, background: '#000' }}
  />;
}
