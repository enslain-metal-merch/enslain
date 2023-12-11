const readerMode = {
  storedReaderMode: localStorage.getItem('readerTheme'),
  body: document.querySelector('body'),
  chrissyModeOn: document.getElementById('chrissy-reader-on'),
  chrissyModeOff: document.getElementById('chrissy-reader-off')
};

(function () {
  if (readerMode.storedReaderMode === 'chrissy') {
    document.documentElement.setAttribute('data-reader-mode', 'chrissy');
    readerMode.chrissyModeOn.setAttribute('checked', 'true');
    readerMode.chrissyModeOff.removeAttribute('checked');
  }
})();

function activateChrissyMode() {
  localStorage.setItem('readerTheme', 'chrissy');
  document.documentElement.setAttribute('data-reader-mode', 'chrissy');
}

function deactivateChrissyMode() {
  localStorage.removeItem('readerTheme', 'chrissyMode');
  document.documentElement.removeAttribute('data-reader-mode', 'chrissy');
}

readerMode.chrissyModeOn.addEventListener('click', function() {
  activateChrissyMode();
})

readerMode.chrissyModeOff.addEventListener('click', function() {
  deactivateChrissyMode();
})
