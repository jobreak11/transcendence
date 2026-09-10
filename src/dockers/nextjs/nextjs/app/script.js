// const tabMain = document.getElementById('showRegister');
// const tabStat = document.getElementById('showLogin');
// const tabHist = document.getElementById('loginForm');
// const tabSett = document.getElementById('registerForm');

// function displayTab(isRegister) {
// 	loginForm.hidden = isRegister;
// 	registerForm.hidden = !isRegister;
// }

// showRegister.addEventListener('click', (event) => {
// 	event.preventDefault();
// 	setMode(true);
// });

// showLogin.addEventListener('click', (event) => {
// 	event.preventDefault();
// 	setMode(false);
// });

// setMode(false);

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