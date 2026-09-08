/* =====================================================================
   INTERFACE PARTAGÉE — rendu des écrans de partie pour les deux modes
   =====================================================================
   Le rendu reçoit l'état du moteur et un « contexte » ctx décrit par le
   contrôleur (local.js ou online.js) :
   ctx = {
     mode: "local" | "online",
     meId: uid | null,               // en ligne : mon identifiant
     isHost: bool,                   // qui peut piloter (local : toujours vrai)
     clockOffset: ms,                // décalage entre l'horloge locale et celle du moteur
     members: { id:{connected} },    // en ligne : présence
     local: { voteUnlocked },        // local : confidentialité du vote
     canActFor: function(playerId),  // cet appareil peut agir pour ce joueur
     scores: [{name, pts, delta}], manche,
     on: { describe, skip, timerExpired, unlockVote, vote, closeVote, continue,
           guess, skipGuess, remove, abort, leave, replay, restart, home, resetScores, showCard }
   }
   ===================================================================== */
(function(global){
  "use strict";

  function $(id){ return document.getElementById(id); }
  var SCREENS = ["screen-home","screen-setup","screen-lobby","screen-deal","screen-card","screen-play","screen-end","screen-settings","screen-editor"];
  var BACK_SCREENS = { "screen-setup":true, "screen-settings":true, "screen-editor":true };
  var CONTEXT = { "screen-setup":"Nouvelle partie", "screen-lobby":"Salon", "screen-deal":"Distribution", "screen-card":"Votre carte",
    "screen-play":"Partie", "screen-end":"Fin de partie", "screen-settings":"Paramètres", "screen-editor":"Mots" };
  var current = null;
  function show(id){
    for (var i=0;i<SCREENS.length;i++){ $(SCREENS[i]).hidden = (SCREENS[i] !== id); }
    if (current !== id) window.scrollTo(0,0);
    current = id;
    document.body.setAttribute("data-screen", id);
    $("top-back").hidden = !BACK_SCREENS[id];
    $("top-context").textContent = CONTEXT[id] || "";
  }
  function currentScreen(){ return current; }
  function el(tag, cls, text){
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function clear(node){ node.innerHTML = ""; }
  function roleLabel(role){ return role === "civil" ? "Civil" : (role === "undercover" ? "Undercover" : (role === "white" ? "Mr White" : "?")); }
  function roleText(role){ return role === "civil" ? "un civil" : (role === "undercover" ? "un undercover" : "Mr White"); }
  function isLight(){ return document.body.classList.contains("light"); }
  function names(s, ids){ return ids.map(function(id){ var p = Engine.player(s, id); return p ? p.name : "?"; }); }
  function joinNames(list){
    if (list.length <= 1) return list.join("");
    return list.slice(0,-1).join(", ") + " et " + list[list.length-1];
  }

  /* ---------- messages ---------- */
  var snackTimer = null;
  function snack(msg, ms){
    var s = $("snack");
    s.textContent = msg; s.hidden = false;
    clearTimeout(snackTimer);
    snackTimer = setTimeout(function(){ s.hidden = true; }, ms || 2600);
  }
  function toast(id, msg, ok){
    var t = $(id); if (!t) return;
    t.textContent = msg || "";
    t.className = "toast" + (ok ? " ok" : "");
  }

  /* ---------- médaillon ---------- */
  function hashCode(s){ var h = 0; for (var i=0;i<s.length;i++){ h = (h * 31 + s.charCodeAt(i)) | 0; } return Math.abs(h); }
  function initials(name){
    var parts = String(name).split(/[\s'-]+/).filter(Boolean);
    var a = parts[0] ? parts[0].charAt(0) : "?";
    var b = parts[1] ? parts[1].charAt(0) : (parts[0] && parts[0].length > 1 ? parts[0].charAt(1) : "");
    return (a + b).toUpperCase();
  }
  function paintEmblem(node, name, universe, isWhite){
    clear(node);
    node.style.background = "var(--surface-2)";
    if (isWhite){
      node.style.borderColor = "var(--danger)"; node.style.color = "var(--danger)"; node.textContent = "?";
      return;
    }
    node.style.color = "var(--text)";
    node.style.borderColor = universe ? WordBank.tintOf(universe) : "var(--accent)";
    var url = WORDS.IMAGES[Engine.norm(name)];
    if (url){
      var img = document.createElement("img");
      img.alt = "";
      img.addEventListener("error", function(){ if (img.parentNode) img.parentNode.removeChild(img); node.textContent = initials(name); });
      img.src = url;
      node.appendChild(img);
      return;
    }
    var t = hashCode(Engine.norm(name)) % 360;
    var l1 = isLight() ? 82 : 27, l2 = isLight() ? 70 : 15;
    node.style.background = "linear-gradient(145deg, hsl(" + t + ", 40%, " + l1 + "%), hsl(" + ((t+45)%360) + ", 36%, " + l2 + "%))";
    node.textContent = initials(name);
  }

  /* ---------- carte secrète (prefix = "card" ou "mycard") ---------- */
  function fillCard(prefix, priv, cfg){
    var emblem = $(prefix + "-emblem"), kicker = $(prefix + "-kicker"), word = $(prefix + "-word"), sub = $(prefix + "-sub");
    emblem.hidden = !cfg.emblem;
    if (priv.role === "white"){
      paintEmblem(emblem, "", null, true);
      kicker.textContent = "Aucun mot";
      word.textContent = "Mr White";
      word.className = "word white";
      sub.textContent = (priv.uni ? priv.uniLabel + " : " + priv.uni + ". " : "") + "Écoutez les autres et faites comme si vous saviez.";
    } else {
      paintEmblem(emblem, priv.word, priv.uni, false);
      kicker.textContent = "Votre mot";
      word.textContent = priv.word;
      word.className = "word";
      sub.textContent = priv.uni ? priv.uniLabel + " : " + priv.uni : "";
    }
  }
  function showSecret(prefix, shown){
    $(prefix + "-hidden").hidden = !!shown;
    $(prefix + "-shown").hidden = !shown;
  }

  /* ---------- minuteur ---------- */
  var timer = { handle:null, key:null };
  function stopTimer(){ if (timer.handle){ clearInterval(timer.handle); timer.handle = null; } timer.key = null; }
  function runTimer(key, endsAt, total, nowFn, onExpire){
    if (timer.key === key && timer.handle) return;
    stopTimer();
    timer.key = key;
    var fill = $("timer-fill"), text = $("timer-text");
    var fired = false;
    var tick = function(){
      var remaining = Math.max(0, endsAt - nowFn());
      var ratio = total > 0 ? remaining / total : 0;
      fill.style.width = (ratio * 100) + "%";
      fill.className = remaining < 5000 ? "late" : "";
      text.textContent = Math.ceil(remaining / 1000) + " s";
      if (remaining <= 0 && !fired){ fired = true; stopTimer(); if (onExpire) onExpire(); }
    };
    tick();
    timer.handle = setInterval(tick, 250);
  }

  /* ---------- ordre de parole ---------- */
  function renderOrder(container, s, ctx){
    clear(container);
    var speaker = Engine.currentSpeakerId(s);
    s.order.forEach(function(id){
      var p = Engine.player(s, id);
      if (!p) return;
      var li = el("li");
      li.appendChild(el("span", "who", p.name));
      if (!p.alive) li.classList.add("out");
      if (speaker === id) li.classList.add("active");
      if (ctx.meId && ctx.meId === id) li.classList.add("me");
      if (p.left) li.appendChild(el("span", "badge", "parti"));
      else if (!p.alive) li.appendChild(el("span", "badge", p.revealed ? roleLabel(p.role) : "éliminé"));
      else if (s.phase === "vote" && s.votes[id]) li.appendChild(el("span", "badge done", "a voté"));
      if (ctx.members && p.alive && !p.left && ctx.members[id] && ctx.members[id].connected === false){
        li.appendChild(el("span", "badge warn", "déconnecté"));
      }
      container.appendChild(li);
    });
  }

  /* ---------- historique ---------- */
  function renderHistory(container, emptyEl, s, opts){
    clear(container);
    opts = opts || {};
    var rounds = {};
    s.descriptions.forEach(function(d){ (rounds[d.round] = rounds[d.round] || []).push(d); });
    var keys = Object.keys(rounds).map(Number).sort(function(a,b){ return opts.ascending ? a - b : b - a; });
    if (emptyEl) emptyEl.hidden = keys.length > 0;
    keys.forEach(function(r){
      container.appendChild(el("li", "round-title", "Tour " + r));
      rounds[r].forEach(function(d){
        var p = Engine.player(s, d.playerId);
        var li = el("li", d.skipped ? "skipped" : "");
        if (p && !p.alive && !opts.ascending) li.classList.add("out");
        li.appendChild(el("span", "h-name", p ? p.name : "?"));
        li.appendChild(el("span", "h-text", d.text));
        container.appendChild(li);
      });
    });
  }

  /* ---------- dépouillement ---------- */
  function renderTally(container, s){
    clear(container);
    var lv = s.lastVote;
    if (!lv || !lv.counts) return;
    var ids = Object.keys(lv.counts).sort(function(a,b){ return lv.counts[b] - lv.counts[a]; });
    ids.forEach(function(id){
      var p = Engine.player(s, id);
      if (!p) return;
      var li = el("li");
      var left = el("span", null, p.name);
      var voters = Object.keys(lv.votes || {}).filter(function(v){ return lv.votes[v] === id; });
      if (voters.length) left.appendChild(el("small", null, "voté par " + joinNames(names(s, voters))));
      li.appendChild(left);
      li.appendChild(el("span", "tag " + (lv.counts[id] > 0 ? "undercover" : "muted"), lv.counts[id] + " voix"));
      container.appendChild(li);
    });
  }

  /* ---------- confirmation ---------- */
  function confirmBox(slot, text, yesLabel, onYes, onNo){
    clear(slot);
    var box = el("div", "confirm");
    box.appendChild(el("p", null, text));
    var row = el("div", "row");
    var yes = el("button", "danger", yesLabel); yes.type = "button";
    var no = el("button", null, "Annuler"); no.type = "button";
    yes.addEventListener("click", function(){ clear(slot); onYes(); });
    no.addEventListener("click", function(){ clear(slot); if (onNo) onNo(); });
    row.appendChild(yes); row.appendChild(no);
    box.appendChild(row);
    slot.appendChild(box);
  }

  /* ---------- écran de partie ---------- */
  var lastTurnKey = null, pendingVoteTarget = null;

  function renderPlay(s, ctx){
    show("screen-play");
    var PHASES = { describe:"Description", vote: s.revote ? "Second vote" : "Vote", whiteGuess:"Mr White devine", reveal:"Résultat" };
    $("play-phase").textContent = PHASES[s.phase] || s.phase;
    $("play-round").textContent = "Tour " + s.round;

    ["describe-panel","vote-panel","guess-panel","reveal-panel"].forEach(function(id){ $(id).hidden = true; });
    var nowFn = function(){ return Date.now() + (ctx.clockOffset || 0); };

    /* ----- description ----- */
    if (s.phase === "describe"){
      var cur = Engine.currentSpeakerId(s), p = Engine.player(s, cur);
      var canAct = !!p && ctx.canActFor(cur);
      $("describe-panel").hidden = false;
      $("turn-name").textContent = p ? p.name : "—";
      var key = s.round + ":" + s.turnIndex;
      if (key !== lastTurnKey){ $("describe-input").value = ""; toast("play-toast", ""); lastTurnKey = key; }
      $("describe-form").hidden = !canAct;
      $("describe-wait").hidden = canAct;
      if (!canAct){
        var off = ctx.members && ctx.members[cur] && ctx.members[cur].connected === false;
        var w = $("describe-wait"); clear(w);
        w.appendChild(document.createTextNode("En attente de "));
        w.appendChild(el("b", null, p ? p.name : "?"));
        w.appendChild(document.createTextNode(off ? " (déconnecté)…" : "…"));
      }
      var remainingSpeakers = s.order.slice(s.turnIndex + 1).filter(function(id){ var q = Engine.player(s, id); return q && q.alive; }).length;
      $("describe-hint").textContent = Engine.voteFollowsRound(s)
        ? (remainingSpeakers ? "Encore " + remainingSpeakers + " joueur" + (remainingSpeakers > 1 ? "s" : "") + " avant le vote." : "Dernier à parler : le vote suit.")
        : "Tour sans vote : un second tour de description suivra.";
      $("describe-skip").hidden = !(ctx.isHost || canAct);
      $("describe-skip").textContent = canAct ? "Passer son tour" : "Passer le tour de " + (p ? p.name : "");
      if (s.config.timer > 0 && s.turnStartedAt){
        $("timer").hidden = false;
        runTimer(key, s.turnStartedAt + s.config.timer * 1000, s.config.timer * 1000, nowFn, function(){ if (ctx.on.timerExpired) ctx.on.timerExpired(); });
      } else { $("timer").hidden = true; stopTimer(); }
      if (canAct && ctx.mode === "online") setTimeout(function(){ try { $("describe-input").focus({ preventScroll:true }); } catch(e){} }, 50);
    } else { stopTimer(); }

    /* ----- vote ----- */
    if (s.phase === "vote"){
      $("vote-panel").hidden = false;
      var cands = Engine.candidates(s);
      var pending = s.order.filter(function(id){ return Engine.pendingVoters(s).indexOf(id) !== -1; });
      var totalVoters = Engine.voters(s).length, cast = totalVoters - pending.length;
      $("vote-info").textContent = s.revote
        ? "Égalité au premier vote. Nouveau vote entre " + joinNames(names(s, cands)) + ". En cas de nouvelle égalité, personne ne sera éliminé."
        : (s.config.tieRule === "revote" ? "Chacun vote pour le joueur à éliminer. En cas d'égalité, un second vote départage les ex æquo." : "Chacun vote pour le joueur à éliminer. En cas d'égalité, personne n'est éliminé.");
      clear($("vote-confirm"));
      var grid = $("vote-grid"); clear(grid);
      var voterId = null, showGrid = false;

      if (ctx.mode === "local"){
        voterId = pending[0] || null;
        var unlocked = ctx.local && ctx.local.voteUnlocked;
        $("vote-handoff").hidden = !(voterId && !unlocked);
        $("vote-handoff-name").textContent = voterId ? Engine.player(s, voterId).name : "";
        showGrid = !!(voterId && unlocked);
        $("vote-caption").hidden = !showGrid;
        if (showGrid) $("vote-caption").textContent = Engine.player(s, voterId).name + ", choisis un joueur à éliminer. Personne d'autre ne regarde l'écran.";
        $("vote-status").textContent = "Votes exprimés : " + cast + " / " + totalVoters + ".";
        $("vote-close").hidden = true;
      } else {
        $("vote-handoff").hidden = true;
        var me = ctx.meId, mp = Engine.player(s, me);
        if (mp && mp.alive){
          voterId = me; showGrid = true;
          $("vote-caption").hidden = false;
          $("vote-caption").textContent = s.votes[me] ? "Votre vote est enregistré. Vous pouvez encore le modifier tant que le vote n'est pas clos." : "Choisissez le joueur à éliminer.";
        } else {
          $("vote-caption").hidden = false;
          $("vote-caption").textContent = mp ? "Vous êtes éliminé : vous observez le vote." : "Vous rejoindrez la partie à la prochaine manche.";
        }
        var pendingNames = pending.map(function(id){
          var pp = Engine.player(s, id), off = ctx.members && ctx.members[id] && ctx.members[id].connected === false;
          return pp.name + (off ? " (déconnecté)" : "");
        });
        $("vote-status").textContent = cast + " / " + totalVoters + " ont voté." + (pending.length ? " En attente de " + joinNames(pendingNames) + "." : "");
        $("vote-close").hidden = !(ctx.isHost && pending.length > 0 && cast > 0);
        $("vote-close").textContent = "Clore le vote maintenant (" + pending.length + " sans vote)";
      }

      if (showGrid){
        cands.forEach(function(id){
          var cp = Engine.player(s, id);
          var b = el("button", "person"); b.type = "button";
          b.textContent = cp.name;
          if (id === voterId) b.appendChild(el("small", null, "vous-même"));
          b.setAttribute("aria-pressed", String(s.votes[voterId] === id || pendingVoteTarget === id));
          b.addEventListener("click", function(){
            pendingVoteTarget = id;
            var buttons = grid.querySelectorAll(".person");
            for (var i=0;i<buttons.length;i++) buttons[i].setAttribute("aria-pressed", "false");
            b.setAttribute("aria-pressed", "true");
            confirmBox($("vote-confirm"), "Voter contre " + cp.name + " ?", "Confirmer", function(){
              pendingVoteTarget = null;
              ctx.on.vote(voterId, id);
            }, function(){ pendingVoteTarget = null; b.setAttribute("aria-pressed", String(s.votes[voterId] === id)); });
          });
          grid.appendChild(b);
        });
      }
    } else { pendingVoteTarget = null; }

    /* ----- Mr White devine ----- */
    if (s.phase === "whiteGuess"){
      $("guess-panel").hidden = false;
      var wp = Engine.player(s, s.whiteGuesser);
      var canGuess = !!wp && ctx.canActFor(wp.id);
      $("guess-info").textContent = (wp ? wp.name + " était Mr White. " : "") + "Un seul essai pour nommer le mot des civils.";
      $("guess-form").hidden = !canGuess;
      $("guess-wait").hidden = canGuess;
      $("guess-wait").textContent = "En attente de la réponse de " + (wp ? wp.name : "Mr White") + "…";
      $("guess-skip").hidden = !(ctx.isHost || canGuess);
    }

    /* ----- résultat ----- */
    if (s.phase === "reveal"){
      $("reveal-panel").hidden = false;
      renderTally($("tally"), s);
      var v = $("verdict"); clear(v);
      var le = s.lastElimination;
      if (!le || le.tie){
        v.className = "verdict tie";
        v.appendChild(el("strong", null, "Égalité"));
        v.appendChild(document.createTextNode(" : personne n'est éliminé à ce tour."));
      } else {
        var ep = Engine.player(s, le.playerId);
        v.appendChild(el("strong", null, ep.name));
        if (le.role){
          v.className = "verdict " + (le.role === "civil" ? "civil" : "imposteur");
          v.appendChild(document.createTextNode(" était " + roleText(le.role) + "."));
        } else {
          v.className = "verdict";
          v.appendChild(document.createTextNode(" est éliminé. Son rôle ne sera révélé qu'à la fin."));
        }
        if (le.role === "white" && le.guess !== undefined){
          v.appendChild(el("br"));
          v.appendChild(document.createTextNode(le.guess ? "Sa proposition « " + le.guess + " » était fausse." : "Il n'a pas proposé de mot."));
        }
      }
      var over = Engine.winCheck(s) || Engine.aliveCount(s) < 3;
      $("continue").hidden = !ctx.isHost;
      $("continue-wait").hidden = ctx.isHost;
      $("continue").textContent = over ? "Voir le résultat final" : "Tour suivant";
    }

    renderOrder($("order"), s, ctx);
    renderHistory($("history"), $("history-empty"), s, {});

    $("open-remove").hidden = !ctx.isHost;
    $("reveal-all").hidden = !ctx.isHost;
    $("leave-game").hidden = !(ctx.mode === "online" && !ctx.isHost);
    $("show-card").hidden = !(ctx.mode === "online" && Engine.player(s, ctx.meId));
    clear($("remove-slot"));
  }

  /* ---------- fin ---------- */
  function renderEnd(s, ctx){
    show("screen-end");
    var banner = $("end-banner");
    banner.className = "banner" + (s.winner ? " " + s.winner : "");
    $("end-who").textContent = s.winner === "civil" ? "Les civils" : (s.winner === "imposteur" ? "Les intrus" : "Aucun camp");
    var recap = s.pair ? " Duo : " + s.pair[0] + (s.unis && s.unis[0] ? " (" + s.unis[0] + ")" : "") +
                " contre " + s.pair[1] + (s.unis && s.unis[1] ? " (" + s.unis[1] + ")" : "") + "." : "";
    $("end-why").textContent = (s.endReason || "") + recap;

    var list = $("end-list"); clear(list);
    s.players.forEach(function(p){
      var li = el("li", p.left ? "left" : "");
      var left = el("span", null, p.name + (p.word ? " — " + p.word : ""));
      var bits = [];
      if (p.uni) bits.push(p.uni);
      if (p.left) bits.push("a quitté la partie"); else if (!p.alive) bits.push("éliminé");
      if (p.delta) bits.push("+" + p.delta + " pt" + (p.delta > 1 ? "s" : ""));
      if (bits.length) left.appendChild(el("small", null, bits.join(" · ")));
      li.appendChild(left);
      li.appendChild(el("span", "tag " + (p.role || "muted"), roleLabel(p.role)));
      list.appendChild(li);
    });

    renderHistory($("end-history"), null, s, { ascending:true });
    if (!s.descriptions.length) $("end-history").appendChild(el("li", "skipped", "Aucune description enregistrée."));

    $("manche-no").textContent = ctx.manche || 1;
    var pts = s.config.points;
    $("score-rule").textContent = "Civil vainqueur : " + pts.civilAlive + " points s'il est en vie, " + pts.civilDead + " sinon. Undercover : " + pts.undercover +
      ". Mr White : " + pts.white + (s.config.whiteGuess ? ", " + pts.whiteGuess + " s'il devine le mot" : "") + ". Partie interrompue : aucun point.";
    var sl = $("score-list"); clear(sl);
    (ctx.scores || []).forEach(function(row, i){
      var li = el("li");
      var left = el("span", null, (i+1) + ". " + row.name);
      if (row.delta) left.appendChild(el("small", null, "+" + row.delta + " cette manche"));
      li.appendChild(left);
      li.appendChild(el("span", "tag undercover", row.pts + " pts"));
      sl.appendChild(li);
    });
    if (!(ctx.scores || []).length) sl.appendChild(el("li", null, "Aucun score."));

    $("reset-scores").hidden = !ctx.isHost;
    $("replay").hidden = !ctx.isHost;
    $("restart").hidden = !ctx.isHost;
    $("end-wait").hidden = ctx.isHost;
    $("restart").textContent = ctx.mode === "online" ? "Retour au salon" : "Changer les joueurs";
  }

  global.UI = {
    $:$, show:show, currentScreen:currentScreen, el:el, clear:clear, snack:snack, toast:toast,
    roleLabel:roleLabel, roleText:roleText, isLight:isLight, joinNames:joinNames,
    paintEmblem:paintEmblem, fillCard:fillCard, showSecret:showSecret,
    runTimer:runTimer, stopTimer:stopTimer,
    renderOrder:renderOrder, renderHistory:renderHistory, renderTally:renderTally, confirmBox:confirmBox,
    renderPlay:renderPlay, renderEnd:renderEnd
  };
})(window);
