/* =====================================================================
   APPLICATION — accueil, configuration, paramètres, câblage
   ===================================================================== */
(function(global){
  "use strict";
  var $ = UI.$;

  /* ---------- réglages persistants ---------- */
  var DEFAULT_RULES = { whiteGuess:true, whiteNotFirst:true, announce:true, emblem:true, tieWins:true, hideRoles:false };
  var DEFAULT_POINTS = { civilAlive:3, civilDead:2, undercover:4, white:6, whiteGuess:8 };
  var DIFF_LABELS = { 1:"facile", 2:"intermédiaire", 3:"hardcore" };
  var DIFF_NOTES = {
    1:"Les deux mots sont éloignés : les intrus se repèrent vite.",
    2:"Les deux mots sont proches, sans être ambigus. Le réglage conseillé.",
    3:"Les deux mots sont presque synonymes : les intrus passent facilement inaperçus."
  };

  var SETTINGS = {
    appearance:"auto", diff:2,
    rules: JSON.parse(JSON.stringify(DEFAULT_RULES)),
    points: JSON.parse(JSON.stringify(DEFAULT_POINTS)),
    undercover:1, white:0, timer:0, tieRule:"revote", firstVoteAfter:1,
    sel:{ mode:"theme", serieId:"random", themeId:"random" },
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
  var returnScreen = null;        /* écran à retrouver en quittant les paramètres */

  function getConfig(){
    var c = { undercover:SETTINGS.undercover, white:SETTINGS.white, timer:SETTINGS.timer, tieRule:SETTINGS.tieRule,
      firstVoteAfter:SETTINGS.firstVoteAfter, points:SETTINGS.points };
    Object.keys(SETTINGS.rules).forEach(function(k){ c[k] = SETTINGS.rules[k]; });
    return c;
  }
  function getSelection(){ return JSON.parse(JSON.stringify(SETTINGS.sel)); }
  function drawPair(){ return WordBank.draw(getSelection(), SETTINGS.diff); }
  function problem(count){
    var err = Engine.validate(count, getConfig());
    if (err) return err;
    if (WordBank.poolSize(getSelection(), SETTINGS.diff) === 0) return "Aucun duo disponible pour cette sélection.";
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
    $("diff-note").textContent = DIFF_NOTES[SETTINGS.diff];

    var n = configCount(), imp = SETTINGS.undercover + SETTINGS.white, civ = n - imp, tally = $("tally-config");
    if (n === 0){ tally.textContent = "En attente de joueurs."; tally.className = "tally"; }
    else if (civ <= imp || civ < 2){ tally.textContent = "Les civils doivent être plus nombreux que les intrus (" + n + " joueur" + (n>1?"s":"") + ")."; tally.className = "tally bad"; }
    else { tally.textContent = civ + " civils · " + SETTINGS.undercover + " undercover · " + SETTINGS.white + " Mr White"; tally.className = "tally"; }

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
      if (cur === "screen-settings") goBack(); else goHome();
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

  /* ---------- amorçage ---------- */
  global.App = {
    getConfig:getConfig, getSelection:getSelection, drawPair:drawPair, problem:problem,
    moveConfigPanel:moveConfigPanel, setConfigCount:setConfigCount, renderConfig:renderConfig,
    goHome:goHome, showSetup:showSetup, setPlayers:setPlayers,
    setActive:function(c){ ACTIVE = c; }, active:function(){ return ACTIVE; }
  };

  applyAppearance();
  bindConfig(); bindHome(); bindSetup(); bindPlay(); bindSettings();
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
