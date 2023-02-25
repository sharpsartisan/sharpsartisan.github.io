let i = 0;
let slideTimer;

const slides = [...document.querySelectorAll('.slide')];

let modal = document.getElementById('modals');
const modals = modal ? [...modal.children] : [];

const oneofus = document.getElementById('oneofus');
if (oneofus) {
	oneOfUs();
}

if (slides.length) {
	slideTimer = setInterval(changeSlide, 6000);
}

window.onload = () => {

	const wrapper = document.getElementById('wrapper-home');
	if (wrapper) {
		wrapper.style.opacity = 1;
	}

	document.getElementById('body').style.background = 'url(img/background.jpg)';
	document.getElementById('body').style.backgroundPosition = 'center center';
}

document.addEventListener('click', handler);

function handler (e) {

	console.log(e.target)
	switch (e.target.id) {
		// Reset slide-change interval on click
		case 'slide-left':
			clearInterval(slideTimer);
			changeSlide('left');
			slideTimer = setInterval(changeSlide, 6000);
			return;
		case 'slide-right':
			clearInterval(slideTimer);
			changeSlide();
			slideTimer = setInterval(changeSlide, 6000);
			return;
		case 'preview':
			showPreview();
			return;
		case 'booking-submit':
			showPreview();
			validateBooking();
			return;
		case 'contact-submit':
			contactSubmit();
			return;
		case 'search-button':
			search(e);
			return;
	}

	if (e.target.classList.contains('tile-button')) {
		openMenuModal(e);
	} else if (e.target.classList.contains('modal')) {
		closeMenuModal(e);
	}

}

function changeSlide (e) {
	// Hides the previous slide, unhides the next one
	if (e) {
		// Click left
		if (e === 'left') {
			slides[i].classList.add('hidden');
			// Checks i is within range of slides
			i = i + 1 >= slides.length - 1 ? 0 : i + 1;
			slides[i].classList.remove('hidden');
		}
		return;
	}

	// Click right
	slides[i].classList.add('hidden');
	i = i - 1 < 0 ? slides.length - 1 : i - 1;
	slides[i].classList.remove('hidden');
}

function showPreview () {

	const form = [...document.querySelector('form').children];
	const inputs = form.filter(i => i.tagName === 'INPUT' || i.tagName === 'TEXTAREA');

	const preview = [...document.querySelectorAll('.right')]

	preview.forEach((field, i) => {
		field.innerHTML = inputs[i].value || '';
	});

}

function validateBooking () {

	const fname = document.forms['booking-form'].fname;
	const lname = document.forms['booking-form'].lname;
	const date = document.forms['booking-form'].date;
	const time = document.forms['booking-form'].time;
	const tel = document.forms['booking-form'].tel;
	const email = document.forms['booking-form'].email;
	const info = document.forms['booking-form'].info;

	// First and last name (regexp allows one whitespace either side, only alphabetical values)
	if (!fname.value || !/^\s?[a-zA-Z]*\s?$/g.test(fname.value)) {
		alert("Please enter a valid first name");
		fname.focus();
		return false;
	}

	if (!lname.value || !/^\s?[a-zA-Z]*\s?$/g.test(lname.value)) {
		alert("Please enter a valid last name");
		lname.focus();
		return false;
	}

	// Date (only dates in the future)
	let d = date.value.split('-');
	let dateValue = new Date(d[0], d[1]-1, d[2]); // DD/MM/YYYY, The 8th month is index 7
	let currentDate = new Date();

	if (!date.value || dateValue < currentDate) {
		console.log(dateValue, currentDate);
		alert("Please enter a valid date. Only dates in the future are currently allowed.");
		date.focus();
		return false;
	}

	// Time (only between opening hours)
	let hours = time.value.slice(0,2);

	if (!time.value || hours < 08 || hours > 20) {
		alert("Please enter a valid time. Your presence is only welcome between 08:00-20:00");
		time.focus();
		return false;
	}

	// Number (regexp allows one whitespace either side, then 07XXXXXXXXX)
	if (tel.value && (tel.value.length !== 11 || !/^\s?07([0-9]{9})\s?$/.test(tel.value))) {
		alert("Enter a valid mobile number, in the format: 07123456789");
		tel.focus();
		return false;
	}

	// Email (regexp only checks lengths, there is too much validation involved to bother going further)
	// Did you know emails are allowed the + symbol? And many others!
	if (!email.value || !/^\s?(\S[^@]){3,64}@(\S[^@]){3,255}\s?$/g.test(email.value)) {
		alert("Enter a valid email address, in the format: email@example.com");
		email.focus();
		return false;
	}

	// name, name, date 2007-12-20, time 14:56, number, email, info
	alert('Booking Submitted!');
	return true;
}

function openMenuModal (e) {
	const i = e.target.dataset.index;
	modals[i].style.display = 'block';
}

function closeMenuModal (e) {
	const i = e.target.dataset.index;
	modals[i].style.display = 'none';
	console.log(i, modals, modals[i])
}

function contactSubmit () {
	const name = document.forms['contact-form']['contact-name'];
	const email = document.forms['contact-form']['contact-email'];
	const subject = document.forms['contact-form']['contact-subject'];
	const details = document.forms['contact-form']['contact-email-info'];

	// Name
	if (!name.value || !/^\s?[a-zA-Z]*\s?$/g.test(name.value)) {
		alert("Please enter a valid name");
		name.focus();
		return false;
	}

	// Email (allows whitespace either side, also ensures only one @ present)
	if (!email.value || !/^\s?(\S[^@]){3,64}@(\S[^@]){3,255}\s?$/g.test(email.value)) {
		alert("Enter a valid email address, in the format: email@example.com");
		email.focus();
		return false;
	}

	if (!subject.value) {
		alert("Please enter a subject.");
	}

	// Details
	if (!details.value) {
		alert("Please write SOMETHING");
		name.focus();
		return false;
	}

	alert("Message submitted :)");
}

function search (e) {
	const search = document.getElementById('search').value;

	if (!search) {
		alert(`Your search for NOTHING was completed in another universe, but not this one.`);
	} else {
		alert(`Your search for "${search}" was completed in another universe, but not this one.`);
	}
}

function oneOfUs () {

	for (let i = 50; i < 400; i++) {
		let p = document.createElement('p');
		p.innerText = 'One of us';
		p.style.fontSize = `${i / 100}em`;
		oneofus.appendChild(p);
		console.log(p)
	}

	for (let i = 400; i < 1000; i += 2) {
		let p = document.createElement('p');
		p.innerText = 'ONE OF US';
		p.style.fontSize = `${i / 100}em`;
		// Oh look, some actual maths
		p.style.color = `rgb(${(i - 399) / 600 * 255}, 0, 0)`;
		oneofus.appendChild(p);
		console.log(p)
	}
}