const textFit = document.getElementById('textFit');

function autoSize(element) {
	let size = parseFloat(getComputedStyle(element).fontSize);
	element.style.fontSize = `${size}px`;

	while (element.scrollWidth > element.clientWidth && size > 1)
	{
		size -= 0.5;
		element.style.fontSize = `${size}px`;
	}
}

autoSize(textFit);
window.addEventListener('resize', () => autoSize(textFit));

const tabs = document.querySelectorAll('.tabcolumn');
const contents = document.querySelectorAll('.content');

tabs.forEach(tab => {
	tab.addEventListener('click', () => {
		const target = tab.dataset.tab;

		tabs.forEach(t => t.classList.remove('active'));
		contents.forEach(c => c.classList.remove('active'));

		tab.classList.add('active');
		document.getElementById(target).classList.add('active');
	});
});

const blogtab = document.querySelectorAll('.blogtab');
const blogcont = document.querySelectorAll('.blogcont');

blogtab.forEach(tab => {
	tab.addEventListener('click', () => {
		const target = tab.dataset.tab;
		const targetContent = target && document.getElementById(target);

		if (!targetContent) return;

		blogtab.forEach(t => t.classList.remove('active'));
		blogcont.forEach(c => c.classList.remove('active'));

		tab.classList.add('active');
		targetContent.classList.add('active');
	});
});

const graph = document.getElementById("playerStats");

if (graph && typeof Chart !== "undefined") new Chart(graph, {
	type: "radar",
	data: {
		labels: ["Daring", "Bluffing", "Push", "Fold", "Bold"],
		datasets: [{
			data: [3.2, 1.5, 2.6, 1, 4.5],
			backgroundColor: ["#FEDC6E"]
		}]
	},
	options: {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false
			}
		},
		scales: {
			r: {
				ticks: {
					display: false
				},
				pointLabels: {
					color: "white",
					font: {
						size: 20,
						weight: "bold"
					}
				}
			}
		}
	}
});

document.querySelectorAll(".openPopup").forEach(trigger => {
	const popup = document.getElementById(trigger.dataset.popup);

	if (popup) {
		// document.getElementById("openPopup").addEventListener("click", () => {
		// popup.showModal();
		// });
		trigger.addEventListener("click", () => {
			popup.showModal();
		});

		document.getElementById("closePopup")?.addEventListener("click", () => {
			popup.close();
		});
	
		popup.addEventListener("click", event => {
			const bounds = popup.getBoundingClientRect();
			const clickedOutside = event.clientX < bounds.left ||
				event.clientX > bounds.right ||
				event.clientY < bounds.top ||
				event.clientY > bounds.bottom;
	
			if (clickedOutside) {
				popup.close();
			}
		});
		// popup.addEventListener("click", event => {
		// 	const bounds = popup.getBoundingClientRect();
		// 	const radius = parseFloat(getComputedStyle(popup).borderTopLeftRadius) || 0;
		// 	const x = event.clientX;
		// 	const y = event.clientY;
		// 	const insideBounds = x >= bounds.left && x <= bounds.right &&
		// 		y >= bounds.top && y <= bounds.bottom;
		// 	const insideTopLeft = x < bounds.left + radius && y < bounds.top + radius &&
		// 		(x - bounds.left - radius) ** 2 + (y - bounds.top - radius) ** 2 <= radius ** 2;
		// 	const insideTopRight = x > bounds.right - radius && y < bounds.top + radius &&
		// 		(x - bounds.right + radius) ** 2 + (y - bounds.top - radius) ** 2 <= radius ** 2;
		// 	const insideBottomLeft = x < bounds.left + radius && y > bounds.bottom - radius &&
		// 		(x - bounds.left - radius) ** 2 + (y - bounds.bottom + radius) ** 2 <= radius ** 2;
		// 	const insideBottomRight = x > bounds.right - radius && y > bounds.bottom - radius &&
		// 		(x - bounds.right + radius) ** 2 + (y - bounds.bottom + radius) ** 2 <= radius ** 2;
		// 	const insideRoundedCorner = insideTopLeft || insideTopRight || insideBottomLeft || insideBottomRight;
		// 	const clickedOutside = !insideBounds || (!insideRoundedCorner &&
		// 		(x < bounds.left + radius || x > bounds.right - radius) &&
		// 		(y < bounds.top + radius || y > bounds.bottom - radius));
	
		// 	if (clickedOutside) {
		// 		popup.close();
		// 	}
		// });
	}
});



document.querySelectorAll(".toggleEnable").forEach(toggle => {
	const target = document.getElementById(toggle.dataset.target);

	if (target) {
		switch (toggle.type) {
			case "radio": {
				const radioGroup = document.querySelectorAll(
					`input[type="radio"][name="${toggle.name}"]`
				);
				const updateRadioTarget = () => {
					target.disabled = !toggle.checked;
				};

				radioGroup.forEach(radio => {
					radio.addEventListener("change", updateRadioTarget);
				});
				updateRadioTarget();
				break;
			}

			default:
				toggle.addEventListener("change", function () {
					target.disabled = !this.checked;
				});
		}
	}
});

function toggleEnable(toggleId, targetId) {
	const toggle = document.getElementById(toggleId);
	const target = document.getElementById(targetId);

	if (!toggle || !target) return;

	function updateTarget() {
		target.disabled = !toggle.checked;
	}

	toggle.addEventListener("change", updateTarget);
	updateTarget();
}

function sliderDisplay(inputId, outputId) {
	const inputs = document.querySelectorAll(`#${inputId}`);
	const outputs = document.querySelectorAll(`#${outputId}`);

	inputs.forEach((input, index) => {
		const output = outputs[index];

		if (!output) return;

		input.addEventListener("input", () => {
			output.value = input.value;
		});
	});
}

sliderDisplay("maxplayer", "playerValue");
sliderDisplay("maxspectator", "spectateValue");
sliderDisplay("startChips", "chipsValue");
sliderDisplay("maxCycles", "cycles");