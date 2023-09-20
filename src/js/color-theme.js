const colorTheme = {
  storedTheme: localStorage.getItem('theme'),
  transitionValue: "var(--theme-change-transition)", 
  elements: {
    toggleButtons: document.querySelectorAll('.header__color-theme-toggle'),
    toggleButtonLight: document.querySelector('.header__color-theme-toggle--light'),
    toggleButtonDark: document.querySelector('.header__color-theme-toggle--dark'),
    body: document.querySelector('body')
  }
};

(function () {
  const getPreferredTheme = () => {
    if (colorTheme.storedTheme) return colorTheme.storedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const setTheme = function (theme) {
    if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-color-theme', 'dark')
    } else {
      document.documentElement.setAttribute('data-color-theme', theme)
    }
  }

  setTheme(getPreferredTheme())

  const showActiveTheme = theme => {
    if (theme === 'light') {
      colorTheme.elements.toggleButtonLight.classList.add('hidden');
      colorTheme.elements.toggleButtonDark.classList.remove('hidden');
    } else {
      colorTheme.elements.toggleButtonDark.classList.add('hidden');
      colorTheme.elements.toggleButtonLight.classList.remove('hidden');
    }
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (colorTheme.storedTheme !== 'light' || colorTheme.storedTheme !== 'dark') {
      setTheme(getPreferredTheme())
    }
  })

  window.addEventListener('DOMContentLoaded', () => {
    showActiveTheme(getPreferredTheme())

  document.querySelectorAll('[data-color-theme-value]')
    .forEach(toggle => {
      toggle.addEventListener('click', () => {
        const theme = toggle.getAttribute('data-color-theme-value')
        localStorage.setItem('theme', theme)
        setTheme(theme)
        showActiveTheme(theme)
        colorTheme.elements.body.style.transition = colorTheme.transitionValue;
      })
    })
  })
})();
