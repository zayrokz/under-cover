/* =====================================================================
   MODE EN LIGNE — salons Firebase Realtime Database
   =====================================================================
   Structure d'un salon rooms/{CODE} :
     meta     { code, hostId, status: lobby|playing, createdAt, manche }
     members  { uid: { name, joinedAt, connected, lastSeen } }
     game     vue publique de l'état (sans les mots ni les rôles cachés)
     private  { uid: { role, word, uni, uniLabel } }  lisible par uid seul
     full     état complet, lisible par l'hôte seul
     actions  { pushId: { from, type, ... } }  file d'actions vers l'hôte
     scores   { uid: { name, pts } }
     history  parties terminées
   L'hôte (meta.hostId) fait tourner le moteur ; les autres envoient des
   actions. Si l'hôte se déconnecte, le joueur connecté le plus ancien
   reprend le rôle (migration).
   ===================================================================== */
(function(global){
  "use strict";
  var $ = function(id){ return document.getElementById(id); };

  var db = null, auth = null, uid = null, code = null, roomRef = null, myName = "";
  var meta = null, members = {}, game = null, priv = null, scores = {};
  var full = null, fullLoaded = false, isHost = false, offset = 0;
  var subs = [], hostSubs = [], tickHandle = null, hostWatch = null, pending = [];
  var showingCard = false, cardOpen = false, connectedRef = null, connectedCb = null;

  function available(){
    return typeof firebase !== "undefined" && !!global.FIREBASE_CONFIG &&
      !!global.FIREBASE_CONFIG.apiKey && global.FIREBASE_CONFIG.apiKey !== "REMPLACER_MOI";
  }
  function unavailableReason(){
    if (typeof firebase === "undefined") return "Les bibliothèques Firebase n'ont pas pu être chargées (pas de connexion internet ?).";
    if (!global.FIREBASE_CONFIG || global.FIREBASE_CONFIG.apiKey === "REMPLACER_MOI") return "Mode en ligne désactivé : renseignez firebase-config.js (voir README).";
    return "";
  }
  function init(){
    if (db) return;
    firebase.initializeApp(global.FIREBASE_CONFIG);
    db = firebase.database();
    auth = firebase.auth();
    db.ref(".info/serverTimeOffset").on("value", function(s){ offset = s.val() || 0; });
  }
  function now(){ return Date.now() + offset; }
  function signIn(){
    init();
    return new Promise(function(resolve, reject){
      if (auth.currentUser){ uid = auth.currentUser.uid; return resolve(uid); }
      var done = false;
      var unsub = auth.onAuthStateChanged(function(u){
        if (u && !done){ done = true; uid = u.uid; unsub(); resolve(uid); }
      });
      auth.signInAnonymously().catch(function(e){ unsub(); reject(new Error("Connexion impossible : " + (e.code || e.message))); });
    });
  }
  function genCode(){
    var A = "ABCDEFGHJKMNPQRSTUVWXYZ", c = "";
    for (var i=0;i<4;i++) c += A.charAt(Math.floor(Math.random()*A.length));
    return c;
  }
  function connectedMembers(){
    return Object.keys(members).filter(function(id){ return members[id] && members[id].connected !== false; })
      .sort(function(a,b){ return (members[a].joinedAt || 0) - (members[b].joinedAt || 0); });
  }

  /* ---------- créer / rejoindre ---------- */
  function createRoom(name){
    return signIn().then(function(){
      var attempt = function(n){
        var c = genCode();
        return db.ref("rooms/" + c + "/meta").transaction(function(cur){
          if (cur) return;          /* code déjà pris : on abandonne et on réessaie */
          return { code:c, hostId:uid, status:"lobby", createdAt:now(), manche:0 };
        }).then(function(r){
          if (!r.committed){ if (n > 6) throw new Error("Impossible de créer un salon, réessayez."); return attempt(n+1); }
          return c;
        });
      };
      return attempt(0);
    }).then(function(c){ return join(c, name); });
  }

  function join(c, name){
    c = String(c || "").toUpperCase().replace(/[^A-Z]/g, "");
    if (c.length !== 4) return Promise.reject(new Error("Le code d'un salon comporte quatre lettres."));
    return signIn().then(function(){
      return db.ref("rooms/" + c + "/meta").once("value");
    }).then(function(snap){
      var m = snap.val();
      if (!m) throw new Error("Aucun salon avec le code " + c + ".");
      teardown(false);
      code = c; myName = name; roomRef = db.ref("rooms/" + c);
      return roomRef.child("members/" + uid).once("value");
    }).then(function(snap){
      var existing = snap.val();
      return roomRef.child("members/" + uid).update({
        name:name, joinedAt: existing && existing.joinedAt ? existing.joinedAt : now(),
        connected:true, lastSeen: firebase.database.ServerValue.TIMESTAMP
      });
    }).then(function(){
      Store.set("online", { code:code, name:name });
      subscribe();
      return code;
    });
  }

  function resume(){
    var saved = Store.get("online", null);
    if (!saved || !saved.code) return Promise.reject(new Error("Aucun salon à reprendre."));
    return join(saved.code, saved.name || "Joueur");
  }
  function savedRoom(){ return Store.get("online", null); }

  /* ---------- présence et abonnements ---------- */
  function presence(){
    var me = roomRef.child("members/" + uid);
    connectedRef = db.ref(".info/connected");
    connectedCb = function(s){
      if (s.val() !== true) return;
      me.onDisconnect().update({ connected:false, lastSeen: firebase.database.ServerValue.TIMESTAMP }).then(function(){
        me.update({ connected:true, lastSeen: firebase.database.ServerValue.TIMESTAMP });
      });
    };
    connectedRef.on("value", connectedCb);
  }
  function sub(ref, fn){
    var cb = function(s){ fn(s.val()); };
    ref.on("value", cb, function(err){ console.warn("Lecture refusée", ref.toString(), err && err.code); });
    subs.push({ ref:ref, cb:cb });
  }
  function subscribe(){
    presence();
    sub(roomRef.child("meta"), function(v){ meta = v; onMeta(); render(); });
    sub(roomRef.child("members"), function(v){ members = v || {}; checkHost(); render(); });
    sub(roomRef.child("game"), function(v){ game = v ? Engine.normalize(v) : null; render(); });
    sub(roomRef.child("private/" + uid), function(v){ priv = v; render(); });
    sub(roomRef.child("scores"), function(v){ scores = v || {}; render(); });
  }
  function teardown(clearStore){
    subs.forEach(function(x){ x.ref.off("value", x.cb); });
    subs = [];
    if (connectedRef && connectedCb){ connectedRef.off("value", connectedCb); }
    connectedRef = null; connectedCb = null;
    stopHosting();
    clearTimeout(hostWatch); hostWatch = null;
    meta = null; members = {}; game = null; priv = null; scores = {}; code = null; roomRef = null;
    showingCard = false; pending = [];
    if (clearStore) Store.remove("online");
  }

  function onMeta(){
    if (!meta){
      if (code){ UI.snack("Le salon a été fermé."); teardown(true); App.goHome(); }
      return;
    }
    var nowHost = meta.hostId === uid;
    if (nowHost && !isHost) startHosting();
    else if (!nowHost && isHost) stopHosting();
    checkHost();
  }

  /* migration : si l'hôte reste déconnecté 5 s, le plus ancien connecté reprend la main */
  function checkHost(){
    if (!meta || !code) return;
    var h = members[meta.hostId];
    var hostOnline = h && h.connected !== false;
    if (hostOnline){ clearTimeout(hostWatch); hostWatch = null; return; }
    if (hostWatch) return;
    hostWatch = setTimeout(function(){
      hostWatch = null;
      if (!meta || !code) return;
      var h2 = members[meta.hostId];
      if (h2 && h2.connected !== false) return;
      var cands = connectedMembers();
      if (cands[0] !== uid) return;
      roomRef.child("meta").transaction(function(m){
        if (!m || m.hostId === uid) return;
        var hm = members[m.hostId];
        if (hm && hm.connected !== false) return;
        m.hostId = uid;
        return m;
      }).then(function(r){ if (r.committed) UI.snack("L'hôte s'est déconnecté : vous reprenez la main."); })
        .catch(function(e){ console.warn(e); });
    }, 5000);
  }

  /* ---------- rôle d'hôte ---------- */
  function startHosting(){
    isHost = true; fullLoaded = false; full = null;
    Engine.clock = now;
    roomRef.child("full").once("value").then(function(s){
      full = s.val() ? Engine.normalize(s.val()) : null;
      fullLoaded = true;
      flush();
      render();
    }).catch(function(e){ console.warn("Lecture de l'état complet refusée", e); fullLoaded = true; });
    var aref = roomRef.child("actions");
    var acb = function(s){ var a = s.val(); if (a) pending.push({ key:s.key, a:a }); flush(); };
    aref.on("child_added", acb);
    hostSubs.push({ ref:aref, ev:"child_added", cb:acb });
    tickHandle = setInterval(tick, 500);
  }
  function stopHosting(){
    if (!isHost) return;
    isHost = false;
    hostSubs.forEach(function(x){ x.ref.off(x.ev, x.cb); });
    hostSubs = [];
    clearInterval(tickHandle); tickHandle = null;
    full = null; fullLoaded = false; pending = [];
    Engine.clock = null;
  }
  function flush(){
    if (!isHost || !fullLoaded || !roomRef) return;
    if (!pending.length) return;
    while (pending.length){
      var x = pending.shift();
      try { applyAction(x.a); } catch(e){ console.error(e); }
      roomRef.child("actions/" + x.key).remove();
    }
    persist();
  }
  function allReady(){
    if (!full) return false;
    var r = full.ready || {};
    return full.players.filter(function(p){ return p.alive; }).every(function(p){ return r[p.id]; });
  }
  function applyAction(a){
    if (a.type === "leave"){
      if (full && full.phase !== "end") Engine.removePlayer(full, a.from);
      roomRef.child("members/" + a.from).remove();
      afterChange();
      return;
    }
    if (!full || full.phase === "end") return;
    if (!Engine.player(full, a.from)) return;
    switch (a.type){
      case "ready":
        full.ready = full.ready || {};
        full.ready[a.from] = true;
        if (full.phase === "deal" && allReady()) Engine.continueGame(full);
        break;
      case "describe": Engine.submitDescription(full, a.from, a.text); break;
      case "skip": if (Engine.currentSpeakerId(full) === a.from) Engine.skipTurn(full); break;
      case "vote": Engine.castVote(full, a.from, a.target); break;
      case "guess": if (full.whiteGuesser === a.from) Engine.whiteGuess(full, a.text); break;
    }
    afterChange();
  }
  function afterChange(){
    if (!full) return;
    if (full.phase === "vote" && Engine.allVoted(full)) Engine.resolveVotes(full);
    if (full.phase === "end" && !full.scored){
      full.scored = true;
      full.players.forEach(function(p){
        var cur = scores[p.id] || { name:p.name, pts:0 };
        scores[p.id] = { name:p.name, pts:(cur.pts || 0) + (p.delta || 0) };
      });
      roomRef.child("scores").set(scores);
      roomRef.child("history").push({
        endedAt: now(), winner: full.winner, reason: full.endReason, pair: full.pair, round: full.round,
        players: full.players.map(function(p){ return { name:p.name, role:p.role, alive:p.alive, left:p.left, delta:p.delta }; })
      });
    }
  }
  function persist(){
    if (!isHost || !fullLoaded || !roomRef) return;
    game = full ? Engine.publicView(full) : null;
    render();
    roomRef.update({ full: full, game: game }).catch(function(e){ console.error("Écriture refusée", e); });
  }
  function tick(){
    if (!isHost || !full) return;
    if (Engine.timerExpired(full)){
      Engine.skipTurn(full, "(temps écoulé)");
      afterChange();
      persist();
    }
  }
  function hostDo(fn){
    if (!isHost || !fullLoaded){ UI.snack("Seul l'hôte peut faire cela."); return; }
    fn();
    afterChange();
    persist();
  }

  function startGame(){
    var ids = connectedMembers();
    var players = ids.map(function(id){ return { id:id, name:members[id].name || "Joueur" }; });
    var config = App.getConfig();
    var err = App.problem(players.length);
    if (err){ UI.toast("lobby-toast", err); return; }
    var draw = App.drawPair();
    full = Engine.createGame({ players:players, config:config, draw:draw });
    full.ready = {}; full.scored = false;
    fullLoaded = true;
    /* Les règles n'autorisent l'écriture que sous private/<joueur>, jamais sur le nœud private entier :
       chaque carte est donc écrite à son propre chemin dans une seule mise à jour multi-chemins. */
    var updates = { full: full, game: Engine.publicView(full), actions: null,
      "meta/status": "playing", "meta/manche": ((meta && meta.manche) || 0) + 1 };
    players.forEach(function(p){
      updates["private/" + p.id] = Engine.privateView(full, p.id);
      if (!scores[p.id]) updates["scores/" + p.id] = { name:p.name, pts:0 };
    });
    showingCard = false; cardOpen = false;
    UI.toast("lobby-toast", "");
    roomRef.update(updates)
      .catch(function(e){ UI.toast("lobby-toast", "Lancement refusé : " + (e.code || e.message)); });
  }
  function toLobby(){
    var updates = { "meta/status":"lobby", full:null, game:null, actions:null };
    /* suppression carte par carte : le nœud private entier n'est pas inscriptible */
    ((full && full.players) || []).forEach(function(p){ updates["private/" + p.id] = null; });
    full = null;
    roomRef.update(updates).catch(function(e){ console.error(e); });
  }

  /* ---------- actions côté joueur ---------- */
  function dispatch(type, extra){
    var a = { from:uid, type:type, at:now() };
    Object.keys(extra || {}).forEach(function(k){ a[k] = extra[k]; });
    if (isHost && fullLoaded){ applyAction(a); persist(); return; }
    roomRef.child("actions").push(a).catch(function(e){ UI.snack("Action refusée : " + (e.code || e.message)); });
  }

  function leave(){
    if (!roomRef){ App.goHome(); return; }
    var me = roomRef.child("members/" + uid);
    var chain = Promise.resolve();
    if (isHost){
      if (full && full.phase !== "end"){ Engine.removePlayer(full, uid); afterChange(); persist(); }
      var next = connectedMembers().filter(function(id){ return id !== uid; })[0];
      if (next) chain = roomRef.child("meta/hostId").set(next);
    } else if (game && game.phase !== "end" && Engine.player(game, uid)){
      chain = roomRef.child("actions").push({ from:uid, type:"leave", at:now() });
    }
    chain.catch(function(){}).then(function(){
      me.onDisconnect().cancel();
      return me.remove();
    }).catch(function(){}).then(function(){
      teardown(true);
      App.goHome();
    });
  }

  /* ---------- rendu ---------- */
  function scoreRows(g){
    return Object.keys(scores).map(function(id){
      var p = g ? Engine.player(g, id) : null;
      return { name:scores[id].name, pts:scores[id].pts || 0, delta: p ? p.delta : 0 };
    }).sort(function(a, b){ return b.pts - a.pts || a.name.localeCompare(b.name); });
  }
  function ctx(g){
    return {
      mode:"online", meId:uid, isHost:isHost, clockOffset:offset, members:members, local:null,
      canActFor:function(id){ return id === uid; },
      scores:scoreRows(g), manche:(meta && meta.manche) || 1,
      on:on
    };
  }
  function state(){ return game; }

  function render(){
    if (!code || !meta) return;
    App.setActive(Online);
    var g = game;
    if (meta.status !== "playing" || !g){ renderLobby(); return; }
    var me = Engine.player(g, uid);
    if (g.phase === "deal"){
      if (me) renderCard(g); else renderLobby();
      return;
    }
    if (showingCard && me){ renderCard(g); return; }
    if (g.phase === "end"){ UI.renderEnd(g, ctx(g)); return; }
    UI.renderPlay(g, ctx(g));
  }

  function renderLobby(){
    UI.show("screen-lobby");
    var playing = meta.status === "playing";
    $("lobby-status").textContent = playing ? "Partie en cours" : "Salon ouvert";
    $("lobby-code").textContent = code;
    var list = $("lobby-members"); UI.clear(list);
    var ids = Object.keys(members).sort(function(a,b){ return (members[a].joinedAt || 0) - (members[b].joinedAt || 0); });
    ids.forEach(function(id){
      var m = members[id], off = m.connected === false;
      var li = UI.el("li", off ? "off" : "");
      li.appendChild(UI.el("span", "dot" + (off ? " off" : "")));
      li.appendChild(UI.el("span", "who", (m.name || "Joueur") + (id === uid ? " (vous)" : "")));
      if (id === meta.hostId) li.appendChild(UI.el("span", "badge host", "hôte"));
      if (off) li.appendChild(UI.el("span", "badge warn", "déconnecté"));
      list.appendChild(li);
    });
    var count = connectedMembers().length;
    $("lobby-count").textContent = count;
    $("lobby-start").hidden = !isHost;
    $("lobby-wait").hidden = isHost;
    $("lobby-wait").textContent = playing ? "Une partie est en cours. Vous jouerez à la prochaine." : "En attente que l'hôte lance la partie…";
    $("config-slot-online").hidden = !isHost;
    if (isHost){
      App.moveConfigPanel("config-slot-online");
      App.setConfigCount(function(){ return connectedMembers().length; });
      App.renderConfig();
      $("lobby-start").disabled = !!App.problem(count);
      $("lobby-start").textContent = playing ? "Relancer une partie" : "Distribuer les rôles";
    }
  }

  /* Carte : « Voir mon mot » affiche le mot ; « Cacher et continuer » le masque et
     signale que le joueur est prêt (distribution) ou revient à la partie (relecture). */
  function renderCard(g){
    UI.show("screen-card");
    $("mycard-round").textContent = (meta && meta.manche) || 1;
    $("mycard-name").textContent = myName;
    if (priv){ UI.fillCard("mycard", priv, g.config); }
    else {
      $("mycard-word").textContent = "…"; $("mycard-sub").textContent = "Chargement de votre carte."; $("mycard-kicker").textContent = "";
    }
    UI.showSecret("mycard", cardOpen);
    var deal = g.phase === "deal";
    var ready = !!(g.ready || {})[uid];
    var alive = g.players.filter(function(p){ return p.alive; });
    var readyCount = alive.filter(function(p){ return (g.ready || {})[p.id]; }).length;
    var toggle = $("mycard-toggle");
    toggle.disabled = !priv;
    if (!cardOpen) toggle.textContent = "Voir mon mot";
    else if (!deal) toggle.textContent = "Cacher et revenir à la partie";
    else toggle.textContent = ready ? "Cacher" : "Cacher et continuer";
    $("mycard-status").textContent = deal
      ? (ready ? "Vous êtes prêt. " : "") + readyCount + " / " + alive.length + " joueurs prêts."
      : "Personne ne doit voir votre écran.";
    $("mycard-force").hidden = !(deal && isHost && readyCount < alive.length);
  }

  function bindScreens(){
    $("mycard-toggle").addEventListener("click", function(){
      if (!game) return;
      if (!cardOpen){ cardOpen = true; render(); return; }
      cardOpen = false;
      if (game.phase === "deal"){
        if (!(game.ready || {})[uid]) dispatch("ready");
        render();
      } else { showingCard = false; render(); }
    });
    $("mycard-force").addEventListener("click", function(){ hostDo(function(){ Engine.continueGame(full); }); });
    $("lobby-start").addEventListener("click", startGame);
    $("lobby-leave").addEventListener("click", leave);
  }

  /* ---------- gestes de partie ---------- */
  var on = {
    describe:function(text){
      text = String(text || "").trim();
      if (!text){ UI.toast("play-toast", "La description est vide."); return; }
      if (priv && priv.word && Engine.norm(priv.word).length > 2 && Engine.norm(text).indexOf(Engine.norm(priv.word)) !== -1){
        UI.toast("play-toast", "Le mot secret ne doit pas apparaître dans la description."); return;
      }
      dispatch("describe", { text:text });
    },
    skip:function(){ if (isHost) hostDo(function(){ Engine.skipTurn(full); }); else dispatch("skip"); },
    timerExpired:function(){ /* géré par l'hôte dans tick() */ },
    unlockVote:function(){},
    vote:function(voterId, targetId){ dispatch("vote", { target:targetId }); },
    closeVote:function(){ hostDo(function(){ Engine.resolveVotes(full); }); },
    continue:function(){ hostDo(function(){ Engine.continueGame(full); }); },
    guess:function(text){ dispatch("guess", { text:String(text || "") }); },
    skipGuess:function(){ hostDo(function(){ Engine.skipWhiteGuess(full); }); },
    remove:function(id){ hostDo(function(){ Engine.removePlayer(full, id); }); },
    abort:function(){ hostDo(function(){ Engine.abort(full); }); },
    leave:leave,
    ready:function(){ dispatch("ready"); },
    forceStart:function(){ hostDo(function(){ Engine.continueGame(full); }); },
    showCard:function(){ showingCard = true; render(); },
    replay:function(){ if (isHost) startGame(); },
    restart:function(){ if (isHost) toLobby(); },
    home:leave,
    resetScores:function(){ if (!isHost) return; scores = {}; roomRef.child("scores").remove(); }
  };

  global.Online = {
    on:on, state:state, available:available, unavailableReason:unavailableReason,
    createRoom:createRoom, join:join, resume:resume, savedRoom:savedRoom, leave:leave,
    init:bindScreens, render:render
  };
})(window);
