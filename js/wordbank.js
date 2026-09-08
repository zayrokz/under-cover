/* =====================================================================
   TIRAGE DES MOTS — sélection d'une paire dans la banque (js/words.js)
   =====================================================================
   selection = {
     customWords: bool, custom:[motCivils, motUndercover],
     mode: "solo" | "mix" | "theme",
     serieId: "random" | id, themeId: "random" | id
   }
   ===================================================================== */
(function(global){
  "use strict";

  var W = global.WORDS;

  function byId(list, id){ for (var i=0;i<list.length;i++){ if (list[i].id === id) return list[i]; } return null; }
  function activeList(sel){ return sel.mode === "theme" ? W.THEMES : W.SERIES; }
  function activeId(sel){ return sel.mode === "theme" ? sel.themeId : sel.serieId; }

  /* Filtre par niveau : ne concerne que les duos étiquetés (troisième élément). */
  function eligible(pairs, diff){
    var f = pairs.filter(function(p){ return !p[2] || p[2] === diff; });
    return f.length ? f : pairs;
  }

  function poolSize(sel, diff){
    if (sel.customWords) return 1;
    if (sel.mode === "mix") return W.CROSSOVER.length;
    var list = activeList(sel), cur = activeId(sel);
    if (cur === "random"){
      return list.reduce(function(n, s){ return n + eligible(s.pairs, diff).length; }, 0);
    }
    var g = byId(list, cur);
    return g ? eligible(g.pairs, diff).length : 0;
  }

  function describe(sel, diff){
    var n = poolSize(sel, diff);
    if (sel.customWords) return "Mots saisis à la main.";
    if (sel.mode === "mix"){
      return n + " duos croisés sur " + W.SERIES.length + " séries. Chaque carte indique son propre univers, ce qui ne trahit rien : les deux camps n'ont pas la même origine.";
    }
    if (sel.mode === "theme"){
      var t = byId(W.THEMES, sel.themeId);
      return n + " duos" + (sel.themeId === "random" ? ", thème tiré au sort à chaque partie" : " pour " + (t ? t.label : "")) + ". La catégorie est annoncée à tout le monde, Mr White compris.";
    }
    if (sel.serieId === "random"){
      return n + " duos disponibles sur " + W.SERIES.length + " séries, une série tirée au sort à chaque partie. L'univers est annoncé à tout le monde, Mr White compris.";
    }
    var s = byId(W.SERIES, sel.serieId);
    return n + " duos pour " + (s ? s.label : "") + ". L'univers est annoncé à tout le monde, Mr White compris.";
  }

  /* Renvoie { words:[civils, undercover], unis:[a,b], uniLabel } ; l'ordre est inversé une fois sur deux. */
  function draw(sel, diff, rng){
    rng = rng || Math.random;
    var out;
    if (sel.customWords){
      out = { words:[sel.custom[0], sel.custom[1]], unis:[null,null], uniLabel:"Catégorie" };
      return out;
    }
    if (sel.mode === "mix"){
      var x = W.CROSSOVER[Math.floor(rng()*W.CROSSOVER.length)];
      out = { words:[x[0], x[2]], unis:[x[1], x[3]], uniLabel:"Univers" };
    } else {
      var list = activeList(sel), cur = activeId(sel);
      var group = cur === "random" ? list[Math.floor(rng()*list.length)] : byId(list, cur);
      if (!group) throw new Error("Aucun groupe de mots disponible.");
      var pool = eligible(group.pairs, diff);
      var p = pool[Math.floor(rng()*pool.length)];
      out = { words:[p[0], p[1]], unis:[group.label, group.label], uniLabel: sel.mode === "theme" ? "Catégorie" : "Univers" };
    }
    if (rng() < 0.5){ out.words.reverse(); out.unis.reverse(); }
    return out;
  }

  function tintOf(label){
    var all = W.SERIES.concat(W.THEMES);
    for (var i=0;i<all.length;i++){ if (all[i].label === label) return all[i].tint; }
    return "#E0A93B";
  }

  function stats(){
    var tagged = 0, total = 0;
    W.THEMES.concat(W.SERIES).forEach(function(g){ g.pairs.forEach(function(p){ total++; if (p[2]) tagged++; }); });
    return { tagged:tagged, total:total + W.CROSSOVER.length };
  }

  global.WordBank = {
    byId:byId, activeList:activeList, activeId:activeId,
    eligible:eligible, poolSize:poolSize, describe:describe, draw:draw, tintOf:tintOf, stats:stats
  };
})(window);
