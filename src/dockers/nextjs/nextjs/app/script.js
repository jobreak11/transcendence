const textFit = document.getElementById('textFit');

function autoSize(element) {
	let size = 40;
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

const graph = document.getElementById("playerStats");

new Chart(graph, {
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