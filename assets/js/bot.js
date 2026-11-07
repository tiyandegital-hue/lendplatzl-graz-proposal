/* Gasthaus Lendplatzl — WhatsApp reservation-bot chat mock (DEMO).
   Exact German strings per STITCH-EXPORT.md / STITCH-PROMPT.md.
   Confirmation uses template values [Name]/[Datum]/[Uhrzeit] filled from
   the visitor's own picks — nothing hard-coded. */
(function () {
  'use strict';

  var GREETING = 'Grüß Gott! 👋 Willkommen im Gasthaus Lendplatzl — direkt am Grazer Bauernmarkt. Womit kann ich helfen?';

  function now() {
    return new Date().toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function Bot(root) {
    this.root = root;
    this.chat = root.querySelector('.chat');
    this.state = {};
    this.busy = false;
  }

  Bot.prototype.scroll = function () {
    this.chat.scrollTop = this.chat.scrollHeight;
  };

  Bot.prototype.addMsg = function (kind, text, confirm) {
    var m = el('div', 'msg ' + kind + (confirm ? ' confirm' : ''));
    m.appendChild(document.createTextNode(text));
    var t = el('span', 'time', now());
    m.appendChild(t);
    this.chat.appendChild(m);
    this.scroll();
    return m;
  };

  Bot.prototype.typing = function (ms) {
    var self = this;
    return new Promise(function (resolve) {
      var t = el('div', 'typing');
      t.setAttribute('aria-label', 'schreibt …');
      t.appendChild(el('i')); t.appendChild(el('i')); t.appendChild(el('i'));
      self.chat.appendChild(t);
      self.scroll();
      setTimeout(function () { t.remove(); resolve(); }, ms || 900);
    });
  };

  Bot.prototype.botSay = function (text, confirm) {
    var self = this;
    return this.typing().then(function () { self.addMsg('bot', text, confirm); });
  };

  Bot.prototype.userSay = function (text) {
    this.addMsg('user', text);
  };

  Bot.prototype.chips = function (labels, handler) {
    var self = this;
    var row = el('div', 'chips');
    labels.forEach(function (label) {
      var b = el('button', 'chip', label);
      b.type = 'button';
      b.addEventListener('click', function () {
        if (self.busy) return;
        row.querySelectorAll('.chip').forEach(function (c) { c.disabled = true; });
        handler(label);
      });
      row.appendChild(b);
    });
    this.chat.appendChild(row);
    this.scroll();
    return row;
  };

  Bot.prototype.askName = function (onName) {
    var self = this;
    var row = el('div', 'bot-input');
    var input = el('input');
    input.type = 'text';
    input.placeholder = 'Ihr Name';
    input.setAttribute('aria-label', 'Ihr Name');
    input.maxLength = 60;
    var send = el('button', null, '➤');
    send.type = 'button';
    send.setAttribute('aria-label', 'Name senden');
    function submit() {
      var v = input.value.trim();
      if (!v || self.busy) return;
      self.userSay(v);
      row.remove();
      onName(v);
    }
    send.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    row.appendChild(input);
    row.appendChild(send);
    this.chat.appendChild(row);
    this.scroll();
    setTimeout(function () { input.focus({ preventScroll: true }); }, 350);
  };

  Bot.prototype.restartChip = function () {
    var self = this;
    this.chips(['↺ Von vorne beginnen'], function () { self.start(true); });
  };

  /* ---- Path A: Tisch reservieren ---- */
  Bot.prototype.pathA = function () {
    var self = this;
    return this.botSay('Sehr gerne! Für welchen Tag? 📅').then(function () {
      self.chips(['Heute', 'Morgen', 'Samstag', 'Anderes Datum'], function (day) {
        self.userSay(day);
        self.state.day = day;
        self.botSay('Und um wie viel Uhr? 🕖').then(function () {
          self.chips(['12:00', '13:00', '18:00', '19:30', '20:30'], function (time) {
            self.userSay(time);
            self.state.time = time;
            self.botSay('Für wie viele Personen? 👥').then(function () {
              self.chips(['2 Personen', '4 Personen', '6 Personen', 'Größere Gruppe'], function (persons) {
                self.userSay(persons);
                self.state.persons = persons;
                self.botSay('Perfekt! Darf ich noch Ihren Namen wissen? ✍️').then(function () {
                  self.askName(function (name) {
                    var msg = 'Vielen Dank, ' + name + '! ✅ Ihr Tisch für ' + self.state.persons +
                      ' am ' + self.state.day + ' um ' + self.state.time +
                      ' Uhr ist vorgemerkt. Wir freuen uns auf Sie — direkt am Lendplatz! ' +
                      'Eine Bestätigung kommt per WhatsApp. Bis bald! 🌿';
                    self.botSay(msg, true).then(function () { self.restartChip(); });
                  });
                });
              });
            });
          });
        });
      });
    });
  };

  /* ---- Path B: Zimmer anfragen ---- */
  Bot.prototype.pathB = function () {
    var self = this;
    return this.botSay('Gerne! Für welche Nächte? 🌙').then(function () {
      self.chips(['Dieses Wochenende', 'Nächste Woche', 'Anderes Datum'], function (nights) {
        self.userSay(nights);
        self.state.nights = nights;
        self.botSay('Welche Zimmerkategorie darf es sein?').then(function () {
          self.chips(['🌲 Holz', '🌿 Garten', '🪨 Stein', '🏙️ Stadt', '✨ Boutique'], function (cat) {
            self.userSay(cat);
            self.state.category = cat;
            self.botSay('Für wie viele Gäste? 👥').then(function () {
              self.chips(['1 Gast', '2 Gäste', 'Familie'], function (guests) {
                self.userSay(guests);
                self.state.guests = guests;
                var note = 'Wunderbar! Ihre Anfrage für ein ' + self.state.category +
                  '-Zimmer ist notiert. Wir melden uns innerhalb weniger Stunden mit Verfügbarkeit und Preis. ' +
                  'Darf ich noch Ihren Namen wissen? ✍️';
                self.botSay(note).then(function () {
                  self.askName(function (name) {
                    self.botSay('Danke, ' + name + '! ✅ Wir freuen uns auf Ihre Nachricht — und auf Sie in Graz!', true)
                      .then(function () { self.restartChip(); });
                  });
                });
              });
            });
          });
        });
      });
    });
  };

  /* ---- Path C: Speisekarte & Tages specials ---- */
  Bot.prototype.pathC = function () {
    var self = this;
    return this.botSay('Unsere Küche kocht steirisch und saisonal — die Zutaten kommen vom Bauernmarkt direkt vor der Tür. 🧺 Die heutige Karte schicke ich Ihnen hier als Übersicht. Möchten Sie gleich einen Tisch dazu reservieren?').then(function () {
      self.chips(['🍽️ Ja, Tisch reservieren', '📋 Nur Karte ansehen'], function (choice) {
        self.userSay(choice);
        if (choice.indexOf('Ja, Tisch') !== -1) {
          self.pathA();
        } else {
          self.botSay('Sehr gerne! Die Karte finden Sie auf der Seite „Gasthaus & Speisekarte". Wenn Sie doch einen Tisch möchten, tippen Sie einfach auf „Tisch reservieren".').then(function () {
            self.chips(['🍽️ Tisch reservieren'], function () {
              self.userSay('🍽️ Tisch reservieren');
              self.pathA();
            });
          });
        }
      });
    });
  };

  Bot.prototype.start = function (restart) {
    var self = this;
    this.chat.innerHTML = '';
    this.state = {};
    this.busy = false;
    var delay = restart ? 350 : 900;
    setTimeout(function () {
      self.botSay(GREETING).then(function () {
        self.chips(['🍽️ Tisch reservieren', '🛏️ Zimmer anfragen', '📋 Speisekarte & Tages specials'], function (choice) {
          self.userSay(choice);
          if (choice.indexOf('Tisch') !== -1) self.pathA();
          else if (choice.indexOf('Zimmer') !== -1) self.pathB();
          else self.pathC();
        });
      });
    }, delay);
  };

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.bot-mock').forEach(function (root) {
      var bot = new Bot(root);
      bot.start(false);
    });
    document.querySelectorAll('.bot-open-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var hint = btn.parentElement.querySelector('.demo-hint');
        if (hint) hint.classList.add('show');
      });
    });
    /* scroll reveal, 60–90ms stagger */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (n, i) {
      n.style.transitionDelay = ((i % 4) * 70) + 'ms';
      io.observe(n);
    });
    /* mobile nav */
    var burger = document.querySelector('.burger');
    var nav = document.querySelector('nav.main');
    if (burger && nav) burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
})();
