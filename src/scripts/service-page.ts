const readingProgress = document.querySelector<HTMLElement>(".service-reading-progress span");
const stepList = document.querySelector<HTMLOListElement>(".detail-list");
const steps = Array.from(document.querySelectorAll<HTMLElement>(".detail-list li"));
const revealItems = Array.from(document.querySelectorAll<HTMLElement>(
	".service-intro > .wrap, .detail-list li, .ai-grid article, .service-scope-inner",
));

let progressFrame = 0;

function updateScrollIndicators() {
	progressFrame = 0;

	if (readingProgress) {
		const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
		const progress = scrollableHeight > 0 ? Math.min(1, window.scrollY / scrollableHeight) : 0;
		readingProgress.style.transform = `scaleX(${progress})`;
	}

	if (!stepList || steps.length === 0) return;

	const readingLine = window.innerHeight * .45;
	const currentIndex = steps.reduce((closestIndex, step, index) => {
		const closestRect = steps[closestIndex].getBoundingClientRect();
		const stepRect = step.getBoundingClientRect();
		const closestDistance = Math.abs(closestRect.top + closestRect.height / 2 - readingLine);
		const stepDistance = Math.abs(stepRect.top + stepRect.height / 2 - readingLine);
		return stepDistance < closestDistance ? index : closestIndex;
	}, 0);

	steps.forEach((step, index) => {
		if (index === currentIndex) {
			step.setAttribute("aria-current", "step");
		} else {
			step.removeAttribute("aria-current");
		}
	});

	stepList.style.setProperty("--steps-progress", `${((currentIndex + 1) / steps.length) * 100}%`);
}

function scheduleReadingProgress() {
	if (progressFrame) return;
	progressFrame = window.requestAnimationFrame(updateScrollIndicators);
}

window.addEventListener("scroll", scheduleReadingProgress, { passive: true });
window.addEventListener("resize", scheduleReadingProgress);
window.addEventListener("load", scheduleReadingProgress, { once: true });
updateScrollIndicators();

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
	revealItems.forEach((item) => { item.dataset.serviceReveal = "pending"; });
	if (revealItems.length > 0) {
		document.documentElement.classList.add("service-motion-ready");
		const observer = new IntersectionObserver((entries, currentObserver) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) return;
				(entry.target as HTMLElement).dataset.serviceReveal = "shown";
				currentObserver.unobserve(entry.target);
			});
		}, { threshold: .1 });

		revealItems.forEach((item) => observer.observe(item));
	}
}
