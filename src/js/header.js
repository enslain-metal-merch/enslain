const headerElements = {
  navToggleButton: document.querySelector('.js-nav-toggle-button'),
  toggleBars: document.querySelectorAll('.header__nav-toggle-bar'),
  siteNav: document.querySelector('.js-toggle-primary-nav'),
};

function animateToggleBars() {
  headerElements.toggleBars.forEach((bar) => {
    bar.classList.toggle('ainmate');
  })
}

function openNav() {
  headerElements.siteNav.classList.toggle('open');
  setTimeout(() => {
    headerElements.siteNav.classList.toggle('animate');
  }, 1);
}

function ariaLabelToggle() {
  if (headerElements.siteNav.classList.contains('open')) {
    headerElements.navToggleButton.setAttribute('aria-label', 'Close site navigation');
  } else {
    headerElements.navToggleButton.setAttribute('aria-label', 'Open site navigation');
  }
}

headerElements.navToggleButton.addEventListener('click', function() {
  animateToggleBars();
  openNav();
  ariaLabelToggle();
})
