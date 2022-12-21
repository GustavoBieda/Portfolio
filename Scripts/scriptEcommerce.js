let buttonMobile = document.querySelector('#ButtonMenu');

function toggleMenu(){
  let nav = document.querySelector('#nav');
  nav.classList.toggle('active')
}

buttonMobile.addEventListener('click', toggleMenu)