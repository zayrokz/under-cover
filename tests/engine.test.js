/* Tests du moteur : `node --test tests/` */
const test = require("node:test");
const assert = require("node:assert/strict");
const Engine = require("../js/engine.js");

function seeded(seed){
  let x = seed || 42;
  return function(){ x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; };
}
function mk(n, config, seed){
  const players = [];
  for (let i=0;i<n;i++) players.push({ id:"p"+i, name:"Joueur "+i });
  return Engine.createGame({
    players, config,
    draw:{ words:["Chat","Chien"], unis:["Animaux","Animaux"], uniLabel:"Catégorie" },
    rng: seeded(seed)
  });
}
function role(s, r){ return s.players.filter(p => p.role === r); }
function describeAll(s){
  while (s.phase === "describe"){
    const id = Engine.currentSpeakerId(s);
    const r = Engine.submitDescription(s, id, "indice " + id);
    assert.equal(r.ok, true, r.error);
  }
}
function voteAllFor(s, targetId){
  Engine.voters(s).forEach(v => { const r = Engine.castVote(s, v, targetId); assert.equal(r.ok, true, r.error); });
}

test("validation des effectifs", () => {
  assert.equal(Engine.validate(2, {}), "Il faut au moins trois joueurs.");
  assert.equal(Engine.validate(3, { undercover:0, white:0 }), "Il faut au moins un intrus.");
  assert.equal(Engine.validate(4, { undercover:2, white:0 }), "Les civils doivent être plus nombreux que les intrus.");
  assert.equal(Engine.validate(5, { undercover:1, white:1 }), null);
});

test("distribution équilibrée des rôles et des mots", () => {
  const s = mk(7, { undercover:2, white:1 }, 7);
  assert.equal(role(s,"civil").length, 4);
  assert.equal(role(s,"undercover").length, 2);
  assert.equal(role(s,"white").length, 1);
  role(s,"civil").forEach(p => assert.equal(p.word, "Chat"));
  role(s,"undercover").forEach(p => assert.equal(p.word, "Chien"));
  role(s,"white").forEach(p => assert.equal(p.word, null));
  assert.equal(s.order.length, 7);
  assert.notEqual(Engine.player(s, s.order[0]).role, "white");
});

test("cycle description → vote → élimination → nouvelle manche", () => {
  const s = mk(5, { undercover:1, white:0 }, 3);
  Engine.continueGame(s);
  assert.equal(s.phase, "describe");
  assert.equal(s.round, 1);
  const first = Engine.currentSpeakerId(s);
  assert.equal(Engine.submitDescription(s, "nobody", "x").ok, false);
  assert.equal(Engine.submitDescription(s, first, "Chat").ok, false, "le mot secret est refusé");
  describeAll(s);
  assert.equal(s.phase, "vote");
  assert.equal(Engine.describedThisRound(s).length, 5);
  const civil = role(s,"civil")[0];
  voteAllFor(s, civil.id);
  assert.equal(Engine.allVoted(s), true);
  const r = Engine.resolveVotes(s);
  assert.equal(r.eliminated, civil.id);
  assert.equal(s.phase, "reveal");
  assert.equal(s.lastElimination.role, "civil");
  Engine.continueGame(s);
  assert.equal(s.phase, "describe");
  assert.equal(s.round, 2);
  assert.equal(Engine.alivePlayers(s).length, 4);
});

test("double vote : le second vote remplace le premier", () => {
  const s = mk(4, { undercover:1 }, 1);
  Engine.continueGame(s); describeAll(s);
  const [a, b, c] = Engine.voters(s);
  Engine.castVote(s, a, b);
  const r = Engine.castVote(s, a, c);
  assert.equal(r.changed, true);
  assert.equal(Object.keys(s.votes).length, 1);
  assert.equal(s.votes[a], c);
  assert.equal(Engine.castVote(s, a, a).ok, true, "voter pour soi est permis");
});

test("égalité : revote unique puis personne", () => {
  const s = mk(4, { undercover:1, tieRule:"revote" }, 5);
  Engine.continueGame(s); describeAll(s);
  const [a, b, c, d] = Engine.voters(s);
  Engine.castVote(s, a, b); Engine.castVote(s, b, a); Engine.castVote(s, c, b); Engine.castVote(s, d, a);
  let r = Engine.resolveVotes(s);
  assert.equal(r.revote, true);
  assert.equal(s.phase, "vote");
  assert.deepEqual(Engine.candidates(s).sort(), [a, b].sort());
  assert.equal(Engine.castVote(s, a, c).ok, false, "hors des ex æquo");
  Engine.castVote(s, a, b); Engine.castVote(s, b, a); Engine.castVote(s, c, b); Engine.castVote(s, d, a);
  r = Engine.resolveVotes(s);
  assert.equal(r.nobody, true);
  assert.equal(s.phase, "reveal");
  assert.equal(s.lastElimination.playerId, null);
  assert.equal(Engine.alivePlayers(s).length, 4);
});

test("égalité : règle « personne » immédiate", () => {
  const s = mk(4, { undercover:1, tieRule:"none" }, 5);
  Engine.continueGame(s); describeAll(s);
  const [a, b, c, d] = Engine.voters(s);
  Engine.castVote(s, a, b); Engine.castVote(s, b, a); Engine.castVote(s, c, b); Engine.castVote(s, d, a);
  const r = Engine.resolveVotes(s);
  assert.equal(r.nobody, true);
  assert.equal(s.phase, "reveal");
});

test("victoire des civils quand tous les intrus sont éliminés", () => {
  const s = mk(4, { undercover:1 }, 9);
  Engine.continueGame(s); describeAll(s);
  const u = role(s,"undercover")[0];
  voteAllFor(s, u.id);
  Engine.resolveVotes(s);
  Engine.continueGame(s);
  assert.equal(s.phase, "end");
  assert.equal(s.winner, "civil");
  role(s,"civil").forEach(p => assert.equal(p.delta, 3));
  assert.equal(u.delta, 0);
});

test("victoire des intrus à parité", () => {
  const s = mk(4, { undercover:1, tieWins:true }, 11);
  Engine.continueGame(s); describeAll(s);
  const civils = role(s,"civil");
  voteAllFor(s, civils[0].id); Engine.resolveVotes(s); Engine.continueGame(s);
  assert.equal(s.phase, "describe");
  describeAll(s);
  voteAllFor(s, civils[1].id); Engine.resolveVotes(s); Engine.continueGame(s);
  assert.equal(s.phase, "end");
  assert.equal(s.winner, "imposteur");
});

test("Mr White éliminé devine le mot", () => {
  const s = mk(5, { undercover:1, white:1 }, 13);
  Engine.continueGame(s); describeAll(s);
  const w = role(s,"white")[0];
  voteAllFor(s, w.id); Engine.resolveVotes(s);
  assert.equal(s.phase, "whiteGuess");
  assert.equal(s.whiteGuesser, w.id);
  const r = Engine.whiteGuess(s, "  chât ");
  assert.equal(r.correct, true);
  assert.equal(s.phase, "end");
  assert.equal(s.winner, "imposteur");
  assert.equal(w.delta, 8);
});

test("Mr White éliminé rate sa devinette : la partie continue", () => {
  const s = mk(5, { undercover:1, white:1 }, 13);
  Engine.continueGame(s); describeAll(s);
  const w = role(s,"white")[0];
  voteAllFor(s, w.id); Engine.resolveVotes(s);
  Engine.whiteGuess(s, "Souris");
  assert.equal(s.phase, "reveal");
  Engine.continueGame(s);
  assert.equal(s.phase, "describe");
  assert.equal(s.round, 2);
});

test("joueur qui quitte pendant la description : son tour est passé", () => {
  const s = mk(5, { undercover:1 }, 17);
  Engine.continueGame(s);
  const cur = Engine.currentSpeakerId(s);
  Engine.removePlayer(s, cur);
  assert.notEqual(Engine.currentSpeakerId(s), cur);
  assert.equal(Engine.player(s, cur).left, true);
  assert.equal(Engine.describedThisRound(s)[0].skipped, true);
});

test("joueur qui quitte pendant le vote : ses votes disparaissent", () => {
  const s = mk(5, { undercover:1 }, 19);
  Engine.continueGame(s); describeAll(s);
  const [a, b, c] = Engine.voters(s);
  Engine.castVote(s, a, b); Engine.castVote(s, c, b);
  Engine.removePlayer(s, b);
  assert.equal(Object.keys(s.votes).length, 0);
  assert.equal(Engine.voters(s).indexOf(b), -1);
});

test("nombre de joueurs insuffisant après départs : fin de partie", () => {
  const s = mk(4, { undercover:1 }, 23);
  Engine.continueGame(s);
  const civils = role(s,"civil");
  Engine.removePlayer(s, civils[0].id);
  assert.equal(s.phase, "describe", "3 restants dont 2 civils : la partie continue");
  Engine.removePlayer(s, civils[1].id);
  assert.equal(s.phase, "end");
  assert.equal(Engine.alivePlayers(s).length, 2);
});

test("vues publique et privée ne fuient pas les mots", () => {
  const s = mk(4, { undercover:1 }, 29);
  Engine.continueGame(s);
  const pub = Engine.publicView(s);
  assert.equal(pub.pair, null);
  pub.players.forEach(p => { assert.equal(p.role, null); assert.equal(p.word, null); });
  const priv = Engine.privateView(s, s.players[0].id);
  assert.equal(priv.word, s.players[0].word);
  Engine.abort(s);
  const pubEnd = Engine.publicView(s);
  assert.deepEqual(pubEnd.pair, ["Chat","Chien"]);
  pubEnd.players.forEach(p => assert.ok(p.role));
});

test("normalize rétablit les collections supprimées par Firebase", () => {
  const s = mk(4, { undercover:1 }, 31);
  const stripped = JSON.parse(JSON.stringify(s));
  delete stripped.descriptions; delete stripped.votes; delete stripped.log;
  const n = Engine.normalize(stripped);
  assert.deepEqual(n.descriptions, []);
  assert.deepEqual(n.votes, {});
  assert.equal(n.config.tieRule, "revote");
});
