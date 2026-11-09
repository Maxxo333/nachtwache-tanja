/* Nachtwache mit Tanja – App-Logik (ohne Build, ohne Bibliotheken) */
(function () {
  'use strict';

  var SPEICHER_SCHLUESSEL = 'nachtwache.v1';
  var NAME = 'Tanja';

  // ---------- Speicher (localStorage, robust gegen Fehler) ----------
  var zustand = laden();

  function laden() {
    var leer = { eigeneAufmunterungen: [], zuletzt: {}, gedimmt: false, gross: false };
    try {
      var roh = localStorage.getItem(SPEICHER_SCHLUESSEL);
      if (!roh) return leer;
      var d = JSON.parse(roh);
      return {
        eigeneAufmunterungen: Array.isArray(d.eigeneAufmunterungen) ? d.eigeneAufmunterungen.filter(function (t) { return typeof t === 'string'; }) : [],
        zuletzt: d.zuletzt && typeof d.zuletzt === 'object' ? d.zuletzt : {},
        gedimmt: !!d.gedimmt,
        gross: !!d.gross
      };
    } catch (e) { return leer; }
  }

  function speichern() {
    try { localStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(zustand)); } catch (e) { /* z. B. privater Modus */ }
  }

  // ---------- Hilfen ----------
  function $(id) { return document.getElementById(id); }

  // Zufällig wählen, ohne die zuletzt gezeigten Einträge gleich zu wiederholen
  function zufallOhneWiederholung(typ, anzahl) {
    if (anzahl <= 0) return -1;
    var verlauf = Array.isArray(zustand.zuletzt[typ]) ? zustand.zuletzt[typ] : [];
    var merken = Math.min(Math.floor(anzahl / 2), 8);
    var moeglich = [];
    for (var i = 0; i < anzahl; i++) if (verlauf.indexOf(i) === -1) moeglich.push(i);
    if (!moeglich.length) moeglich = Array.from({ length: anzahl }, function (_, k) { return k; });
    var wahl = moeglich[Math.floor(Math.random() * moeglich.length)];
    verlauf = verlauf.concat(wahl).slice(-merken);
    zustand.zuletzt[typ] = merken > 0 ? verlauf : [];
    speichern();
    return wahl;
  }

  function zufall(liste) { return liste[Math.floor(Math.random() * liste.length)]; }

  function alleAufmunterungen() {
    var aus_datei = (typeof AUFMUNTERUNGEN !== 'undefined' && Array.isArray(AUFMUNTERUNGEN)) ? AUFMUNTERUNGEN : [];
    return aus_datei.concat(zustand.eigeneAufmunterungen);
  }

  // ---------- Ansichten ----------
  var ANSICHTEN = ['start', 'karte', 'wortkette', 'checkin', 'einstellungen'];
  var aktuelleAnsicht = 'start';

  function zeige(name) {
    ANSICHTEN.forEach(function (n) { $('ansicht-' + n).hidden = (n !== name); });
    // Verlaufseintrag, damit die Android-Zurück-Taste zur Startseite führt statt die App zu schließen
    if (name !== 'start' && !(history.state && history.state.nachtwache)) {
      try { history.pushState({ nachtwache: true }, ''); } catch (e) { /* egal */ }
    }
    aktuelleAnsicht = name;
    var el = $('ansicht-' + name);
    el.classList.remove('einblenden'); void el.offsetWidth; el.classList.add('einblenden');
    window.scrollTo(0, 0);
  }

  function zurueck() {
    if (history.state && history.state.nachtwache) { history.back(); return; } // popstate erledigt den Rest
    begruessen(); zeige('start');
  }

  // ---------- Begrüßung: man sieht sofort, dass die App für Tanja ist ----------
  function begruessen() {
    var h = new Date().getHours();
    var gruss, unter;
    if (h >= 5 && h < 8) { gruss = 'Guten Morgen, ' + NAME + ' ☀️'; unter = 'Fast geschafft! Der Feierabend ist in Sicht.'; }
    else if (h >= 8 && h < 17) { gruss = 'Hallo ' + NAME + ' 👋'; unter = 'Schön, dass du vorbeischaust.'; }
    else if (h >= 17 && h < 22) { gruss = 'Guten Abend, ' + NAME + ' 🌙'; unter = 'Bereit für die Nacht? Ich bin dabei.'; }
    else { gruss = 'Schöne Nachtwache, ' + NAME + ' 🌙'; unter = 'Schön, dass du da bist. Gönn dir einen kurzen Moment.'; }
    $('gruss').textContent = gruss;
    $('unterzeile').textContent = unter;

    var absender = (typeof ABSENDER === 'string') ? ABSENDER.trim() : '';
    $('fuss').textContent = absender
      ? 'Mit Liebe für ' + NAME + ' gemacht – von ' + absender + ' 💛'
      : 'Mit Liebe für ' + NAME + ' gemacht 💛';
  }

  // ---------- Karten ----------
  var letzterTyp = null;     // Typ der aktuell gezeigten Karte
  var zufallsModus = false;  // „Noch eins“ wählt wieder zufällig?

  var ETIKETTEN = {
    frage: '💬 Gesprächsfrage',
    fakt: '🦉 Kurioser Fakt',
    witz: '😄 Kleiner Witz',
    wde: '⚖️ Würdest du eher …?',
    aufmunterung: '💛 Für dich, ' + NAME
  };

  function karteZuruecksetzen() {
    $('wde-wahl').hidden = true;
    $('knopf-aufloesen').hidden = true;
    $('karte-zusatz').hidden = true;
    $('karte-zusatz').textContent = '';
    ['wde-a', 'wde-b'].forEach(function (id) { $(id).classList.remove('gewaehlt'); $(id).disabled = false; });
  }

  function zeigeKarte(typ) {
    karteZuruecksetzen();
    letzterTyp = typ;
    $('karte-etikett').textContent = ETIKETTEN[typ];
    var text = $('karte-text');

    if (typ === 'frage') {
      text.textContent = INHALTE.fragen[zufallOhneWiederholung('frage', INHALTE.fragen.length)];
    } else if (typ === 'fakt') {
      text.textContent = 'Wusstest du schon? ' + INHALTE.fakten[zufallOhneWiederholung('fakt', INHALTE.fakten.length)];
    } else if (typ === 'witz') {
      var w = INHALTE.witze[zufallOhneWiederholung('witz', INHALTE.witze.length)];
      text.textContent = w.frage;
      $('karte-zusatz').textContent = w.pointe;
      $('knopf-aufloesen').hidden = false;
    } else if (typ === 'wde') {
      var p = INHALTE.wuerdestDuEher[zufallOhneWiederholung('wde', INHALTE.wuerdestDuEher.length)];
      text.textContent = 'Würdest du eher …';
      $('wde-a').textContent = p[0];
      $('wde-b').textContent = p[1];
      $('wde-wahl').hidden = false;
    } else if (typ === 'aufmunterung') {
      var liste = alleAufmunterungen();
      text.textContent = liste.length
        ? liste[zufallOhneWiederholung('aufmunterung', liste.length)]
        : 'Du bist großartig, ' + NAME + '. 💛';
    }
    zeige('karte');
  }

  function zufallsKarte() {
    var typen = ['frage', 'fakt', 'witz', 'wde', 'aufmunterung'];
    var moeglich = typen.filter(function (t) { return t !== letzterTyp; });
    zeigeKarte(zufall(moeglich));
  }

  // ---------- Wortkette ----------
  var wk = { benutzt: [], letztes: '', punkte: 0, vorbei: false };

  function normalisieren(wort) {
    // ä→a, é→e usw., ß→ss; damit zählt bei „Menü“ das „U“ als Endbuchstabe
    return wort.trim().toLowerCase().replace(/ß/g, 'ss')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z]/g, '');
  }
  function letzterBuchstabe(wort) { var n = normalisieren(wort); return n.charAt(n.length - 1); }

  function wkAppWort(buchstabe) {
    var passend = INHALTE.woerter.filter(function (w) {
      var n = normalisieren(w);
      return n.charAt(0) === buchstabe && wk.benutzt.indexOf(n) === -1;
    });
    return passend.length ? zufall(passend) : null;
  }

  function wkAnzeigen(meldung) {
    $('wk-wort').textContent = wk.letztes;
    $('wk-meldung').textContent = meldung || '';
    $('wk-stand').textContent = wk.punkte === 1 ? 'Du hast 1 Wort gefunden.' : 'Du hast ' + wk.punkte + ' Wörter gefunden.';
    $('wk-eingabe').disabled = wk.vorbei;
    $('wk-los').disabled = wk.vorbei;
  }

  function wkNeu() {
    wk = { benutzt: [], letztes: '', punkte: 0, vorbei: false };
    var start = zufall(INHALTE.woerter);
    wk.letztes = start;
    wk.benutzt.push(normalisieren(start));
    $('wk-eingabe').value = '';
    wkAnzeigen('Ich fange an! Dein Wort beginnt mit „' + letzterBuchstabe(start).toUpperCase() + '“.');
  }

  function wkZug(eingabe) {
    if (wk.vorbei) return;
    var n = normalisieren(eingabe);
    var noetig = letzterBuchstabe(wk.letztes);
    if (n.length < 2) { wkAnzeigen('Das ist ein bisschen kurz. Versuch’s mit einem richtigen Wort. 🙂'); return; }
    if (n.charAt(0) !== noetig) { wkAnzeigen('Fast! Dein Wort muss mit „' + noetig.toUpperCase() + '“ anfangen.'); return; }
    if (wk.benutzt.indexOf(n) !== -1) { wkAnzeigen('„' + eingabe.trim() + '“ hatten wir schon. Fällt dir ein anderes ein?'); return; }

    wk.benutzt.push(n);
    wk.punkte++;
    var antwort = wkAppWort(letzterBuchstabe(n));
    if (!antwort) {
      wk.letztes = eingabe.trim();
      wk.vorbei = true;
      $('wk-eingabe').value = '';
      wkAnzeigen('Mir fällt nichts mehr ein – du gewinnst, ' + NAME + '! 🏆 Tippe auf „Neue Runde“ für eine Revanche.');
      return;
    }
    wk.benutzt.push(normalisieren(antwort));
    wk.letztes = antwort;
    $('wk-eingabe').value = '';
    wkAnzeigen(zufall(['Gut! ', 'Stark! ', 'Schön! ', 'Ha, nicht schlecht! ']) + 'Mein Wort: ' + antwort + '. Jetzt du mit „' + letzterBuchstabe(antwort).toUpperCase() + '“.');
  }

  // ---------- Check-in ----------
  function checkinZuruecksetzen() {
    document.querySelectorAll('#checkin-wahl .knopf-wahl').forEach(function (k) { k.classList.remove('gewaehlt'); });
    $('checkin-antwort').hidden = true;
  }

  // ---------- Einstellungen & eigene Aufmunterungen ----------
  function darstellungAnwenden() {
    document.documentElement.classList.toggle('gedimmt', zustand.gedimmt);
    document.documentElement.classList.toggle('gross', zustand.gross);
    $('schalter-gedimmt').checked = zustand.gedimmt;
    $('schalter-gross').checked = zustand.gross;
  }

  function aufmunterungenListe() {
    var ul = $('auf-liste');
    ul.textContent = '';
    if (!zustand.eigeneAufmunterungen.length) {
      var leer = document.createElement('li');
      leer.textContent = 'Noch keine eigenen Aufmunterungen.';
      ul.appendChild(leer);
      return;
    }
    zustand.eigeneAufmunterungen.forEach(function (t, i) {
      var li = document.createElement('li');
      var s = document.createElement('span');
      s.textContent = t;
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = '✕';
      b.setAttribute('aria-label', 'Aufmunterung löschen');
      b.addEventListener('click', function () {
        if (!window.confirm('Diese Aufmunterung wirklich löschen?')) return;
        zustand.eigeneAufmunterungen.splice(i, 1);
        zustand.zuletzt.aufmunterung = [];
        speichern();
        aufmunterungenListe();
      });
      li.appendChild(s); li.appendChild(b);
      ul.appendChild(li);
    });
  }

  // ---------- Ereignisse ----------
  function einrichten() {
    begruessen();
    darstellungAnwenden();

    $('knopf-zufall').addEventListener('click', function () { zufallsModus = true; zufallsKarte(); });

    document.querySelectorAll('.kachel').forEach(function (k) {
      k.addEventListener('click', function () {
        var typ = k.getAttribute('data-typ');
        zufallsModus = false;
        if (typ === 'wortkette') { wkNeu(); zeige('wortkette'); $('wk-eingabe').focus(); }
        else if (typ === 'checkin') { checkinZuruecksetzen(); zeige('checkin'); }
        else zeigeKarte(typ);
      });
    });

    $('knopf-nochmal').addEventListener('click', function () {
      if (zufallsModus) zufallsKarte(); else zeigeKarte(letzterTyp);
    });

    $('knopf-aufloesen').addEventListener('click', function () {
      $('karte-zusatz').hidden = false;
      $('knopf-aufloesen').hidden = true;
    });

    ['wde-a', 'wde-b'].forEach(function (id) {
      $(id).addEventListener('click', function () {
        $('wde-a').disabled = true; $('wde-b').disabled = true;
        $(id).classList.add('gewaehlt');
        $('karte-zusatz').textContent = zufall(INHALTE.wdeReaktionen);
        $('karte-zusatz').hidden = false;
      });
    });

    $('wk-formular').addEventListener('submit', function (e) {
      e.preventDefault();
      wkZug($('wk-eingabe').value);
      if (!wk.vorbei) $('wk-eingabe').focus();
    });
    $('wk-neu').addEventListener('click', function () { wkNeu(); $('wk-eingabe').focus(); });

    document.querySelectorAll('#checkin-wahl .knopf-wahl').forEach(function (k) {
      k.addEventListener('click', function () {
        checkinZuruecksetzen();
        k.classList.add('gewaehlt');
        var antworten = INHALTE.checkin[k.getAttribute('data-stimmung')] || [];
        $('checkin-antwort').textContent = antworten.length ? zufall(antworten) : 'Danke, dass du’s mir sagst, ' + NAME + '.';
        $('checkin-antwort').hidden = false;
      });
    });

    $('knopf-einstellungen').addEventListener('click', function () {
      if (aktuelleAnsicht === 'einstellungen') { zurueck(); return; }
      aufmunterungenListe();
      zeige('einstellungen');
    });
    $('schalter-gedimmt').addEventListener('change', function (e) { zustand.gedimmt = e.target.checked; speichern(); darstellungAnwenden(); });
    $('schalter-gross').addEventListener('change', function (e) { zustand.gross = e.target.checked; speichern(); darstellungAnwenden(); });

    $('auf-formular').addEventListener('submit', function (e) {
      e.preventDefault();
      var t = $('auf-eingabe').value.trim();
      if (!t) return;
      zustand.eigeneAufmunterungen.push(t.slice(0, 300));
      zustand.zuletzt.aufmunterung = [];
      speichern();
      $('auf-eingabe').value = '';
      aufmunterungenListe();
    });

    document.querySelectorAll('[data-zurueck]').forEach(function (b) {
      b.addEventListener('click', zurueck);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && aktuelleAnsicht !== 'start') zurueck();
    });
    window.addEventListener('popstate', function () {
      if (aktuelleAnsicht !== 'start') { begruessen(); zeige('start'); }
    });

    // Gruß aktualisieren, wenn die App nach längerer Pause wieder geöffnet wird
    document.addEventListener('visibilitychange', function () { if (!document.hidden) begruessen(); });
  }

  einrichten();

  // ---------- Offline-Fähigkeit ----------
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline-Funktion optional */ });
    });
  }
})();
