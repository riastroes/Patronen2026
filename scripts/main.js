'use strict';

function main() {
  if (window.Ontwerpstudio2026 && typeof window.Ontwerpstudio2026.initLayout === 'function') {
    window.Ontwerpstudio2026.initLayout();
  }
}

document.addEventListener('DOMContentLoaded', main);
