(function () {
  "use strict";

  const CFG = window.SUPABASE_CONFIG || null;
  const CODE_KEY = "uibe-ct-code-v1";
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

  function loadSavedCode() {
    try {
      return localStorage.getItem(CODE_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function saveCode(code) {
    try {
      localStorage.setItem(CODE_KEY, code);
    } catch (e) {
      // 忽略保存失败，仍然放行本次
    }
  }

  function clearSavedCode() {
    try {
      localStorage.removeItem(CODE_KEY);
    } catch (e) {
      // ignore
    }
  }

  function canonicalCode(value) {
    let t = String(value || "").trim().toUpperCase().replace(/[\s-]+/g, "");
    if (t.indexOf("CT") === 0) t = t.slice(2);
    if (/^[A-Z0-9]{12}$/.test(t)) {
      return "CT-" + t.slice(0, 4) + "-" + t.slice(4, 8) + "-" + t.slice(8, 12);
    }
    return "";
  }

  function showMsg(text, isError) {
    const msg = document.getElementById("gateMsg");
    if (!msg) return;
    msg.textContent = text || "";
    msg.style.color = isError === false ? "#2f9e6e" : "#c24141";
  }

  function unlock() {
    document.documentElement.classList.add("unlocked");
    const input = document.getElementById("gateInput");
    if (input) input.value = "";
  }

  async function callVerify(code, deviceId) {
    if (!CFG || !CFG.url || !CFG.anonKey) {
      throw new Error("网站后端配置尚未完成，请联系维护者。");
    }
    const res = await fetch(CFG.url.replace(/\/+$/, "") + "/rest/v1/rpc/verify_code", {
      method: "POST",
      headers: {
        "apikey": CFG.anonKey,
        "Authorization": "Bearer " + CFG.anonKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ p_code: code, p_device: deviceId })
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error("服务器返回异常（" + res.status + "），请稍后再试。");
    }
    return text ? JSON.parse(text) : { ok: false, reason: "invalid" };
  }

  async function tryActivate(value, silent) {
    const code = canonicalCode(value);
    if (!code) {
      if (!silent) showMsg("激活码格式不正确，请检查后重试。");
      return false;
    }

    let data;
    try {
      data = await callVerify(code, getDeviceId());
    } catch (e) {
      if (!silent) showMsg(e.message || "暂时无法连接服务器，请稍后再试。");
      return false;
    }

    if (data && data.ok) {
      saveCode(code);
      unlock();
      if (!silent) showMsg("验证成功，欢迎使用！", false);
      return true;
    }

    const reason = (data && data.reason) || "invalid";
    const messages = {
      invalid: "激活码不正确，请检查后重试。",
      expired: "该激活码已过期，请联系发放人。",
      revoked: "该激活码已被停用，请联系发放人。",
      used: "该激活码已绑定其他设备，如需更换请联系发放人。",
      device: "设备标识异常，请清除浏览器数据后重试。"
    };
    if (!silent) showMsg(messages[reason] || "激活码不可用，请联系发放人。");
    return false;
  }

  async function tryAutoUnlock() {
    const saved = loadSavedCode();
    if (!saved) return;
    const ok = await tryActivate(saved, true);
    if (!ok) clearSavedCode();
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
