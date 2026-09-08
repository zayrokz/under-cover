/* =====================================================================
   MODE « UN SEUL TÉLÉPHONE » — contrôleur pass-and-play
   =====================================================================
   Pilote le moteur directement, sauvegarde chaque changement dans
   localStorage et confie le rendu à UI.renderPlay / UI.renderEnd.
   ===================================================================== */
(function(global){
  "use strict";
  var $ = function(id){ return document.getElementById(id); };

  var G = null;           /* { state, scores:{nom:pts}, manche, dealIndex, screen, voteUnlocked, scored } */
  var cardOpen = false;

  function save(){ if (G) Store.set("local.game", G); }
  function load(){
    var g = Store.get("local.game", null);
    if (g && g.state){ G = g; Engine.normalize(G.state); return true; }
    if (g && g.scores){ G = g; }
    return false;
  }
  function forget(){ G = G && G.scores ? { scores:G.scores, manche:G.manche || 0 } : null; Store.remove("local.game"); if (G) save(); }
  function hasGame(){ return !!(G && G.state); }
  function inProgress(){ return !!(G && G.state && G.state.phase !== "end"); }
  function state(){ return G ? G.state : null; }

  /* ---------- lancement ---------- */
  function start(names){
    var config = App.getConfig();
    var err = App.problem(names.length);
    if (err){ UI.snack(err); return false; }
    var draw = App.drawPair();
    var players = names.map(function(n, i){ return { id:"p" + i, name:n }; });
    var st = Engine.createGame({ players:players, config:config, draw:draw });
    G = G || { scores:{}, manche:0 };
    G.scores = G.scores || {};
    G.state = st;
    G.manche = (G.manche || 0) + 1;
    G.dealIndex = 0; G.voteUnlocked = false; G.scored = false; G.screen = "deal";
    names.forEach(function(n){ if (typeof G.scores[n] !== "number") G.scores[n] = 0; });
    save();
    App.setActive(Local);
    renderDeal();
    return true;
  }

  /* ---------- distribution des cartes ---------- */
  function renderDeal(){
    var s = G.state, p = s.players[G.dealIndex];
    UI.show("screen-deal");
    $("deal-count").textContent = "Joueur " + (G.dealIndex + 1) + " sur " + s.players.length;
    $("deal-name").textContent = p.name;
    UI.fillCard("card", Engine.privateView(s, p.id), s.config);
    cardOpen = false;
    UI.showSecret("card", false);
    $("deal-toggle").textContent = "Voir mon mot";
    $("deal-note").textContent = "Personne d'autre ne doit regarder l'écran.";
  }

  function bindDeal(){
    $("deal-toggle").addEventListener("click", function(){
      if (!G || !G.state) return;
      if (!cardOpen){
        cardOpen = true;
        UI.showSecret("card", true);
        var last = G.dealIndex === G.state.players.length - 1;
        $("deal-toggle").textContent = last ? "Cacher et commencer la partie" : "Cacher et passer au suivant";
        $("deal-note").textContent = "Mémorisez votre mot, puis cachez-le avant de passer le téléphone.";
        return;
      }
      UI.showSecret("card", false);
      cardOpen = false;
      if (G.dealIndex < G.state.players.length - 1){ G.dealIndex++; save(); renderDeal(); }
      else { Engine.continueGame(G.state); G.screen = "play"; render(); }
    });
  }

  /* ---------- rendu ---------- */
  function scoreRows(){
    var s = G.state;
    return Object.keys(G.scores).map(function(name){
      var p = null;
      s.players.forEach(function(x){ if (x.name === name) p = x; });
      return { name:name, pts:G.scores[name], delta: p ? p.delta : 0 };
    }).sort(function(a, b){ return b.pts - a.pts || a.name.localeCompare(b.name); });
  }

  function ctx(){
    return {
      mode:"local", meId:null, isHost:true, clockOffset:0, members:null,
      local:{ voteUnlocked:G.voteUnlocked },
      canActFor:function(){ return true; },
      scores:scoreRows(), manche:G.manche,
      on:on
    };
  }

  function render(){
    if (!G || !G.state) return;
    App.setActive(Local);
    var s = G.state;
    if (s.phase === "deal"){ renderDeal(); return; }
    if (s.phase === "end"){
      if (!G.scored){
        s.players.forEach(function(p){ if (p.delta) G.scores[p.name] = (G.scores[p.name] || 0) + p.delta; });
        G.scored = true;
      }
      G.screen = "end";
      save();
      UI.renderEnd(s, ctx());
      return;
    }
    G.screen = "play";
    save();
    UI.renderPlay(s, ctx());
  }

  function resume(){
    if (!G || !G.state) return false;
    App.setActive(Local);
    if (G.state.phase === "deal"){ renderDeal(); return true; }
    render();
    return true;
  }

  function after(){
    var s = G.state;
    if (s.phase === "vote" && Engine.allVoted(s)) Engine.resolveVotes(s);
    render();
  }

  /* ---------- actions ---------- */
  var on = {
    describe:function(text){
      var s = G.state, r = Engine.submitDescription(s, Engine.currentSpeakerId(s), text);
      if (!r.ok){ UI.toast("play-toast", r.error); return; }
      render();
    },
    skip:function(){ Engine.skipTurn(G.state); render(); },
    timerExpired:function(){ if (G.state.phase === "describe"){ Engine.skipTurn(G.state, "(temps écoulé)"); UI.snack("Temps écoulé, le tour passe."); render(); } },
    unlockVote:function(){ G.voteUnlocked = true; render(); },
    vote:function(voterId, targetId){
      var r = Engine.castVote(G.state, voterId, targetId);
      if (!r.ok){ UI.snack(r.error); return; }
      G.voteUnlocked = false;
      after();
    },
    closeVote:function(){ Engine.resolveVotes(G.state); render(); },
    continue:function(){ Engine.continueGame(G.state); render(); },
    guess:function(text){ Engine.whiteGuess(G.state, text); render(); },
    skipGuess:function(){ Engine.skipWhiteGuess(G.state); render(); },
    remove:function(id){
      var p = Engine.player(G.state, id);
      Engine.removePlayer(G.state, id);
      G.voteUnlocked = false;
      UI.snack((p ? p.name : "Le joueur") + " quitte la partie.");
      after();
    },
    abort:function(){ Engine.abort(G.state); render(); },
    leave:function(){},
    ready:function(){}, forceStart:function(){}, showCard:function(){},
    replay:function(){
      var names = G.state.players.filter(function(p){ return !p.left; }).map(function(p){ return p.name; });
      App.setPlayers(names);
      var err = names.length < 3 ? "Il reste moins de trois joueurs." : App.problem(names.length);
      if (err){ UI.snack(err + " Ajustez la configuration."); G.state = null; G.screen = null; save(); App.showSetup(); return; }
      start(names);
    },
    restart:function(){ G.state = null; G.screen = null; save(); App.showSetup(); },
    home:function(){ App.goHome(); },
    resetScores:function(){ G.scores = {}; G.manche = 0; G.state.players.forEach(function(p){ p.delta = 0; }); save(); render(); }
  };

  var Local = {
    on:on, state:state, start:start, resume:resume, render:render,
    load:load, forget:forget, hasGame:hasGame, inProgress:inProgress,
    init:function(){ bindDeal(); load(); }
  };
  global.Local = Local;
})(window);
