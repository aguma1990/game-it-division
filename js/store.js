// Penyimpanan lokal (localStorage) dengan penanganan error.
const KEY = 'nekobank-it-save-v1';

export function saveNow(json) { try { localStorage.setItem(KEY, json); return true; } catch { return false; } }
export function loadSave() { try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch { return null; } }
export function hasSave() { try { const o = loadSave(); return !!(o && o.v && o.employees); } catch { return false; } }
export function clearSave() { try { localStorage.removeItem(KEY); } catch { /* abaikan */ } }
