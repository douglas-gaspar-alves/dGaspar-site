export const YOUTUBE_ID_PATTERN = /^[\w-]{11}$/;

function validId(id: string): string {
  if (!YOUTUBE_ID_PATTERN.test(id)) throw new TypeError("ID do YouTube inválido.");
  return id;
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${validId(id)}`;
}

export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${validId(id)}?autoplay=1&playsinline=1&controls=1&rel=0`;
}
