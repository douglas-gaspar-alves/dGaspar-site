import { youtubeEmbedUrl } from "../lib/youtube-video";

export function initLessonVideos(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-lesson-video]").forEach((video) => {
    const button = video.querySelector<HTMLButtonElement>("[data-video-play]");
    if (!button || button.dataset.ready) return;
    button.dataset.ready = "true";
    button.addEventListener("click", () => {
      const frame = video.querySelector<HTMLElement>("[data-video-frame]");
      if (!frame || !video.dataset.youtubeId || frame.querySelector("iframe")) return;
      const status = video.querySelector<HTMLElement>("[data-video-status]");
      try {
        const iframe = document.createElement("iframe");
        iframe.src = youtubeEmbedUrl(video.dataset.youtubeId);
        iframe.title = video.dataset.videoTitle || "Apresentação da próxima aula";
        iframe.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture";
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        iframe.tabIndex = 0;
        frame.replaceChildren(iframe);
        iframe.focus();
        if (status) status.textContent = "Player carregado. Se o vídeo não abrir, use o link Assistir no YouTube.";
      } catch {
        if (status) {
          status.classList.remove("sr-only");
          status.textContent = "Não foi possível abrir o vídeo. Use o link Assistir no YouTube.";
        }
      }
    });
  });
}
