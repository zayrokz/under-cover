/* Persistance locale (localStorage), tolérante aux navigateurs qui la bloquent. */
(function(global){
  "use strict";
  var PREFIX = "undercover.";
  function get(key, fallback){
    try {
      var raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch(e){ return fallback; }
  }
  function set(key, value){
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; }
    catch(e){ return false; }
  }
  function remove(key){
    try { localStorage.removeItem(PREFIX + key); } catch(e){}
  }
  global.Store = { get:get, set:set, remove:remove };
})(window);
