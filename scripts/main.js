'use strict';

function main() {
  if (window.Patronen2026 && typeof window.Patronen2026.initLayout === 'function') {
    window.Patronen2026.initLayout();
  }
}

document.addEventListener('DOMContentLoaded', main);
