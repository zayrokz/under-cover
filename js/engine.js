/* =====================================================================
   MOTEUR DE JEU — logique pure, sans DOM ni réseau
   =====================================================================
   Utilisé tel quel par le mode « un seul téléphone » et par l'hôte du
   mode en ligne. Toutes les fonctions reçoivent l'état de partie et le
   modifient en place, puis le renvoient. Aucune fonction ne touche au
   DOM, à Firebase ou à localStorage.

   Phases : deal → describe → vote → (whiteGuess) → reveal → describe…
            → end
   ===================================================================== */
(function(global){
  "use strict";

  var DEFAULT_CONFIG = {
    undercover:1, white:0,
    timer:0,                 // secondes par description, 0 = désactivé
    firstVoteAfter:1,        // nombre de tours de description avant le premier vote (1 ou 2) ; ensuite on vote à chaque tour
    tieRule:"revote",        // "revote" : un second vote entre ex æquo, puis personne ; "none" : personne d'emporte
    whiteGuess:true,         // Mr White tente de deviner quand il est éliminé
    whiteNotFirst:true,      // Mr White ne parle jamais en premier
    announce:true,           // la catégorie figure sur les cartes
    emblem:true,             // médaillon sur les cartes
    tieWins:true,            // les intrus gagnent à parité numérique
    hideRoles:false,         // rôle de l'éliminé caché jusqu'à la fin
    points:{ civilAlive:3, civilDead:2, undercover:4, white:6, whiteGuess:8 }
  };

  function clone(o){ return JSON.parse(JSON.stringify(o)); }
  function now(){ return Engine.clock ? Engine.clock() : Date.now(); }
  function norm(s){
    return String(s||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
  }
  function shuffle(a, rng){
    rng = rng || Math.random;
    for (var i=a.length-1;i>0;i--){ var j=Math.floor(rng()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
    return a;
  }
  function mergeConfig(cfg){
    var c = clone(DEFAULT_CONFIG);
    cfg = cfg || {};
    Object.keys(cfg).forEach(function(k){
      if (k === "points"){ Object.keys(cfg.points || {}).forEach(function(pk){ c.points[pk] = cfg.points[pk]; }); }
      else if (cfg[k] !== undefined && cfg[k] !== null) c[k] = cfg[k];
    });
    return c;
  }

  /* ---------- validation d'une configuration avant lancement ---------- */
  function validate(playerCount, cfg){
    cfg = mergeConfig(cfg);
    var imp = cfg.undercover + cfg.white, civ = playerCount - imp;
    if (playerCount < 3) return "Il faut au moins trois joueurs.";
    if (imp < 1) return "Il faut au moins un intrus.";
    if (civ < 2) return "Il faut au moins deux civils.";
    if (civ <= imp) return "Les civils doivent être plus nombreux que les intrus.";
    return null;
  }

  /* ---------- création ---------- */
  /* opts = { players:[{id,name}], config, draw:{ words:[civil, undercover], unis:[a,b], uniLabel }, rng } */
  function createGame(opts){
    var cfg = mergeConfig(opts.config);
    var rng = opts.rng || Math.random;
    var err = validate(opts.players.length, cfg);
    if (err) throw new Error(err);

    var roles = [], i;
    for (i=0;i<cfg.undercover;i++) roles.push("undercover");
    for (i=0;i<cfg.white;i++) roles.push("white");
    while (roles.length < opts.players.length) roles.push("civil");
    shuffle(roles, rng);

    var words = opts.draw.words.slice(), unis = (opts.draw.unis || [null,null]).slice();

    var players = opts.players.map(function(p, idx){
      var role = roles[idx];
      return {
        id:String(p.id), name:p.name, role:role,
        word: role === "civil" ? words[0] : (role === "undercover" ? words[1] : null),
        uni:  role === "civil" ? unis[0]  : (role === "undercover" ? unis[1]  : null),
        alive:true, left:false, revealed:false, delta:0
      };
    });

    var order = shuffle(players.map(function(p){ return p.id; }), rng);
    if (cfg.whiteNotFirst){
      var first = byId(players, order[0]);
      if (first && first.role === "white"){
        for (i=1;i<order.length;i++){
          if (byId(players, order[i]).role !== "white"){ var t=order[0]; order[0]=order[i]; order[i]=t; break; }
        }
      }
    }

    return {
      version:1,
      createdAt: now(),
      config: cfg,
      pair: words, unis: unis, uniLabel: opts.draw.uniLabel || "Catégorie",
      players: players,
      order: order,
      round: 0,
      phase: "deal",
      turnIndex: 0,
      turnStartedAt: null,
      descriptions: [],
      votes: {},
      candidates: null,
      revote: false,
      lastVote: null,
      lastElimination: null,
      whiteGuesser: null,
      winner: null,
      endReason: null,
      guesser: null,
      log: []
    };
  }

  /* ---------- accès ---------- */
  function byId(list, id){ for (var i=0;i<list.length;i++){ if (list[i].id === id) return list[i]; } return null; }
  function player(s, id){ return byId(s.players, id); }
  function alivePlayers(s){ return s.players.filter(function(p){ return p.alive; }); }
  function aliveCount(s, role){ return s.players.filter(function(p){ return p.alive && (role ? p.role === role : true); }).length; }
  function currentSpeakerId(s){
    if (s.phase !== "describe") return null;
    return s.order[s.turnIndex] || null;
  }
  function voters(s){ return alivePlayers(s).map(function(p){ return p.id; }); }
  function candidates(s){
    if (s.candidates && s.candidates.length) return s.candidates.slice();
    return voters(s);
  }
  function allVoted(s){
    var v = voters(s);
    for (var i=0;i<v.length;i++){ if (!s.votes[v[i]]) return false; }
    return v.length > 0;
  }
  function pendingVoters(s){ return voters(s).filter(function(id){ return !s.votes[id]; }); }
  function voteFollowsRound(s){ return s.round >= (s.config.firstVoteAfter || 1); }
  function describedThisRound(s){
    return s.descriptions.filter(function(d){ return d.round === s.round; });
  }

  function log(s, type, data){
    var e = { at: now(), round: s.round, type: type };
    if (data) Object.keys(data).forEach(function(k){ e[k] = data[k]; });
    s.log.push(e);
  }

  /* ---------- déroulement ---------- */
  function startRound(s){
    s.round += 1;
    s.phase = "describe";
    s.turnIndex = -1;
    s.votes = {};
    s.candidates = null;
    s.revote = false;
    s.lastVote = null;
    s.whiteGuesser = null;
    advanceTurn(s);
    return s;
  }

  function advanceTurn(s){
    s.turnIndex += 1;
    while (s.turnIndex < s.order.length){
      var p = player(s, s.order[s.turnIndex]);
      if (p && p.alive) break;
      s.turnIndex += 1;
    }
    if (s.turnIndex >= s.order.length){
      if (s.round < (s.config.firstVoteAfter || 1)){ return startRound(s); }   /* tour supplémentaire sans vote */
      s.phase = "vote";
      s.turnStartedAt = null;
      s.votes = {};
      s.candidates = null;
      s.voteStartedAt = now();
    } else {
      s.turnStartedAt = now();
    }
    return s;
  }

  function submitDescription(s, playerId, text){
    if (s.phase !== "describe") return { ok:false, error:"Ce n'est pas la phase de description." };
    if (currentSpeakerId(s) !== playerId) return { ok:false, error:"Ce n'est pas le tour de ce joueur." };
    text = String(text || "").trim().replace(/\s+/g," ").slice(0, 80);
    if (!text) return { ok:false, error:"La description est vide." };
    var p = player(s, playerId);
    if (p.word && norm(text).indexOf(norm(p.word)) !== -1 && norm(p.word).length > 2){
      return { ok:false, error:"Le mot secret ne doit pas apparaître dans la description." };
    }
    s.descriptions.push({ round:s.round, playerId:playerId, text:text, at:now(), skipped:false });
    advanceTurn(s);
    return { ok:true };
  }

  function skipTurn(s, reason){
    if (s.phase !== "describe") return { ok:false, error:"Ce n'est pas la phase de description." };
    var id = currentSpeakerId(s);
    s.descriptions.push({ round:s.round, playerId:id, text: reason || "(passe)", at:now(), skipped:true });
    advanceTurn(s);
    return { ok:true };
  }

  function timerExpired(s){
    if (s.phase !== "describe" || !s.config.timer || !s.turnStartedAt) return false;
    return now() - s.turnStartedAt >= s.config.timer * 1000;
  }

  function castVote(s, voterId, targetId){
    if (s.phase !== "vote") return { ok:false, error:"Ce n'est pas la phase de vote." };
    var v = player(s, voterId), t = player(s, targetId);
    if (!v || !v.alive) return { ok:false, error:"Ce joueur ne peut pas voter." };
    if (!t || !t.alive) return { ok:false, error:"Cette cible n'est plus en jeu." };
    if (candidates(s).indexOf(targetId) === -1) return { ok:false, error:"Cette cible n'est pas éligible à ce vote." };
    var changed = !!s.votes[voterId] && s.votes[voterId] !== targetId;
    s.votes[voterId] = targetId;   /* un seul vote par joueur : un second vote remplace le premier */
    return { ok:true, changed:changed };
  }

  function tally(s){
    var counts = {}, max = 0;
    candidates(s).forEach(function(id){ counts[id] = 0; });
    Object.keys(s.votes).forEach(function(voter){
      var vp = player(s, voter);
      if (!vp || !vp.alive) return;
      var t = s.votes[voter];
      if (counts[t] === undefined) return;
      counts[t] += 1;
      if (counts[t] > max) max = counts[t];
    });
    var leaders = Object.keys(counts).filter(function(id){ return counts[id] === max && max > 0; });
    return { counts:counts, max:max, leaders:leaders, total:Object.keys(s.votes).length };
  }

  function resolveVotes(s){
    if (s.phase !== "vote") return { ok:false, error:"Ce n'est pas la phase de vote." };
    var t = tally(s);
    var snapshot = { counts:t.counts, votes:clone(s.votes), round:s.round, revote:s.revote };

    if (t.leaders.length === 1){
      s.lastVote = snapshot;
      snapshot.tie = false;
      eliminate(s, t.leaders[0], "vote");
      return { ok:true, eliminated:t.leaders[0] };
    }

    /* égalité (ou aucun vote) */
    snapshot.tie = true;
    if (s.config.tieRule === "revote" && !s.revote && t.leaders.length > 1){
      s.revote = true;
      s.candidates = t.leaders;
      s.votes = {};
      s.voteStartedAt = now();
      s.lastVote = snapshot;
      log(s, "tie-revote", { leaders:t.leaders });
      return { ok:true, revote:true, leaders:t.leaders };
    }
    s.lastVote = snapshot;
    s.lastElimination = { playerId:null, tie:true, round:s.round, leaders:t.leaders };
    s.phase = "reveal";
    log(s, "tie-none", { leaders:t.leaders });
    return { ok:true, nobody:true };
  }

  function eliminate(s, id, cause){
    var p = player(s, id);
    if (!p || !p.alive) return { ok:false, error:"Joueur introuvable ou déjà éliminé." };
    p.alive = false;
    p.revealed = !s.config.hideRoles;
    s.lastElimination = { playerId:id, role: p.revealed ? p.role : null, tie:false, round:s.round, cause:cause || "vote" };
    log(s, "eliminated", { playerId:id, role:p.role, cause:cause || "vote" });

    if (p.role === "white" && s.config.whiteGuess && !winCheck(s)){
      s.phase = "whiteGuess";
      s.whiteGuesser = id;
      s.guessStartedAt = now();
    } else {
      s.phase = "reveal";
    }
    return { ok:true };
  }

  function whiteGuess(s, text){
    if (s.phase !== "whiteGuess") return { ok:false, error:"Mr White n'a pas la main." };
    var guess = norm(text);
    var ok = !!guess && guess === norm(s.pair[0]);
    log(s, "white-guess", { playerId:s.whiteGuesser, text:String(text||""), correct:ok });
    if (ok){
      finish(s, "imposteur", "Mr White a trouvé le mot des civils : " + s.pair[0] + ".", s.whiteGuesser);
      return { ok:true, correct:true };
    }
    s.lastElimination.guess = String(text || "").trim();
    s.lastElimination.guessCorrect = false;
    s.phase = "reveal";
    return { ok:true, correct:false };
  }

  function skipWhiteGuess(s){
    if (s.phase !== "whiteGuess") return { ok:false };
    s.lastElimination.guess = null;
    s.lastElimination.guessCorrect = false;
    s.phase = "reveal";
    return { ok:true };
  }

  function continueGame(s){
    if (s.phase !== "reveal" && s.phase !== "deal") return { ok:false, error:"Rien à poursuivre." };
    var w = winCheck(s);
    if (w){ finish(s, w.winner, w.reason); return { ok:true, ended:true }; }
    if (aliveCount(s) < 3){
      finish(s, null, "Plus assez de joueurs pour continuer.");
      return { ok:true, ended:true };
    }
    startRound(s);
    return { ok:true };
  }

  function impostersWin(s){
    var imp = aliveCount(s, "undercover") + aliveCount(s, "white"), civ = aliveCount(s, "civil");
    return s.config.tieWins ? (imp >= civ) : (imp > civ);
  }
  function winCheck(s){
    var imp = aliveCount(s, "undercover") + aliveCount(s, "white");
    if (imp === 0) return { winner:"civil", reason:"Tous les intrus ont été démasqués." };
    if (impostersWin(s)) return { winner:"imposteur", reason: s.config.tieWins
      ? "Les intrus sont aussi nombreux que les civils : ils prennent la main."
      : "Les intrus sont désormais plus nombreux que les civils." };
    return null;
  }

  /* ---------- joueur qui quitte en cours de partie ---------- */
  function removePlayer(s, id){
    var p = player(s, id);
    if (!p) return { ok:false, error:"Joueur introuvable." };
    if (p.left) return { ok:true };
    p.left = true;
    var wasAlive = p.alive;
    p.alive = false;
    log(s, "left", { playerId:id });

    if (s.phase === "end" || s.phase === "deal") return { ok:true };
    if (!wasAlive) return { ok:true };

    if (s.phase === "describe"){
      if (currentSpeakerId(s) === id){
        s.descriptions.push({ round:s.round, playerId:id, text:"(a quitté la partie)", at:now(), skipped:true });
        advanceTurn(s);
      }
    } else if (s.phase === "vote"){
      delete s.votes[id];
      Object.keys(s.votes).forEach(function(v){ if (s.votes[v] === id) delete s.votes[v]; });
      if (s.candidates) s.candidates = s.candidates.filter(function(c){ return c !== id; });
      if (s.candidates && s.candidates.length < 2) s.candidates = null;
    } else if (s.phase === "whiteGuess" && s.whiteGuesser === id){
      s.lastElimination.guess = null;
      s.phase = "reveal";
    }

    var w = winCheck(s);
    if (w){ finish(s, w.winner, w.reason); return { ok:true, ended:true }; }
    if (aliveCount(s) < 3){ finish(s, null, "Plus assez de joueurs pour continuer."); return { ok:true, ended:true }; }
    return { ok:true };
  }

  /* ---------- fin ---------- */
  function awardPoints(s, winner, guesser){
    var pts = s.config.points;
    s.players.forEach(function(p){
      var d = 0;
      if (winner === "civil" && p.role === "civil" && !p.left){ d = p.alive ? pts.civilAlive : pts.civilDead; }
      else if (winner === "imposteur" && !p.left){
        if (p.role === "undercover") d = pts.undercover;
        else if (p.role === "white") d = (p.id === guesser) ? pts.whiteGuess : pts.white;
      }
      p.delta = d;
    });
  }

  function finish(s, winner, reason, guesser){
    s.phase = "end";
    s.winner = winner || null;
    s.endReason = reason;
    s.guesser = guesser || null;
    s.endedAt = now();
    s.turnStartedAt = null;
    s.players.forEach(function(p){ p.revealed = true; });
    awardPoints(s, winner, guesser);
    log(s, "end", { winner:winner, reason:reason });
    return s;
  }

  function abort(s, reason){
    return finish(s, null, reason || "Partie interrompue.");
  }

  /* ---------- vues ---------- */
  /* Vue publique : sans mots ni rôles non révélés. Utilisée pour Firebase. */
  function publicView(s){
    var v = clone(s);
    v.pair = s.phase === "end" ? s.pair : null;
    v.unis = s.phase === "end" ? s.unis : null;
    v.players = s.players.map(function(p){
      return {
        id:p.id, name:p.name, alive:p.alive, left:p.left, revealed:p.revealed, delta:p.delta,
        role: p.revealed ? p.role : null,
        word: p.revealed ? p.word : null,
        uni:  p.revealed ? p.uni : null
      };
    });
    v.log = s.log.filter(function(e){ return e.type !== "eliminated" || s.config.hideRoles === false; })
      .map(function(e){ var c = clone(e); if (c.type === "eliminated" && !byId(v.players, c.playerId).revealed) delete c.role; if (c.type === "white-guess" && s.phase !== "end") delete c.text; return c; });
    return v;
  }

  /* Vue privée d'un joueur : sa carte. */
  function privateView(s, id){
    var p = player(s, id);
    if (!p) return null;
    var common = (s.config.announce && s.unis && s.unis[0] && s.unis[0] === s.unis[1]) ? s.unis[0] : null;
    return {
      role:p.role, word:p.word,
      uni: s.config.announce ? (p.uni || common) : null,
      uniLabel: s.uniLabel
    };
  }

  /* Firebase supprime les tableaux vides et les objets vides : on rétablit. */
  function normalize(s){
    if (!s) return s;
    s.players = s.players || [];
    s.order = s.order || [];
    s.descriptions = s.descriptions || [];
    s.votes = s.votes || {};
    s.log = s.log || [];
    s.candidates = s.candidates || null;
    s.config = mergeConfig(s.config);
    s.players.forEach(function(p){
      if (p.alive === undefined) p.alive = true;
      if (p.left === undefined) p.left = false;
      if (p.revealed === undefined) p.revealed = false;
      if (p.delta === undefined) p.delta = 0;
    });
    if (s.lastVote && !s.lastVote.counts) s.lastVote.counts = {};
    if (s.lastVote && !s.lastVote.votes) s.lastVote.votes = {};
    return s;
  }

  var Engine = {
    clock: null,               /* horloge injectable : function(){ return ms; } */
    now: now,
    DEFAULT_CONFIG: DEFAULT_CONFIG,
    mergeConfig: mergeConfig,
    validate: validate,
    createGame: createGame,
    player: player,
    alivePlayers: alivePlayers,
    aliveCount: aliveCount,
    currentSpeakerId: currentSpeakerId,
    voters: voters,
    candidates: candidates,
    allVoted: allVoted,
    pendingVoters: pendingVoters,
    describedThisRound: describedThisRound,
    voteFollowsRound: voteFollowsRound,
    startRound: startRound,
    submitDescription: submitDescription,
    skipTurn: skipTurn,
    timerExpired: timerExpired,
    castVote: castVote,
    tally: tally,
    resolveVotes: resolveVotes,
    eliminate: eliminate,
    whiteGuess: whiteGuess,
    skipWhiteGuess: skipWhiteGuess,
    continueGame: continueGame,
    winCheck: winCheck,
    removePlayer: removePlayer,
    finish: finish,
    abort: abort,
    publicView: publicView,
    privateView: privateView,
    normalize: normalize,
    norm: norm,
    shuffle: shuffle,
    clone: clone
  };

  global.Engine = Engine;
  if (typeof module !== "undefined" && module.exports) module.exports = Engine;
})(typeof window !== "undefined" ? window : globalThis);
