function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function mapProgress(value, start, end) {
	return clamp((value - start) / (end - start), 0, 1);
}

function initProcessIntroHandoff() {
	const introProcess = document.querySelector('.introProcess');
	const introFirst = document.querySelector('.introFirst');
	const introSecond = document.querySelector('.introSecond');
	const introThird = document.querySelector('.introThird');

	if (!introProcess || !introFirst || !introSecond || !introThird) {
		return;
	}

	let ticking = false;

	function updateHandoff() {
		const viewportHeight = window.innerHeight;
		const scrollY = window.scrollY || window.pageYOffset;
		const sectionTop = introProcess.offsetTop;
		const sectionHeight = introProcess.offsetHeight;

		const start = sectionTop - viewportHeight * 0.01;
        const end = sectionTop + viewportHeight * 0.5;
		const range = Math.max(end - start, 1);
		const sectionProgress = clamp((scrollY - start) / range, 0, 1);
        const sectionProgress2 = clamp((scrollY - (start + viewportHeight * 0.75)) / range, 0, 1);
        const sectionProgress3 = clamp((scrollY - (start + viewportHeight * 1.5)) / range, 0, 1);


		const firstOut = mapProgress(sectionProgress, 0.0, 0.3);
        const secondIn = mapProgress(sectionProgress, 0.2, 0.5);
        const secondOut = mapProgress(sectionProgress, 0.5, 0.7);
        const thirdIn = mapProgress(sectionProgress, 0.7, 1.0);

		const secondY = 50 * (1 - secondIn);
        const thirdY = 50 * (1 - thirdIn);

		// FIRST
        introFirst.style.opacity = String(1 - firstOut);

        // SECOND (in then out)
        introSecond.style.transform = `translateY(${50 * (1 - secondIn)}px)`;
        introSecond.style.opacity = String(secondIn * (1 - secondOut));

        // THIRD
        introThird.style.transform = `translateY(${50 * (1 - thirdIn)}px)`;
        introThird.style.opacity = String(thirdIn);

		ticking = false;
	}

	function onScrollOrResize() {
		if (!ticking) {
			window.requestAnimationFrame(updateHandoff);
			ticking = true;
		}
	}

	updateHandoff();
	window.addEventListener('scroll', onScrollOrResize, { passive: true });
	window.addEventListener('resize', onScrollOrResize);
}
window.addEventListener('DOMContentLoaded', initProcessIntroHandoff);

function initWireframesHorizontalWheel() {
	const wireframesSection = document.querySelector('.wireframes-Low');
	const wireframesTrack = document.querySelector('.imageWireframes-Low');
	const prevButton = document.querySelector('.wireNavPrev');
	const nextButton = document.querySelector('.wireNavNext');

	if (!wireframesSection || !wireframesTrack) {
		return;
	}

	const frames = Array.from(wireframesTrack.querySelectorAll('img'));

	function centerFrameAt(index) {
		const frame = frames[index];
		if (!frame) {
			return;
		}

		const targetLeft = frame.offsetLeft - (wireframesTrack.clientWidth - frame.offsetWidth) / 2;
		wireframesTrack.scrollTo({
			left: Math.max(0, targetLeft),
			behavior: 'smooth'
		});
	}

	function goToFrame(direction) {
		if (!frames.length) {
			return;
		}

		const currentCenter = wireframesTrack.scrollLeft + wireframesTrack.clientWidth / 2;
		const centers = frames.map((frame) => frame.offsetLeft + frame.offsetWidth / 2);
		let nearestIndex = 0;
		let nearestDistance = Number.POSITIVE_INFINITY;

		centers.forEach((center, index) => {
			const distance = Math.abs(center - currentCenter);
			if (distance < nearestDistance) {
				nearestDistance = distance;
				nearestIndex = index;
			}
		});

		const targetIndex = clamp(nearestIndex + direction, 0, frames.length - 1);

		centerFrameAt(targetIndex);
	}

	if (prevButton) {
		prevButton.addEventListener('click', () => goToFrame(-1));
	}

	if (nextButton) {
		nextButton.addEventListener('click', () => goToFrame(1));
	}

	function handleHorizontalWheel(event) {
		if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
			return;
		}

		const canScroll = wireframesTrack.scrollWidth > wireframesTrack.clientWidth;
		if (!canScroll) {
			return;
		}

		event.preventDefault();
		const speedMultiplier = 2.4;
		wireframesTrack.scrollBy({
			left: event.deltaY * speedMultiplier,
			behavior: 'auto'
		});
	}

	wireframesSection.addEventListener('wheel', handleHorizontalWheel, { passive: false });
}

window.addEventListener('DOMContentLoaded', initWireframesHorizontalWheel);
