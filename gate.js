// 激活码门禁已取消：保留此文件只为兼容浏览器可能缓存的旧版页面。
(function () {
  "use strict";
  document.documentElement.classList.add("unlocked");
  document.addEventListener("DOMContentLoaded", function () {
    var overlay = document.getElementById("gateOverlay");
    if (overlay) overlay.remove();
  });
})();
