const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

function setMode(isRegister) {
	loginForm.hidden = isRegister;
	registerForm.hidden = !isRegister;
}

showRegister.addEventListener('click', (event) => {
	event.preventDefault();
	setMode(true);
});

showLogin.addEventListener('click', (event) => {
	event.preventDefault();
	setMode(false);
});

setMode(false);