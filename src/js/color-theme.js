const colorTheme = {
  transitionValue: "var(--theme-change-transition)", 
  elements: {
    themeOptionSystem: document.getElementById('system-theme'),
    themeOptionLight: document.getElementById('light-theme'),
    themeOptionDark: document.getElementById('dark-theme'),
    body: document.querySelector('body'),
    headerLogoImg: document.querySelector('.header__logo-img'),
  },
  logoImages: {
    headerDark: '/assets/img/theme/header-logo-background--dark.jpg',
    headerLight: '/assets/img/theme/header-logo-background--light.jpg'
  }  
};

(function () {
  const getPreferredTheme = () => {
    // Defaults to light
    if (localStorage.getItem('theme')) return localStorage.getItem('theme');
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  const setTheme = () => {
    const theme = getPreferredTheme();
    document.documentElement.setAttribute('data-color-theme', theme);

    if (theme === 'light') {
      colorTheme.elements.headerLogoImg.src = colorTheme.logoImages.headerLight;
    } else if (theme === 'dark') {
      colorTheme.elements.headerLogoImg.src = colorTheme.logoImages.headerDark;
    }

    showActiveTheme();
    // console.log('Set theme: ' + theme);
  }

  const showActiveTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      colorTheme.elements.themeOptionLight.checked = true;
    } else if (savedTheme === 'dark') {
      colorTheme.elements.themeOptionDark.checked = true;
    } else {
      colorTheme.elements.themeOptionSystem.checked = true;
    }
  }

  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    setTheme();
  });

  window.addEventListener('DOMContentLoaded', () => {
    setTheme();

    document.querySelectorAll('[data-color-theme-value]').forEach(input => {
      input.addEventListener('click', () => {
        const selectedTheme = input.getAttribute('data-color-theme-value');

        if (selectedTheme === 'system') {
          localStorage.removeItem('theme');
        } else {
          localStorage.setItem('theme', selectedTheme);
        }

        setTheme();
        colorTheme.elements.body.style.transition = colorTheme.transitionValue;
      });
    });
  });
})();
