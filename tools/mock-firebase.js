/* =====================================================================
   FAUX FIREBASE EN MÉMOIRE — outil de test, jamais chargé en production
   =====================================================================
   Reproduit le sous-ensemble de l'API « compat » utilisé par js/online.js
   (auth anonyme, Realtime Database : ref/on/off/once/set/update/push/
   remove/transaction/onDisconnect). Les données vivent dans window.MOCK_DB.
   Injection dans une page ouverte :
     fetch('/tools/mock-firebase.js').then(r => r.text()).then(eval)
   puis FIREBASE_CONFIG.apiKey = "mock" et rechargement de l'accueil.
   ===================================================================== */
(function(global){
  "use strict";
  var DB = global.MOCK_DB = global.MOCK_DB || {};
  var listeners = [];           /* { path, ev, cb, seen:{} } */
  var uid = global.MOCK_UID || ("mock-" + Math.random().toString(36).slice(2, 8));
  global.MOCK_UID = uid;

  function segs(path){ return String(path).split("/").filter(Boolean); }
  function getAt(path){
    var node = DB, s = segs(path);
    for (var i=0;i<s.length;i++){ if (node === null || typeof node !== "object" || !(s[i] in node)) return null; node = node[s[i]]; }
    return node === undefined ? null : clone(node);
  }
  function clean(v){
    if (Array.isArray(v)){ var o = {}; v.forEach(function(x, i){ var c = clean(x); if (c !== null) o[i] = c; }); return Object.keys(o).length ? o : null; }
    if (v && typeof v === "object"){
      if (v[".sv"] === "timestamp") return Date.now();
      var out = {}, any = false;
      Object.keys(v).forEach(function(k){ var c = clean(v[k]); if (c !== null && c !== undefined){ out[k] = c; any = true; } });
      return any ? out : null;
    }
    if (v === undefined) return null;
    return v;
  }
  function setAt(path, value){
    var s = segs(path), v = clean(value);
    if (!s.length){ Object.keys(DB).forEach(function(k){ delete DB[k]; }); if (v) Object.keys(v).forEach(function(k){ DB[k] = v[k]; }); return; }
    var node = DB;
    for (var i=0;i<s.length-1;i++){
      if (node[s[i]] === null || typeof node[s[i]] !== "object"){ if (v === null) return; node[s[i]] = {}; }
      node = node[s[i]];
    }
    if (v === null) delete node[s[s.length-1]]; else node[s[s.length-1]] = v;
    /* nettoyage des objets vides */
    prune(DB, s);
  }
  function prune(root, s){
    for (var depth = s.length - 1; depth > 0; depth--){
      var node = root;
      for (var i=0;i<depth;i++){ node = node && node[s[i]]; }
      if (node && typeof node === "object" && !Object.keys(node).length){
        var parent = root; for (var j=0;j<depth-1;j++){ parent = parent[s[j]]; }
        delete parent[s[depth-1]];
      }
    }
  }
  function clone(v){ return v === undefined ? null : JSON.parse(JSON.stringify(v)); }
  function arrayify(v){
    /* Firebase renvoie un tableau quand les clés sont 0..n-1 */
    if (v && typeof v === "object"){
      var keys = Object.keys(v), isArr = keys.length > 0 && keys.every(function(k, i){ return String(i) === k; });
      var out = isArr ? [] : {};
      keys.forEach(function(k){ out[k] = arrayify(v[k]); });
      return out;
    }
    return v;
  }
  function snap(path, key){
    var v = arrayify(getAt(path));
    return { key: key !== undefined ? key : (segs(path).slice(-1)[0] || null), val:function(){ return v; }, exists:function(){ return v !== null; } };
  }
  function notify(){
    listeners.slice().forEach(function(l){
      if (l.ev === "value"){
        var s = snap(l.path);
        var j = JSON.stringify(s.val());
        if (l.last !== j){ l.last = j; l.cb(s); }
      } else if (l.ev === "child_added"){
        var v = getAt(l.path) || {};
        Object.keys(v).forEach(function(k){ if (!l.seen[k]){ l.seen[k] = true; l.cb(snap(l.path + "/" + k, k)); } });
      }
    });
  }
  var pushCounter = 0;
  function pushId(){ pushCounter++; return "-" + Date.now().toString(36) + ("000" + pushCounter).slice(-4); }

  function Ref(path){ this.path = segs(path).join("/"); this.key = segs(path).slice(-1)[0] || null; }
  Ref.prototype.child = function(p){ return new Ref(this.path + "/" + p); };
  Ref.prototype.toString = function(){ return "mock://" + this.path; };
  Ref.prototype.on = function(ev, cb){
    var l = { path:this.path, ev:ev, cb:cb, seen:{}, last:undefined };
    listeners.push(l);
    var self = this;
    setTimeout(function(){
      if (listeners.indexOf(l) === -1) return;
      if (ev === "value"){ var s = snap(self.path); l.last = JSON.stringify(s.val()); cb(s); }
      else if (ev === "child_added"){ var v = getAt(self.path) || {}; Object.keys(v).forEach(function(k){ l.seen[k] = true; cb(snap(self.path + "/" + k, k)); }); }
    }, 0);
    return cb;
  };
  Ref.prototype.off = function(ev, cb){ listeners = listeners.filter(function(l){ return !(l.path === this.path && l.ev === ev && (!cb || l.cb === cb)); }, this); };
  Ref.prototype.once = function(){ var self = this; return new Promise(function(res){ setTimeout(function(){ res(snap(self.path)); }, 0); }); };
  Ref.prototype.set = function(v){ var self = this; return new Promise(function(res){ setTimeout(function(){ setAt(self.path, v); notify(); res(); }, 0); }); };
  Ref.prototype.update = function(obj){
    var self = this;
    return new Promise(function(res){ setTimeout(function(){
      Object.keys(obj).forEach(function(k){ setAt(self.path + "/" + k, obj[k]); });
      notify(); res();
    }, 0); });
  };
  Ref.prototype.remove = function(){ return this.set(null); };
  Ref.prototype.push = function(v){
    var ref = this.child(pushId());
    var p = v === undefined ? Promise.resolve() : ref.set(v);
    ref.then = function(a, b){ return p.then(function(){ return ref; }).then(a, b); };
    ref.catch = function(b){ return p.catch(b); };
    return ref;
  };
  Ref.prototype.transaction = function(fn){
    var self = this;
    return new Promise(function(res){ setTimeout(function(){
      var cur = arrayify(getAt(self.path));
      var next = fn(cur === null ? null : clone(cur));
      if (next === undefined) return res({ committed:false, snapshot:snap(self.path) });
      setAt(self.path, next); notify();
      res({ committed:true, snapshot:snap(self.path) });
    }, 0); });
  };
  Ref.prototype.onDisconnect = function(){
    var self = this;
    var od = global.MOCK_ONDISCONNECT = global.MOCK_ONDISCONNECT || {};
    return {
      update:function(v){ od[self.path] = v; return Promise.resolve(); },
      set:function(v){ od[self.path] = v; return Promise.resolve(); },
      cancel:function(){ delete od[self.path]; return Promise.resolve(); }
    };
  };

  var infoRef = {
    connected:{ on:function(ev, cb){ setTimeout(function(){ cb({ val:function(){ return true; } }); }, 0); }, off:function(){} },
    offset:{ on:function(ev, cb){ setTimeout(function(){ cb({ val:function(){ return 0; } }); }, 0); }, off:function(){} }
  };
  function database(){
    return { ref:function(path){
      if (path === ".info/connected") return infoRef.connected;
      if (path === ".info/serverTimeOffset") return infoRef.offset;
      return new Ref(path || "");
    } };
  }
  database.ServerValue = { TIMESTAMP:{ ".sv":"timestamp" } };

  var user = null, authCbs = [];
  function auth(){
    return {
      get currentUser(){ return user; },
      onAuthStateChanged:function(cb){ authCbs.push(cb); setTimeout(function(){ cb(user); }, 0); return function(){ authCbs = authCbs.filter(function(c){ return c !== cb; }); }; },
      signInAnonymously:function(){ user = { uid:uid, isAnonymous:true }; authCbs.forEach(function(cb){ setTimeout(function(){ cb(user); }, 0); }); return Promise.resolve({ user:user }); }
    };
  }

  global.firebase = { initializeApp:function(){}, database:database, auth:auth, __mock:true };
  /* Simule la déconnexion d'un client : applique ses onDisconnect */
  global.MOCK_DISCONNECT = function(){
    var od = global.MOCK_ONDISCONNECT || {};
    Object.keys(od).forEach(function(p){ Object.keys(od[p]).forEach(function(k){ setAt(p + "/" + k, od[p][k]); }); });
    notify();
  };
  /* Injection d'une action « distante » d'un autre joueur */
  global.MOCK_ACTION = function(code, action){ setAt("rooms/" + code + "/actions/" + pushId(), action); notify(); };
  global.MOCK_MEMBER = function(code, id, rec){ setAt("rooms/" + code + "/members/" + id, rec); notify(); };
})(window);
