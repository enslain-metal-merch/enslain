const colorTheme = {
  storedTheme: localStorage.getItem('theme'),
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
    if (colorTheme.storedTheme) return colorTheme.storedTheme;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }

  const setTheme = function (theme) {
    if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-color-theme', 'dark')
    } else {
      document.documentElement.setAttribute('data-color-theme', theme)
    }
  }

  setTheme(getPreferredTheme())

  const showActiveTheme = () => {
    const theme = localStorage.getItem('theme');
    if (theme === 'light') {
      colorTheme.elements.themeOptionLight.checked = true;
      colorTheme.elements.headerLogoImg.src = colorTheme.logoImages.headerLight;
    } else if (theme === 'dark') {
      colorTheme.elements.themeOptionDark.checked = true;
      colorTheme.elements.headerLogoImg.src = colorTheme.logoImages.headerDark;
    }
    else {
      colorTheme.elements.themeOptionSystem.checked = true;
      colorTheme.elements.headerLogoImg.src = colorTheme.logoImages.headerDark;
    }
  }
  /*
  const showActiveTheme = theme => {
    if (theme === 'light') {
      colorTheme.elements.themeOptionLight.checked = true;
    } else if (theme === 'dark') {
      colorTheme.elements.themeOptionDark.checked = true;
    }
    else {
      colorTheme.elements.themeOptionSystem.checked = true;
    }
  }
  */

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (colorTheme.storedTheme !== 'light' || colorTheme.storedTheme !== 'dark') {
      setTheme(getPreferredTheme())
    }
  })

  window.addEventListener('DOMContentLoaded', () => {
    showActiveTheme();
    // showActiveTheme(getPreferredTheme());
    
    document.querySelectorAll('[data-color-theme-value]')
      .forEach(input => {
        input.addEventListener('click', () => {
          const theme = input.getAttribute('data-color-theme-value');

          if (theme === 'system') {
            localStorage.removeItem('theme');
            setTheme(getPreferredTheme());
          } else {
            localStorage.setItem('theme', theme);
            setTheme(theme);
            showActiveTheme();
            // showActiveTheme(theme);
          }


          colorTheme.elements.body.style.transition = colorTheme.transitionValue;
        });
      });
  })  
})();
