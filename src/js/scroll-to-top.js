const scrollToTopLink = document.querySelector('.button--scroll-to-top');

window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    scrollToTopLink.style.display = "block";
  } else {
    scrollToTopLink.style.display = "none";
  }
}

scrollToTopLink.addEventListener('click', function(e) {
  e.preventDefault();
  document.querySelector(e.target.hash).scrollIntoView({
    behavior: 'smooth'
  })
});
