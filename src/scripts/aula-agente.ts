// Interações da MasterClass do Agente (/aula-agente/). Tudo é decorativo ou
// reforço de navegação: sem JavaScript a página fica completa (terminal
// estático, conteúdo revelado, CTA flutuante oculto). prefers-reduced-motion
// desliga digitação e revelação. Funções puras e inicializações separadas
// para os testes em src/scripts/aula-agente/.

import { rotuloContagem } from "../lib/aula-agente";

const MOTION_OK = "(prefers-reduced-motion: reduce)";

/** Rótulo do chip de contagem regressiva (texto já em maiúsculas). */
export function rotuloContagemChip(agora: Date, inicio: string, fim: string): string | null {
  const rótulo = rotuloContagem(agora, inicio, fim);
  if (!rótulo) return null;
  return `COMEÇA ${rótulo.toUpperCase()}`;
}

/** Chip "COMEÇA EM…" junto à data da hero; some depois do fim do encontro. */
export function initAulaCountdown(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-aula-count]").forEach((chip) => {
    if (chip.dataset.ready) return;
    chip.dataset.ready = "true";
    const { inicio, fim } = chip.dataset;
    if (!inicio || !fim) return;
    const tick = () => {
      const label = rotuloContagemChip(new Date(), inicio, fim);
      if (!label) {
        chip.hidden = true;
        return;
      }
      chip.hidden = false;
      chip.textContent = label;
    };
    tick();
    window.setInterval(tick, 30_000);
  });
}

/**
 * Terminal da hero: digita os comandos e revela as saídas em loop. Sem JS o
 * conteúdo já está todo visível; a digitação só troca a ordem de aparição.
 */
export function initAulaTerminal(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-aula-terminal]").forEach((terminal) => {
    if (terminal.dataset.ready) return;
    terminal.dataset.ready = "true";
    if (window.matchMedia(MOTION_OK).matches) return;
    const lines = [...terminal.querySelectorAll<HTMLElement>(".aula-term-line")];
    if (!lines.length) return;
    terminal.classList.add("is-animated");
    let started = false;
    const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
    const digitar = async (line: HTMLElement) => {
      const texto = line.textContent ?? "";
      line.textContent = "";
      line.classList.add("is-shown", "is-typing");
      for (const char of texto) {
        line.textContent += char;
        await wait(28 + Math.random() * 42);
      }
      line.classList.remove("is-typing");
    };
    const tocar = async () => {
      for (;;) {
        lines.forEach((line) => line.classList.remove("is-shown"));
        await wait(500);
        for (const line of lines) {
          if (line.classList.contains("aula-term-cmd")) {
            await digitar(line);
          } else {
            line.classList.add("is-shown");
            await wait(420);
          }
        }
        await wait(5200);
      }
    };
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting) || started) return;
      started = true;
      observer.disconnect();
      void tocar();
    }, { threshold: 0.35 });
    observer.observe(terminal);
  });
}

/** Revelação das seções ao entrar na tela. */
export function initAulaReveal(root: ParentNode = document): void {
  const items = [...root.querySelectorAll<HTMLElement>("[data-reveal]")];
  if (!items.length) return;
  if (window.matchMedia(MOTION_OK).matches || typeof IntersectionObserver === "undefined") return;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-in");
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.16, rootMargin: "0px 0px -36px 0px" });
  items.forEach((item) => {
    if (item.dataset.revealReady) return;
    item.dataset.revealReady = "true";
    item.classList.add("will-reveal");
    observer.observe(item);
  });
}

/** Barra de progresso de leitura no topo do cabeçalho. */
export function initAulaProgress(root: ParentNode = document): void {
  const bar = root.querySelector<HTMLElement>("[data-aula-progress]");
  if (!bar || bar.dataset.ready) return;
  bar.dataset.ready = "true";
  const update = () => {
    const maximo = document.documentElement.scrollHeight - window.innerHeight;
    const valor = maximo > 0 ? Math.min(100, Math.max(0, (window.scrollY / maximo) * 100)) : 0;
    bar.style.width = `${valor.toFixed(2)}%`;
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
}

/** CTA flutuante aparece depois da primeira dobra e volta a sumir no topo. */
export function initAulaFloat(root: ParentNode = document): void {
  const float = root.querySelector<HTMLElement>("[data-aula-float]");
  const hero = root.querySelector<HTMLElement>("[data-aula-hero]");
  if (!float || !hero || float.dataset.ready) return;
  float.dataset.ready = "true";
  const update = () => {
    float.hidden = window.scrollY < hero.offsetHeight - 140;
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
}

/** Preenchimento da linha da agenda conforme a leitura avança. */
export function initAulaAgenda(root: ParentNode = document): void {
  const track = root.querySelector<HTMLElement>("[data-aula-agenda]");
  if (!track || track.dataset.ready) return;
  track.dataset.ready = "true";
  const update = () => {
    const rect = track.getBoundingClientRect();
    const passou = Math.min(1, Math.max(0, (window.innerHeight * 0.72 - rect.top) / Math.max(rect.height, 1)));
    track.style.setProperty("--aula-agenda-fill", `${(passou * 100).toFixed(1)}%`);
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
}

/** Liga todas as interações da página. */
export function initAulaAgente(root: ParentNode = document): void {
  initAulaCountdown(root);
  initAulaTerminal(root);
  initAulaReveal(root);
  initAulaProgress(root);
  initAulaFloat(root);
  initAulaAgenda(root);
}
