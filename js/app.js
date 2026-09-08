/* =====================================================================
   APPLICATION — accueil, configuration, paramètres, éditeur, câblage
   ===================================================================== */
(function(global){
  "use strict";
  var $ = UI.$;

  /* ---------- réglages persistants ---------- */
  var DEFAULT_RULES = { whiteGuess:true, whiteNotFirst:true, announce:true, emblem:true, tieWins:true, hideRoles:false };
  var DEFAULT_POINTS = { civilAlive:3, civilDead:2, undercover:4, white:6, whiteGuess:8 };
  var DIFF_LABELS = { 1:"facile", 2:"intermédiaire", 3:"hardcore" };

  var SETTINGS = {
    appearance:"auto", diff:2,
    rules: JSON.parse(JSON.stringify(DEFAULT_RULES)),
    points: JSON.parse(JSON.stringify(DEFAULT_POINTS)),
    undercover:1, white:0, timer:0, tieRule:"revote", firstVoteAfter:1,
    sel:{ customWords:false, mode:"theme", serieId:"random", themeId:"random", custom:["",""] },
    players:[]
  };
  (function loadSettings(){
    var saved = Store.get("settings", null);
    if (!saved) return;
    Object.keys(saved).forEach(function(k){
      if (k === "rules" || k === "points" || k === "sel"){ Object.keys(saved[k] || {}).forEach(function(j){ SETTINGS[k][j] = saved[k][j]; }); }
      else SETTINGS[k] = saved[k];
    });
  })();
  function saveSettings(){ Store.set("settings", SETTINGS); }

  var ACTIVE = null;              /* contrôleur qui possède l'écran de partie : Local ou Online */
  var configCount = function(){ return SETTINGS.players.length; };
  var returnScreen = null;        /* écran à retrouver en quittant les paramètres ou l'éditeur */

  function getConfig(){
    var c = { undercover:SETTINGS.undercover, white:SETTINGS.white, timer:SETTINGS.timer, tieRule:SETTINGS.tieRule,
      firstVoteAfter:SETTINGS.firstVoteAfter, points:SETTINGS.points };
    Object.keys(SETTINGS.rules).forEach(function(k){ c[k] = SETTINGS.rules[k]; });
    return c;
  }
  function getSelection(){
    var s = JSON.parse(JSON.stringify(SETTINGS.sel));
    s.custom = [$("word-civil").value.trim(), $("word-under").value.trim()];
    return s;
  }
  function drawPair(){ return WordBank.draw(getSelection(), SETTINGS.diff); }
  function problem(count){
    var err = Engine.validate(count, getConfig());
    if (err) return err;
    var sel = getSelection();
    if (sel.customWords){
      if (!sel.custom[0] || !sel.custom[1]) return "Renseignez les deux mots.";
      if (Engine.norm(sel.custom[0]) === Engine.norm(sel.custom[1])) return "Les deux mots doivent être différents.";
    } else if (WordBank.poolSize(sel, SETTINGS.diff) === 0){
      return "Aucun duo disponible pour cette sélection.";
    }
    return null;
  }

  /* ---------- panneau de configuration ---------- */
  function moveConfigPanel(slotId){
    var panel = $("config-panel"), slot = $(slotId);
    if (panel.parentNode !== slot) slot.appendChild(panel);
  }
  function setConfigCount(fn){ configCount = fn; }
  function pressGroup(selector, attr, value){
    var btns = document.querySelectorAll(selector);
    for (var i=0;i<btns.length;i++) btns[i].setAttribute("aria-pressed", String(btns[i].getAttribute(attr) === String(value)));
  }

  function renderConfig(){
    $("out-undercover").textContent = SETTINGS.undercover;
    $("out-white").textContent = SETTINGS.white;
    $("out-timer").textContent = SETTINGS.timer ? SETTINGS.timer + " s" : "Aucun";
    pressGroup("[data-tie]", "data-tie", SETTINGS.tieRule);
    pressGroup("[data-first-vote]", "data-first-vote", SETTINGS.firstVoteAfter);
    pressGroup("[data-diff]", "data-diff", SETTINGS.diff);
    var st = WordBank.stats();
    $("diff-note").textContent = "Niveau " + DIFF_LABELS[SETTINGS.diff] + ". " + st.tagged + " duos sur " + st.total +
      " portent un niveau dans js/words.js et ne sortent qu'à leur niveau ; les autres sortent toujours.";

    var n = configCount(), imp = SETTINGS.undercover + SETTINGS.white, civ = n - imp, tally = $("tally-config");
    if (n === 0){ tally.textContent = "En attente de joueurs."; tally.className = "tally"; }
    else if (civ <= imp || civ < 2){ tally.textContent = "Les civils doivent être plus nombreux que les intrus (" + n + " joueur" + (n>1?"s":"") + ")."; tally.className = "tally bad"; }
    else { tally.textContent = civ + " civils · " + SETTINGS.undercover + " undercover · " + SETTINGS.white + " Mr White"; tally.className = "tally"; }

    $("tab-random").setAttribute("aria-pressed", String(!SETTINGS.sel.customWords));
    $("tab-custom").setAttribute("aria-pressed", String(SETTINGS.sel.customWords));
    $("pair-inputs").hidden = !SETTINGS.sel.customWords;
    $("theme-zone").hidden = SETTINGS.sel.customWords;
    pressGroup("[data-mode]", "data-mode", SETTINGS.sel.mode);
    renderSeries();
    $("theme-note").textContent = WordBank.describe(getSelection(), SETTINGS.diff);
    var err = problem(configCount());
    $("start").disabled = !!err;
    $("lobby-start").disabled = !!err;
  }

  function renderSeries(){
    var box = $("series");
    UI.clear(box);
    var sel = SETTINGS.sel;
    box.hidden = (sel.mode === "mix");
    if (sel.mode === "mix") return;
    var list = WordBank.activeList(sel), cur = WordBank.activeId(sel);
    var mk = function(id, label, wide){
      var b = UI.el("button", wide ? "wide" : "", label);
      b.type = "button";
      b.setAttribute("aria-pressed", String(cur === id));
      b.addEventListener("click", function(){
        if (sel.mode === "theme") sel.themeId = id; else sel.serieId = id;
        saveSettings(); renderConfig();
      });
      box.appendChild(b);
    };
    mk("random", sel.mode === "theme" ? "Thème au hasard" : "Anime au hasard", true);
    list.forEach(function(g){ mk(g.id, g.label, false); });
  }

  function onGroup(selector, attr, fn){
    var btns = document.querySelectorAll(selector);
    for (var i=0;i<btns.length;i++){
      btns[i].addEventListener("click", function(){ fn(this.getAttribute(attr)); saveSettings(); renderConfig(); });
    }
  }
  function bindConfig(){
    var steps = document.querySelectorAll("[data-step]");
    for (var i=0;i<steps.length;i++){
      steps[i].addEventListener("click", function(){
        var key = this.getAttribute("data-step"), d = parseInt(this.getAttribute("data-delta"),10);
        if (key === "timer") SETTINGS.timer = Math.min(180, Math.max(0, SETTINGS.timer + d));
        else SETTINGS[key] = Math.max(0, SETTINGS[key] + d);
        saveSettings(); renderConfig();
      });
    }
    onGroup("[data-tie]", "data-tie", function(v){ SETTINGS.tieRule = v; });
    onGroup("[data-first-vote]", "data-first-vote", function(v){ SETTINGS.firstVoteAfter = parseInt(v,10); });
    onGroup("[data-diff]", "data-diff", function(v){ SETTINGS.diff = parseInt(v,10); });
    onGroup("[data-mode]", "data-mode", function(v){ SETTINGS.sel.mode = v; });
    $("tab-random").addEventListener("click", function(){ SETTINGS.sel.customWords = false; saveSettings(); renderConfig(); });
    $("tab-custom").addEventListener("click", function(){ SETTINGS.sel.customWords = true; saveSettings(); renderConfig(); });
    $("word-civil").addEventListener("input", renderConfig);
    $("word-under").addEventListener("input", renderConfig);
  }

  /* ---------- navigation ---------- */
  function goHome(){
    UI.stopTimer();
    UI.show("screen-home");
    var hasLocal = Local.hasGame() && Local.inProgress();
    var savedOnline = Online.savedRoom();
    $("home-resume-block").hidden = !(hasLocal || savedOnline);
    $("home-resume-local").hidden = !hasLocal;
    $("home-resume-online").hidden = !savedOnline;
    if (savedOnline) $("home-resume-online").textContent = "Rejoindre le salon " + savedOnline.code + " (" + savedOnline.name + ")";
    var ok = Online.available();
    $("home-create").disabled = !ok;
    $("home-join").disabled = !ok;
    $("home-online-note").textContent = ok ? "Chaque joueur voit sa carte sur son propre téléphone. Le salon reste ouvert tant qu'un joueur y est connecté." : Online.unavailableReason();
    var savedName = Store.get("name", "");
    if (savedName && !$("home-name").value) $("home-name").value = savedName;
  }
  function showSetup(){
    UI.show("screen-setup");
    moveConfigPanel("config-slot-local");
    setConfigCount(function(){ return SETTINGS.players.length; });
    renderPlayers();
    renderConfig();
  }
  function openSettings(scrollToRules){
    returnScreen = UI.currentScreen();
    renderRules();
    UI.show("screen-settings");
    if (scrollToRules){ setTimeout(function(){ $("rules-card").scrollIntoView({ behavior:"smooth", block:"start" }); }, 30); }
  }
  function goBack(){
    var to = returnScreen; returnScreen = null;
    if (to === "screen-setup"){ showSetup(); return; }
    if ((to === "screen-play" || to === "screen-end" || to === "screen-lobby" || to === "screen-card" || to === "screen-deal") && ACTIVE && ACTIVE.state && ACTIVE.state()){
      ACTIVE.render(); return;
    }
    goHome();
  }
  function bindHome(){
    $("top-back").addEventListener("click", function(){
      var cur = UI.currentScreen();
      if (cur === "screen-settings" || cur === "screen-editor") goBack(); else goHome();
    });
    $("top-settings").addEventListener("click", function(){ if (UI.currentScreen() !== "screen-settings") openSettings(false); });
    $("open-rules").addEventListener("click", function(){ openSettings(true); });
    $("home-local").addEventListener("click", showSetup);
    $("home-resume-local").addEventListener("click", function(){ if (!Local.resume()) goHome(); });
    $("home-resume-online").addEventListener("click", function(){
      UI.toast("home-toast", "Connexion au salon…", true);
      Online.resume().then(function(){ UI.toast("home-toast", ""); }).catch(function(e){ UI.toast("home-toast", e.message); Store.remove("online"); goHome(); });
    });
    $("home-forget").addEventListener("click", function(){ Local.forget(); Store.remove("online"); goHome(); });
    var nameOk = function(){
      var name = $("home-name").value.trim().replace(/\s+/g," ");
      if (!name){ UI.toast("home-toast", "Indiquez votre prénom."); $("home-name").focus(); return null; }
      Store.set("name", name);
      return name;
    };
    $("home-create").addEventListener("click", function(){
      var name = nameOk(); if (!name) return;
      UI.toast("home-toast", "Création du salon…", true);
      Online.createRoom(name).then(function(){ UI.toast("home-toast", ""); }).catch(function(e){ UI.toast("home-toast", e.message); });
    });
    var joinNow = function(){
      var name = nameOk(); if (!name) return;
      UI.toast("home-toast", "Connexion au salon…", true);
      Online.join($("home-join-code").value, name).then(function(){ UI.toast("home-toast", ""); }).catch(function(e){ UI.toast("home-toast", e.message); });
    };
    $("home-join").addEventListener("click", joinNow);
    $("home-join-code").addEventListener("keydown", function(e){ if (e.key === "Enter"){ e.preventDefault(); joinNow(); } });
    $("home-join-code").addEventListener("input", function(){ this.value = this.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0,4); });
    $("open-editor").addEventListener("click", function(){ returnScreen = UI.currentScreen(); renderDest(); renderAdded(); UI.show("screen-editor"); });
  }

  /* ---------- joueurs (mode local) ---------- */
  function renderPlayers(){
    var chips = $("chips");
    UI.clear(chips);
    SETTINGS.players.forEach(function(p, i){
      var c = UI.el("span", "chip", p);
      var x = UI.el("button", null, "×"); x.type = "button"; x.setAttribute("aria-label", "Retirer " + p);
      x.addEventListener("click", function(){ SETTINGS.players.splice(i,1); saveSettings(); renderPlayers(); renderConfig(); });
      c.appendChild(x);
      chips.appendChild(c);
    });
    $("players-empty").hidden = SETTINGS.players.length > 0;
    $("players-count").textContent = SETTINGS.players.length ? SETTINGS.players.length : "";
  }
  function addPlayer(){
    var input = $("player-input");
    var name = input.value.trim().replace(/\s+/g," ");
    if (!name){ input.focus(); return; }
    if (SETTINGS.players.length >= 20){ UI.toast("setup-toast", "Vingt joueurs au maximum."); return; }
    for (var i=0;i<SETTINGS.players.length;i++){
      if (Engine.norm(SETTINGS.players[i]) === Engine.norm(name)){ UI.toast("setup-toast", name + " est déjà dans la liste."); return; }
    }
    SETTINGS.players.push(name);
    input.value = ""; UI.toast("setup-toast", ""); input.focus();
    saveSettings(); renderPlayers(); renderConfig();
  }
  function setPlayers(names){ SETTINGS.players = names.slice(); saveSettings(); }
  function bindSetup(){
    $("add-player").addEventListener("click", addPlayer);
    $("player-input").addEventListener("keydown", function(e){ if (e.key === "Enter"){ e.preventDefault(); addPlayer(); } });
    $("start").addEventListener("click", function(){
      var err = problem(SETTINGS.players.length);
      if (err){ UI.toast("setup-toast", err); return; }
      Local.start(SETTINGS.players.slice());
    });
  }

  /* ---------- écran de partie : boutons partagés ---------- */
  function act(name){ return function(){ if (ACTIVE && ACTIVE.on[name]) ACTIVE.on[name].apply(null, arguments); }; }
  function bindPlay(){
    var submitDesc = function(){ act("describe")($("describe-input").value); };
    $("describe-submit").addEventListener("click", submitDesc);
    $("describe-input").addEventListener("keydown", function(e){ if (e.key === "Enter"){ e.preventDefault(); submitDesc(); } });
    $("describe-skip").addEventListener("click", act("skip"));
    $("vote-unlock").addEventListener("click", act("unlockVote"));
    $("vote-close").addEventListener("click", function(){
      UI.confirmBox($("vote-confirm"), "Clore le vote sans attendre les retardataires ?", "Clore", act("closeVote"));
    });
    $("continue").addEventListener("click", act("continue"));
    var submitGuess = function(){ var v = $("guess-input").value; $("guess-input").value = ""; act("guess")(v); };
    $("guess-submit").addEventListener("click", submitGuess);
    $("guess-input").addEventListener("keydown", function(e){ if (e.key === "Enter"){ e.preventDefault(); submitGuess(); } });
    $("guess-skip").addEventListener("click", act("skipGuess"));
    $("show-card").addEventListener("click", act("showCard"));
    $("leave-game").addEventListener("click", function(){
      UI.confirmBox($("remove-slot"), "Quitter la partie en cours ? Vous serez retiré du jeu.", "Quitter", act("leave"));
    });
    $("reveal-all").addEventListener("click", function(){
      UI.confirmBox($("remove-slot"), "Arrêter la partie et révéler tous les rôles ? Aucun point ne sera attribué.", "Tout révéler", act("abort"));
    });
    $("open-remove").addEventListener("click", function(){
      var s = ACTIVE && ACTIVE.state ? ACTIVE.state() : null;
      if (!s) return;
      var slot = $("remove-slot"); UI.clear(slot);
      var box = UI.el("div", "confirm");
      box.appendChild(UI.el("p", null, "Quel joueur quitte la partie ? Il sera retiré du jeu et son rôle révélé à la fin."));
      var grid = UI.el("div", "people");
      s.players.filter(function(p){ return p.alive; }).forEach(function(p){
        var b = UI.el("button", "person", p.name); b.type = "button";
        b.addEventListener("click", function(){
          UI.confirmBox(slot, "Retirer " + p.name + " de la partie ?", "Retirer", function(){ act("remove")(p.id); });
        });
        grid.appendChild(b);
      });
      box.appendChild(grid);
      var cancel = UI.el("button", "btn ghost small", "Annuler"); cancel.type = "button"; cancel.style.marginTop = "10px";
      cancel.addEventListener("click", function(){ UI.clear(slot); });
      box.appendChild(cancel);
      slot.appendChild(box);
    });
    $("replay").addEventListener("click", act("replay"));
    $("restart").addEventListener("click", act("restart"));
    $("end-home").addEventListener("click", act("home"));
    $("reset-scores").addEventListener("click", act("resetScores"));
  }

  /* ---------- apparence et règles ---------- */
  function applyAppearance(){
    var light;
    if (SETTINGS.appearance === "light") light = true;
    else if (SETTINGS.appearance === "dark") light = false;
    else light = !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches);
    document.body.classList.toggle("light", light);
    var meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.setAttribute("content", light ? "#F3F4F7" : "#0F1115");
    pressGroup("[data-appearance]", "data-appearance", SETTINGS.appearance);
  }
  var RULE_DEFS = [
    { key:"whiteGuess", label:"Mr White peut deviner", note:"Un essai au moment de son élimination" },
    { key:"whiteNotFirst", label:"Mr White jamais premier", note:"Il ne parle jamais en ouverture du tour" },
    { key:"announce", label:"Annoncer la catégorie", note:"La série ou la catégorie figure sur les cartes" },
    { key:"emblem", label:"Afficher le médaillon", note:"Pastille au-dessus du mot" },
    { key:"tieWins", label:"Les intrus gagnent à égalité", note:"Sinon ils doivent être strictement plus nombreux" },
    { key:"hideRoles", label:"Cacher les rôles éliminés", note:"Le camp de l'éliminé n'est révélé qu'à la fin" }
  ];
  var POINT_DEFS = [
    { key:"civilAlive", label:"Civil vainqueur en vie" },
    { key:"civilDead", label:"Civil vainqueur éliminé" },
    { key:"undercover", label:"Undercover vainqueur" },
    { key:"white", label:"Mr White vainqueur" },
    { key:"whiteGuess", label:"Mr White qui devine" }
  ];
  function renderRules(){
    var box = $("rules-list"); UI.clear(box);
    RULE_DEFS.forEach(function(def){
      var row = UI.el("div", "setting");
      var lab = UI.el("span", "setting-label", def.label);
      lab.appendChild(UI.el("span", "setting-note", def.note));
      var b = UI.el("button", "toggle", SETTINGS.rules[def.key] ? "Activé" : "Désactivé"); b.type = "button";
      b.setAttribute("aria-pressed", String(!!SETTINGS.rules[def.key]));
      b.addEventListener("click", function(){ SETTINGS.rules[def.key] = !SETTINGS.rules[def.key]; saveSettings(); renderRules(); });
      row.appendChild(lab); row.appendChild(b);
      box.appendChild(row);
    });
    var pbox = $("points-list"); UI.clear(pbox);
    POINT_DEFS.forEach(function(def){
      var row = UI.el("div", "setting");
      var lab = UI.el("span", "setting-label", def.label);
      var ctrl = UI.el("span", "stepper");
      var minus = UI.el("button", null, "−"); minus.type = "button"; minus.setAttribute("aria-label", "Moins un point pour " + def.label);
      var out = UI.el("output", null, SETTINGS.points[def.key]);
      var plus = UI.el("button", null, "+"); plus.type = "button"; plus.setAttribute("aria-label", "Un point de plus pour " + def.label);
      minus.addEventListener("click", function(){ SETTINGS.points[def.key] = Math.max(0, SETTINGS.points[def.key] - 1); saveSettings(); renderRules(); });
      plus.addEventListener("click", function(){ SETTINGS.points[def.key] = Math.min(20, SETTINGS.points[def.key] + 1); saveSettings(); renderRules(); });
      ctrl.appendChild(minus); ctrl.appendChild(out); ctrl.appendChild(plus);
      row.appendChild(lab); row.appendChild(ctrl);
      pbox.appendChild(row);
    });
  }
  function bindSettings(){
    var btns = document.querySelectorAll("[data-appearance]");
    for (var i=0;i<btns.length;i++){
      btns[i].addEventListener("click", function(){ SETTINGS.appearance = this.getAttribute("data-appearance"); saveSettings(); applyAppearance(); });
    }
    if (window.matchMedia){
      var mq = window.matchMedia("(prefers-color-scheme: light)");
      var onChange = function(){ if (SETTINGS.appearance === "auto") applyAppearance(); };
      if (mq.addEventListener) mq.addEventListener("change", onChange); else if (mq.addListener) mq.addListener(onChange);
    }
    $("rules-reset").addEventListener("click", function(){
      SETTINGS.rules = JSON.parse(JSON.stringify(DEFAULT_RULES));
      SETTINGS.points = JSON.parse(JSON.stringify(DEFAULT_POINTS));
      saveSettings(); renderRules(); renderConfig();
    });
    $("settings-back").addEventListener("click", goBack);
  }

  /* ---------- éditeur de duos (ajouts conservés sur l'appareil) ---------- */
  var ED = { dest:"theme", level:0 };
  var ADDED = Store.get("added", []);
  function hashCode(s){ var h = 0; for (var i=0;i<s.length;i++){ h = (h * 31 + s.charCodeAt(i)) | 0; } return Math.abs(h); }
  function slug(label){
    var base = Engine.norm(label) || "theme", id = base, k = 2;
    while (WordBank.byId(WORDS.SERIES, id) || WordBank.byId(WORDS.THEMES, id)){ id = base + "-" + k; k++; }
    return id;
  }
  function tintFrom(label){ return "hsl(" + (hashCode(Engine.norm(label)) % 360) + ", 45%, 55%)"; }
  function pairOf(item){
    if (item.kind === "cross"){ var c = [item.a, item.sa, item.b, item.sb]; if (item.level) c.push(item.level); return c; }
    var p = [item.a, item.b]; if (item.level) p.push(item.level); return p;
  }
  function applyAdded(item){
    if (item.kind === "cross"){ WORDS.CROSSOVER.push(pairOf(item)); return; }
    var list = item.kind === "serie" ? WORDS.SERIES : WORDS.THEMES;
    var group = WordBank.byId(list, item.groupId);
    if (!group){ group = { id:item.groupId, label:item.label, tint:tintFrom(item.label), pairs:[] }; list.push(group); }
    group.pairs.push(pairOf(item));
  }
  function unapplyAdded(item){
    if (item.kind === "cross"){
      for (var i=0;i<WORDS.CROSSOVER.length;i++){ if (WORDS.CROSSOVER[i][0] === item.a && WORDS.CROSSOVER[i][2] === item.b){ WORDS.CROSSOVER.splice(i,1); break; } }
      return;
    }
    var list = item.kind === "serie" ? WORDS.SERIES : WORDS.THEMES;
    var group = WordBank.byId(list, item.groupId);
    if (!group) return;
    for (var j=0;j<group.pairs.length;j++){ if (group.pairs[j][0] === item.a && group.pairs[j][1] === item.b){ group.pairs.splice(j,1); break; } }
    if (!group.pairs.length){ var idx = list.indexOf(group); if (idx !== -1) list.splice(idx,1); }
  }
  ADDED.forEach(applyAdded);
  function saveAdded(){ Store.set("added", ADDED); }

  function mkSelect(id, list, withNew, label){
    var wrap = UI.el("label", "field");
    wrap.appendChild(UI.el("span", null, label));
    var sel = UI.el("select"); sel.id = id;
    list.forEach(function(g){ var o = UI.el("option", null, g.label); o.value = g.id; sel.appendChild(o); });
    if (withNew){ var o2 = UI.el("option", null, "— Créer un nouveau groupe —"); o2.value = "__new__"; sel.appendChild(o2); }
    wrap.appendChild(sel);
    return wrap;
  }
  function renderDest(){
    var box = $("dest-fields"); UI.clear(box);
    if (ED.dest === "serie" || ED.dest === "theme"){
      var list = ED.dest === "serie" ? WORDS.SERIES : WORDS.THEMES;
      box.appendChild(mkSelect("ed-group", list, true, ED.dest === "serie" ? "Anime" : "Thème"));
      var nw = UI.el("label", "field"); nw.id = "ed-new-wrap"; nw.hidden = true;
      nw.appendChild(UI.el("span", null, "Nom du nouveau groupe"));
      var inp = UI.el("input"); inp.type = "text"; inp.id = "ed-new"; inp.maxLength = 28; inp.autocomplete = "off";
      nw.appendChild(inp);
      box.appendChild(nw);
      $("ed-group").addEventListener("change", function(){ $("ed-new-wrap").hidden = (this.value !== "__new__"); });
    } else {
      box.appendChild(mkSelect("ed-sa", WORDS.SERIES, false, "Anime du premier nom"));
      box.appendChild(mkSelect("ed-sb", WORDS.SERIES, false, "Anime du second nom"));
    }
  }
  function renderAdded(){
    var list = $("ed-list"); UI.clear(list);
    $("ed-count").textContent = ADDED.length;
    $("ed-empty").hidden = ADDED.length > 0;
    ADDED.forEach(function(item, idx){
      var li = UI.el("li");
      var left = UI.el("span", null, item.a + " / " + item.b);
      var where = item.kind === "cross" ? (item.sa + " · " + item.sb) : item.label;
      left.appendChild(UI.el("small", null, where + (item.level ? " · " + DIFF_LABELS[item.level] : "")));
      var del = UI.el("button", "btn ghost small inline", "Retirer"); del.type = "button";
      del.addEventListener("click", function(){ unapplyAdded(item); ADDED.splice(idx,1); saveAdded(); renderAdded(); renderDest(); });
      li.appendChild(left); li.appendChild(del);
      list.appendChild(li);
    });
  }
  function esc(s){ return String(s).replace(/"/g, '\\"'); }
  function codeOf(item){
    return "[" + pairOf(item).map(function(x){ return typeof x === "number" ? String(x) : '"' + esc(x) + '"'; }).join(",") + "],";
  }
  function bindEditor(){
    var destBtns = document.querySelectorAll("[data-dest]");
    for (var i=0;i<destBtns.length;i++){
      destBtns[i].addEventListener("click", function(){
        ED.dest = this.getAttribute("data-dest");
        pressGroup("[data-dest]", "data-dest", ED.dest);
        UI.toast("ed-toast", ""); renderDest();
      });
    }
    var lvBtns = document.querySelectorAll("[data-ed-level]");
    for (var l=0;l<lvBtns.length;l++){
      lvBtns[l].addEventListener("click", function(){ ED.level = parseInt(this.getAttribute("data-ed-level"),10); pressGroup("[data-ed-level]", "data-ed-level", ED.level); });
    }
    $("ed-add").addEventListener("click", function(){
      var a = $("ed-a").value.trim().replace(/\s+/g," "), b = $("ed-b").value.trim().replace(/\s+/g," ");
      if (!a || !b){ UI.toast("ed-toast", "Renseignez les deux mots."); return; }
      if (Engine.norm(a) === Engine.norm(b)){ UI.toast("ed-toast", "Les deux mots doivent être différents."); return; }
      var item;
      if (ED.dest === "cross"){
        var sa = WordBank.byId(WORDS.SERIES, $("ed-sa").value), sb = WordBank.byId(WORDS.SERIES, $("ed-sb").value);
        if (!sa || !sb || sa === sb){ UI.toast("ed-toast", "Choisissez deux animes différents."); return; }
        item = { kind:"cross", a:a, b:b, sa:sa.label, sb:sb.label, level:ED.level || 0 };
      } else {
        var isSerie = ED.dest === "serie", list = isSerie ? WORDS.SERIES : WORDS.THEMES;
        var val = $("ed-group").value, group;
        if (val === "__new__"){
          var label = $("ed-new").value.trim();
          if (!label){ UI.toast("ed-toast", "Nommez le nouveau groupe."); return; }
          group = { id:slug(label), label:label };
        } else group = WordBank.byId(list, val);
        if (!group){ UI.toast("ed-toast", "Groupe introuvable."); return; }
        item = { kind:isSerie ? "serie" : "theme", a:a, b:b, groupId:group.id, label:group.label, level:ED.level || 0 };
      }
      applyAdded(item); ADDED.push(item); saveAdded();
      $("ed-a").value = ""; $("ed-b").value = ""; UI.toast("ed-toast", "Duo ajouté.", true); $("ed-a").focus();
      renderDest(); renderAdded();
    });
    $("ed-export").addEventListener("click", function(){
      if (!ADDED.length){ UI.toast("ed-toast", "Aucun ajout à exporter."); return; }
      var groups = {}, cross = [], out = [];
      ADDED.forEach(function(it){
        if (it.kind === "cross"){ cross.push("    " + codeOf(it)); return; }
        var key = it.kind + "|" + it.groupId + "|" + it.label;
        (groups[key] = groups[key] || []).push(codeOf(it));
      });
      Object.keys(groups).forEach(function(key){
        var parts = key.split("|"), kind = parts[0], gid = parts[1], label = parts[2];
        var group = WordBank.byId(kind === "serie" ? WORDS.SERIES : WORDS.THEMES, gid);
        var isNew = group && group.pairs.length === groups[key].length;
        if (isNew){
          out.push("/* Nouveau groupe : à coller dans " + (kind === "serie" ? "SERIES" : "THEMES") + " (js/words.js) */");
          out.push('    { id:"' + gid + '", label:"' + esc(label) + '", tint:"' + (group ? group.tint : "#E0A93B") + '",');
          out.push('      pairs:[ ' + groups[key].join("").replace(/,$/, "") + ' ] },');
        } else {
          out.push("/* À coller dans le tableau pairs de « " + label + " » (js/words.js) */");
          out.push('        ' + groups[key].join(""));
        }
        out.push("");
      });
      if (cross.length){ out.push("/* À coller dans CROSSOVER (js/words.js) */"); out = out.concat(cross); }
      $("ed-out").value = out.join("\n"); $("ed-out").hidden = false; $("ed-copy").hidden = false; UI.toast("ed-toast", "");
    });
    $("ed-copy").addEventListener("click", function(){
      var ta = $("ed-out"), btn = this;
      var done = function(){ btn.textContent = "Copié"; setTimeout(function(){ btn.textContent = "Copier dans le presse-papier"; }, 1600); };
      try { if (navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(ta.value).then(done, function(){ ta.select(); }); return; } } catch(e){}
      ta.select(); btn.textContent = "Sélectionné : copiez manuellement";
    });
    $("ed-back").addEventListener("click", goBack);
  }

  /* ---------- amorçage ---------- */
  global.App = {
    getConfig:getConfig, getSelection:getSelection, drawPair:drawPair, problem:problem,
    moveConfigPanel:moveConfigPanel, setConfigCount:setConfigCount, renderConfig:renderConfig,
    goHome:goHome, showSetup:showSetup, setPlayers:setPlayers,
    setActive:function(c){ ACTIVE = c; }, active:function(){ return ACTIVE; }
  };

  applyAppearance();
  bindConfig(); bindHome(); bindSetup(); bindPlay(); bindSettings(); bindEditor();
  Local.init();
  Online.init();
  moveConfigPanel("config-slot-local");
  renderConfig();
  renderRules();

  var savedOnline = Online.savedRoom();
  if (Local.inProgress()){ Local.resume(); }
  else if (savedOnline && Online.available()){
    goHome();
    Online.resume().catch(function(e){ UI.toast("home-toast", e.message); Store.remove("online"); goHome(); });
  }
  else goHome();
})(window);
