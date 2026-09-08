(function () {
  "use strict";

  const RECORDS = window.ACTIVATION_CODES || {};
  const ACT_KEY = "uibe-ct-activations-v1";
  const DEV_KEY = "uibe-ct-device-v1";

  function getDeviceId() {
    try {
      let id = localStorage.getItem(DEV_KEY);
      if (!id) {
        id = "dev-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(DEV_KEY, id);
      }
      return id;
    } catch (e) {
      return "memory-" + Math.random().toString(36).slice(2, 10);
    }
  }

  function loadActivations() {
    try {
      const raw = localStorage.getItem(ACT_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveActivation(codeId, deviceId) {
    const acts = loadActivations();
    acts[codeId] = { device: deviceId, at: new Date().toISOString() };
    try {
      localStorage.setItem(ACT_KEY, JSON.stringify(acts));
      return true;
    } catch (e) {
      return false;
    }
  }

  function isExpired(record) {
    return !!(record.expiresAt && Date.now() > new Date(record.expiresAt).getTime());
  }

  async function sha256Hex(text) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error("当前环境不支持安全哈希，请在 HTTPS 页面中使用。");
    }
    const data = new TextEncoder().encode(text);
    const buf = await window.crypto.subtle.digest("SHA-256", data);
    return Array.prototype.map
      .call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, "0"); })
      .join("");
  }

  function canonicalCode(value) {
    let t = String(value || "").trim().toUpperCase().replace(/[\s-]+/g, "");
    if (t.indexOf("CT") === 0) t = t.slice(2);
    if (/^[A-Z0-9]{12}$/.test(t)) {
      return "CT-" + t.slice(0, 4) + "-" + t.slice(4, 8) + "-" + t.slice(8, 12);
    }
    return t;
  }

  function findRecordByHash(hash) {
    const ids = Object.keys(RECORDS);
    for (let i = 0; i < ids.length; i++) {
      if (RECORDS[ids[i]].hash === hash) return ids[i];
    }
    return null;
  }

  function unlock() {
    document.documentElement.classList.add("unlocked");
    const input = document.getElementById("gateInput");
    if (input) input.value = "";
  }

  function showMsg(text, isError) {
    const msg = document.getElementById("gateMsg");
    if (!msg) return;
    msg.textContent = text || "";
    msg.style.color = isError === false ? "#2f9e6e" : "#c24141";
  }

  async function tryActivate(value, silent) {
    if (!value) {
      if (!silent) showMsg("请输入激活码。");
      return false;
    }
    let hash = "";
    try {
      hash = await sha256Hex(canonicalCode(value));
    } catch (e) {
      if (!silent) showMsg(e.message);
      return false;
    }
    const codeId = findRecordByHash(hash);
    if (!codeId) {
      if (!silent) showMsg("激活码不正确，请检查后重试。");
      return false;
    }
    const record = RECORDS[codeId];
    if (isExpired(record)) {
      if (!silent) showMsg("该激活码已过期，请联系发放人。");
      return false;
    }

    const acts = loadActivations();
    const deviceId = getDeviceId();
    const existing = acts[codeId];
    if (existing && existing.device !== deviceId) {
      if (!silent) showMsg("该激活码已绑定其他设备，如需更换请联系发放人。");
      return false;
    }
    saveActivation(codeId, deviceId);
    unlock();
    if (!silent) showMsg("验证成功，欢迎使用！", false);
    return true;
  }

  async function tryAutoUnlock() {
    const acts = loadActivations();
    const deviceId = getDeviceId();
    const ids = Object.keys(acts);
    for (let i = 0; i < ids.length; i++) {
      const record = RECORDS[ids[i]];
      if (!record) continue;
      if (isExpired(record)) continue;
      if (acts[ids[i]].device === deviceId) {
        unlock();
        return;
      }
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("gateInput");
    const btn = document.getElementById("gateBtn");
    if (!input || !btn) return;

    tryAutoUnlock();

    btn.addEventListener("click", function () {
      btn.disabled = true;
      tryActivate(input.value, false).finally(function () {
        btn.disabled = false;
        input.focus();
      });
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        btn.click();
      }
    });
  });
})();
