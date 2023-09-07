document.querySelector('.header__toggle').addEventListener('click', function (e) {
  // following 3 lines are just for the toggle icon animation
  document.querySelector('.header__toggle-bar-1').classList.toggle('header__toggle-bar--shift-down');
  document.querySelector('.header__toggle-bar-2').classList.toggle('header__toggle-bar--vanish');
  document.querySelector('.header__toggle-bar-3').classList.toggle('header__toggle-bar--shift-up');
  // next line is for opening a dropdown nav
  document.querySelector('.header__dropdown').classList.toggle('header__dropdown--open');
})
