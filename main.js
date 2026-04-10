function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function mapProgress(value, start, end) {
	return clamp((value - start) / (end - start), 0, 1);
}

function initProcessIntroHandoff() {
	const introProcess = document.querySelector('.introProcess');
	const introFirst = document.querySelector('.introFirst');
	const introThird = document.querySelector('.introThird');

	if (!introProcess || !introFirst || !introThird) {
		return;
	}

	let ticking = false;

	function updateHandoff() {
		const viewportHeight = window.innerHeight;
		const scrollY = window.scrollY || window.pageYOffset;
		const sectionTop = introProcess.offsetTop;

		const start = sectionTop - viewportHeight * 0.01;
		const end = sectionTop + viewportHeight * 0.45;
		const range = Math.max(end - start, 1);
		const sectionProgress = clamp((scrollY - start) / range, 0, 1);

		const firstOut = mapProgress(sectionProgress, 0.0, 0.35);
		const thirdIn = mapProgress(sectionProgress, 0.1, 0.55);

		const thirdY = 50 * (1 - thirdIn);

		// FIRST
		introFirst.style.opacity = String(1 - firstOut);

		// THIRD
		introThird.style.transform = `translateY(${thirdY}px)`;
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
	const wireframesSection = document.querySelector('.wireframesScroller');
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

function initIntroThirdAutoCarousel() {
	const introThirdTrack = document.querySelector('.introThird .imageIntro');
	if (!introThirdTrack) return;

	const cards = Array.from(introThirdTrack.querySelectorAll('img'));
	if (cards.length <= 1) return;

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const AUTO_ADVANCE_MS = 1400;
	const RESUME_AFTER_CLICK_MS = 2000;
	const RESUME_AFTER_TOUCH_MS = 1200;
	const RESUME_AFTER_WHEEL_MS = 1000;

	let activeIndex = 0;
	let timerId = null;
	let resumeId = null;

	// 🔁 Scroll to a card
	function scrollToCard(index, behavior = 'smooth') {
		const card = cards[index];
		if (!card) return;

		const trackRect = introThirdTrack.getBoundingClientRect();
		const cardRect = card.getBoundingClientRect();

		const targetLeft =
			introThirdTrack.scrollLeft +
			(cardRect.left - trackRect.left) -
			(introThirdTrack.clientWidth - cardRect.width) / 2;

		introThirdTrack.scrollTo({
			left: Math.max(0, targetLeft),
			behavior
		});

		updateActiveCard(); // ✅ always update UI
	}

	// 🎯 Highlight active card
	function updateActiveCard() {
		cards.forEach((card, i) => {
			if (i === activeIndex) {
				card.style.opacity = '1';
				card.style.transform = 'scale(1.08)';
				card.style.zIndex = '2';
			} else {
				card.style.opacity = '0.5';
				card.style.transform = 'scale(0.92)';
				card.style.zIndex = '1';
			}
		});
	}

	function startAuto() {
		if (timerId !== null) return;

		timerId = window.setInterval(() => {
			activeIndex = (activeIndex + 1) % cards.length;
			scrollToCard(activeIndex);
		}, AUTO_ADVANCE_MS);
	}

	// ⏸ Stop auto
	function stopAuto() {
		if (timerId !== null) {
			clearInterval(timerId);
			timerId = null;
		}
	}

	// ⏸ then ▶️ resume
	function pauseThenResume(delay) {
		stopAuto();
		if (reducedMotion) return;

		if (resumeId !== null) {
			clearTimeout(resumeId);
		}
		resumeId = setTimeout(startAuto, delay);
	}

	// 🖱 Click interaction
	introThirdTrack.addEventListener('click', (event) => {
		const clickedCard = event.target.closest('img');
		if (!clickedCard) return;

		const clickedIndex = cards.indexOf(clickedCard);
		if (clickedIndex === -1) return;

		stopAuto();
		activeIndex = clickedIndex;

		scrollToCard(activeIndex, 'smooth');
		pauseThenResume(RESUME_AFTER_CLICK_MS);
	});

	// 🖱 Hover pause
	introThirdTrack.addEventListener('mouseenter', stopAuto);
	introThirdTrack.addEventListener('mouseleave', () => {
		if (!reducedMotion) startAuto();
	});

	// 📱 Touch / wheel
	introThirdTrack.addEventListener(
		'touchstart',
		() => pauseThenResume(RESUME_AFTER_TOUCH_MS),
		{ passive: true }
	);

	introThirdTrack.addEventListener(
		'wheel',
		() => pauseThenResume(RESUME_AFTER_WHEEL_MS),
		{ passive: true }
	);

	// 🚀 Init
	scrollToCard(activeIndex, 'auto');
	updateActiveCard();

	if (!reducedMotion) {
		startAuto();
	}
}

window.addEventListener('DOMContentLoaded', initIntroThirdAutoCarousel);