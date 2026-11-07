// Frutiger Aero desktop: window manager, taskbar, start menu and clock.
(function () {
  'use strict';

  var desktop = document.getElementById('desktop');
  var taskbarWindows = document.getElementById('taskbar-windows');
  var startButton = document.querySelector('.start-button');
  var startMenu = document.getElementById('start-menu');
  var clock = document.getElementById('clock');

  var coarsePointer = window.matchMedia('(pointer: coarse)');
  var smallScreen = window.matchMedia('(max-width: 640px)');

  var DEFAULT_WINDOW = 'about';
  var windows = {};   // id -> { el, button, placed }
  var topZ = 10;
  var cascade = 0;
  var activeId = null;

  // ---------- Window state ----------

  function openWindow(id) {
    var win = windows[id];
    if (!win) return;

    win.el.classList.add('is-open');
    win.el.classList.remove('is-minimized');

    // Place after showing it, so its size is known
    if (!win.placed) {
      placeWindow(win.el);
      win.placed = true;
    }

    // Load lazy content (the CV iframe) on first open
    win.el.querySelectorAll('iframe[data-src]').forEach(function (frame) {
      frame.src = frame.getAttribute('data-src');
      frame.removeAttribute('data-src');
    });

    if (!win.button) win.button = createTaskbarButton(id);

    focusWindow(id);
  }

  function closeWindow(id) {
    var win = windows[id];
    win.el.classList.remove('is-open', 'is-minimized', 'is-maximized');
    setMaximizeLabel(win.el, false);
    if (win.button) {
      win.button.remove();
      win.button = null;
    }
    if (activeId === id) focusTopmost();
  }

  function minimizeWindow(id) {
    windows[id].el.classList.add('is-minimized');
    if (activeId === id) focusTopmost();
  }

  function toggleMaximize(id) {
    var el = windows[id].el;
    var maximized = el.classList.toggle('is-maximized');
    setMaximizeLabel(el, maximized);
  }

  function setMaximizeLabel(el, maximized) {
    var button = el.querySelector('[data-action="maximize"]');
    button.setAttribute('aria-label', maximized ? 'Restore' : 'Maximize');
  }

  function isVisible(win) {
    return win.el.classList.contains('is-open') && !win.el.classList.contains('is-minimized');
  }

  function focusWindow(id) {
    activeId = id;
    Object.keys(windows).forEach(function (key) {
      var win = windows[key];
      var active = key === id;
      win.el.classList.toggle('active', active);
      if (win.button) {
        win.button.classList.toggle('is-active', active);
        win.button.setAttribute('aria-pressed', String(active));
      }
    });
    if (id) {
      windows[id].el.style.zIndex = ++topZ;
      history.replaceState(null, '', '#' + id);
    } else {
      history.replaceState(null, '', location.pathname + location.search);
    }
  }

  function focusTopmost() {
    var best = null;
    Object.keys(windows).forEach(function (key) {
      var win = windows[key];
      if (!isVisible(win)) return;
      if (!best || Number(win.el.style.zIndex) > Number(windows[best].el.style.zIndex)) best = key;
    });
    focusWindow(best);
  }

  // Cascade new windows to the right of the desktop icons
  function placeWindow(el) {
    var maxLeft = Math.max(0, desktop.clientWidth - el.offsetWidth);
    var maxTop = Math.max(0, desktop.clientHeight - el.offsetHeight);
    el.style.left = Math.min(120 + cascade * 28, maxLeft) + 'px';
    el.style.top = Math.min(16 + cascade * 28, maxTop) + 'px';
    cascade = (cascade + 1) % 6;
  }

  // Keep windows reachable after the browser is resized
  function clampWindow(el) {
    var left = parseInt(el.style.left, 10) || 0;
    var top = parseInt(el.style.top, 10) || 0;
    el.style.left = Math.min(Math.max(left, 60 - el.offsetWidth), desktop.clientWidth - 60) + 'px';
    el.style.top = Math.min(Math.max(top, 0), desktop.clientHeight - 24) + 'px';
  }

  // ---------- Dragging ----------

  function makeDraggable(el) {
    var titleBar = el.querySelector('.title-bar');
    var startX, startY, startLeft, startTop;

    titleBar.addEventListener('pointerdown', function (event) {
      if (event.button !== 0 || event.target.closest('button')) return;
      if (el.classList.contains('is-maximized') || smallScreen.matches) return;
      startX = event.clientX;
      startY = event.clientY;
      startLeft = el.offsetLeft;
      startTop = el.offsetTop;
      titleBar.setPointerCapture(event.pointerId);
    });

    titleBar.addEventListener('pointermove', function (event) {
      if (!titleBar.hasPointerCapture(event.pointerId)) return;
      el.style.left = startLeft + event.clientX - startX + 'px';
      el.style.top = startTop + event.clientY - startY + 'px';
      clampWindow(el);
    });

    titleBar.addEventListener('pointerup', function (event) {
      if (titleBar.hasPointerCapture(event.pointerId)) titleBar.releasePointerCapture(event.pointerId);
    });

    titleBar.addEventListener('dblclick', function (event) {
      if (!event.target.closest('button') && !smallScreen.matches) toggleMaximize(el.dataset.window);
    });
  }

  // ---------- Taskbar ----------

  function createTaskbarButton(id) {
    var el = windows[id].el;
    var button = document.createElement('button');
    button.type = 'button';

    var icon = document.createElement('img');
    icon.src = el.dataset.icon;
    icon.alt = '';
    icon.width = 16;
    icon.height = 16;

    var label = document.createElement('span');
    label.textContent = el.querySelector('.title-bar-text').textContent.trim();

    button.append(icon, label);
    button.addEventListener('click', function () {
      if (activeId === id && isVisible(windows[id])) minimizeWindow(id);
      else openWindow(id);
    });

    taskbarWindows.appendChild(button);
    return button;
  }

  function toggleStartMenu(open) {
    startMenu.hidden = !open;
    startButton.setAttribute('aria-expanded', String(open));
  }

  function updateClock() {
    clock.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  // ---------- Desktop icons ----------

  function selectIcon(icon) {
    document.querySelectorAll('.desktop-icon.is-selected').forEach(function (other) {
      other.classList.remove('is-selected');
    });
    if (icon) icon.classList.add('is-selected');
  }

  function setUpIcons() {
    document.querySelectorAll('.desktop-icon').forEach(function (icon) {
      icon.addEventListener('click', function (event) {
        event.preventDefault();
        selectIcon(icon);
        // Touch and keyboard (detail === 0) open on a single activation; mouse needs a double-click
        if (coarsePointer.matches || event.detail === 0) openWindow(icon.dataset.open);
      });
      icon.addEventListener('dblclick', function (event) {
        event.preventDefault();
        openWindow(icon.dataset.open);
      });
    });
  }

  // ---------- Init ----------

  document.querySelectorAll('.app-window').forEach(function (el) {
    var id = el.dataset.window;
    windows[id] = { el: el, button: null, placed: false };

    el.addEventListener('pointerdown', function () {
      if (activeId !== id) focusWindow(id);
    });

    el.querySelector('.title-bar-controls').addEventListener('click', function (event) {
      var button = event.target.closest('button');
      if (!button) return;
      var action = button.dataset.action;
      if (action === 'minimize') minimizeWindow(id);
      else if (action === 'maximize') toggleMaximize(id);
      else if (action === 'close') closeWindow(id);
    });

    makeDraggable(el);
  });

  setUpIcons();

  startButton.addEventListener('click', function (event) {
    event.stopPropagation();
    toggleStartMenu(startMenu.hidden);
  });

  startMenu.addEventListener('click', function (event) {
    var button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.open) openWindow(button.dataset.open);
    if (button.dataset.action === 'close-all') Object.keys(windows).forEach(closeWindow);    toggleStartMenu(false);
  });

  document.addEventListener('click', function (event) {
    if (!startMenu.hidden && !startMenu.contains(event.target)) toggleStartMenu(false);
  });

  desktop.addEventListener('pointerdown', function (event) {
    if (event.target === desktop || event.target.classList.contains('desktop-icons')) selectIcon(null);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (!startMenu.hidden) {
      toggleStartMenu(false);
      startButton.focus();
    } else if (activeId) {
      closeWindow(activeId);
    }
  });

  window.addEventListener('hashchange', function () {
    var id = location.hash.slice(1);
    if (windows[id] && activeId !== id) openWindow(id);
  });

  window.addEventListener('resize', function () {
    Object.keys(windows).forEach(function (key) {
      if (windows[key].placed) clampWindow(windows[key].el);
    });
  });

  updateClock();
  setInterval(updateClock, 15000);

  var initial = location.hash.slice(1);
  openWindow(windows[initial] ? initial : DEFAULT_WINDOW);
})();
