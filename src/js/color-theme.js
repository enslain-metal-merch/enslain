const colorTheme = {
  transitionValue: "var(--theme-change-transition)", 
  elements: {
    themeOptionLight: document.getElementById('light-theme'),
    themeOptionDark: document.getElementById('dark-theme'),
    body: document.querySelector('body'),
    headerLogoImg: document.querySelector('.header__logo-img')
  },
  logoImages: {
    headerDark: '/assets/img/theme/header-logo-background--dark.jpg',
    headerLight: '/assets/img/theme/header-logo-background--light.jpg'
  }  
};

(function () {
  const setTheme = () => {
    const storedTheme = localStorage.getItem('color-theme');
    
    if (storedTheme === 'light') {
      document.documentElement.setAttribute('data-color-theme', storedTheme);
      colorTheme.elements.headerLogoImg.src = colorTheme.logoImages.headerLight;
      colorTheme.elements.themeOptionLight.checked = true;
    } else {
      document.documentElement.removeAttribute('data-color-theme');
      colorTheme.elements.headerLogoImg.src = colorTheme.logoImages.headerDark;
      colorTheme.elements.themeOptionDark.checked = true;
    }
  };

  
  window.addEventListener('DOMContentLoaded', () => {
    setTheme();

    document.querySelectorAll('[data-color-theme-value]').forEach(input => {
      input.addEventListener('click', () => {
        const selectedTheme = input.getAttribute('data-color-theme-value');

        if (selectedTheme === 'light') {
          localStorage.setItem('color-theme', 'light')
        } else {
          localStorage.removeItem('color-theme');
        }

        setTheme();
      });
    });

    setTheme();
    colorTheme.elements.body.style.transition = colorTheme.transitionValue;
  });
})();
