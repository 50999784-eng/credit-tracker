(function () {
  "use strict";

  const courses = window.COURSES || [];
  const KEY = "uibe-credit-state-v2";
  const ACTIVE = ["已修", "在读"];

  const BLOCK_REQ = {
    main: [
      { name: "核心通识课程", req: 4 },
      { name: "美育", req: 2 },
      { name: "选修通识课程", req: 8 },
      { name: "新生研讨课", req: 1 },
      { name: "政治理论与思想品德", req: 19 },
      { name: "体育与健康", req: 4 },
      { name: "数学（C类）", req: 4 },
      { name: "信息技术基础", req: 4 },
      { name: "经管法基础", req: 6 },
      { name: "职业发展与创新创业", req: 2 },
      { name: "学科基础必修课", req: 52 },
      { name: "学科基础选修课", req: 34 },
      { name: "专业方向必修课", req: 12 }
    ],
    practice: [
      { name: "实验课", req: 10 },
      { name: "劳动教育", req: 2 },
      { name: "毕业论文", req: 6 },
      { name: "其他实践", req: 10 }
    ],
    law: [
      { name: "法学表1", req: 32 },
      { name: "法学表2", req: 9 }
    ]
  };

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function courseKey(c) {
    return [c.system, c.block, c.code, c.name].join("||");
  }

  function defaultState() {
    const s = {};
    courses.forEach(function (c) {
      s[courseKey(c)] = c.status || "未修";
    });
    return s;
  }

  function loadState() {
    const saved = {};
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) Object.assign(saved, JSON.parse(raw));
    } catch (e) {
      saved.__memoryOnly = true;
    }
    const base = defaultState();
    Object.keys(saved).forEach(function (k) {
      if (base[k] !== undefined && ["未修", "在读", "已修"].indexOf(saved[k]) >= 0) {
        base[k] = saved[k];
      }
    });
    return base;
  }

  let state = loadState();
  let memoryOnly = !!state.__memoryOnly;
  delete state.__memoryOnly;

  function saveState() {
    if (memoryOnly) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      memoryOnly = true;
    }
  }

  function statusOf(c) {
    return state[courseKey(c)] || "未修";
  }

  function isEarned(c) {
    return ACTIVE.indexOf(statusOf(c)) >= 0;
  }

  function coursesIn(system) {
    return courses.filter(function (c) { return c.system === system; });
  }

  function blockStats(system, blockName) {
    let earned = 0;
    coursesIn(system).forEach(function (c) {
      if (c.block === blockName && isEarned(c)) earned += c.credit;
    });
    return earned;
  }

  function totalEarned(system, excludeBlock) {
    let earned = 0;
    coursesIn(system).forEach(function (c) {
      if (c.block === excludeBlock) return;
      if (isEarned(c)) earned += c.credit;
    });
    return earned;
  }

  function renderSummary(containerId, system) {
    const blocks = BLOCK_REQ[system];
    const rows = blocks.map(function (b) {
      const earned = blockStats(system, b.name);
      const remain = Math.max(0, b.req - earned);
      const pct = b.req === 0 ? 0 : Math.min(100, Math.round((earned / b.req) * 100));
      return { name: b.name, req: b.req, earned: earned, remain: remain, pct: pct };
    });

    let totalEarnedVal = 0;
    let totalRemain = 0;
    rows.forEach(function (r) {
      totalEarnedVal += r.earned;
      totalRemain += r.remain;
    });

    const label = system === "main" ? "主修课程" : system === "practice" ? "实践教学" : "法学双学位";
    let html = '<table class="summary" aria-label="' + esc(label) + '板块统计">';
    html += "<thead><tr><th>板块</th><th class='num'>要求</th><th class='num'>已修/在读</th><th class='num'>还差</th><th>完成度</th></tr></thead><tbody>";
    rows.forEach(function (r) {
      html += "<tr>";
      html += "<td>" + esc(r.name) + "</td>";
      html += "<td class='num'>" + r.req + "</td>";
      html += "<td class='num'>" + r.earned + "</td>";
      html += "<td class='num " + (r.remain === 0 ? "ok" : "remain") + "'>" + r.remain + "</td>";
      html += "<td><div class='progress' role='progressbar' aria-valuenow='" + r.pct + "' aria-valuemin='0' aria-valuemax='100'>";
      html += "<i" + (r.earned > r.req ? " class='over'" : "") + " style='width:" + r.pct + "%'></i></div></td>";
      html += "</tr>";
    });
    html += "<tr class='total'><td>" + (system === "law" ? "双学位课程合计" : "合计") + "</td>";
    html += "<td class='num'>" + (system === "law" ? 41 : system === "main" ? 152 : 28) + "</td>";
    html += "<td class='num'>" + totalEarnedVal + "</td><td class='num'>" + totalRemain + "</td><td></td></tr>";
    html += "</tbody></table>";

    if (system === "law") {
      const thesisEarned = blockStats("law", "学位论文");
      const thesisRemain = Math.max(0, 6 - thesisEarned);
      html += '<table class="summary" aria-label="法学学位论文">';
      html += "<thead><tr><th>项目</th><th class='num'>要求</th><th class='num'>已修/在读</th><th class='num'>还差</th><th></th></tr></thead>";
      html += "<tbody><tr><td>学位论文</td><td class='num'>6</td><td class='num'>" + thesisEarned + "</td>";
      html += "<td class='num " + (thesisRemain === 0 ? "ok" : "remain") + "'>" + thesisRemain + "</td><td></td></tr></tbody></table>";
    }
    document.getElementById(containerId).innerHTML = html;
    return totalRemain;
  }

  function renderCards() {
    const mainRemain = renderSummary("mainSummary", "main");
    const practiceRemain = renderSummary("practiceSummary", "practice");
    const lawRemain = renderSummary("lawSummary", "law");
    const mainEarned = totalEarned("main");
    const practiceEarned = totalEarned("practice");
    const lawEarned = totalEarned("law", "学位论文");
    const thesisEarned = blockStats("law", "学位论文");

    document.getElementById("mainEarned").textContent = mainEarned;
    document.getElementById("mainFoot").textContent = "分板块还需 " + mainRemain + " 分";
    document.getElementById("practiceEarned").textContent = practiceEarned;
    document.getElementById("practiceFoot").textContent = "还需 " + practiceRemain + " 分";
    document.getElementById("lawEarned").textContent = lawEarned;
    document.getElementById("lawFoot").textContent = "学位论文 " + thesisEarned + " / 6 分";

    const hint = document.getElementById("saveHint");
    if (memoryOnly) {
      hint.textContent = "当前浏览器未开启自动保存，选择只在本次浏览内生效";
    } else {
      hint.textContent = "选择已自动保存到本机";
    }
  }

  function courseItem(c) {
    const st = statusOf(c);
    const metaParts = [c.type, c.code, c.semester].filter(Boolean);
    if (c.note) metaParts.push(c.note);
    let html = '<div class="course-item">';
    html += '<div class="course-main"><div class="course-name">' + esc(c.name) + "</div>";
    html += '<div class="course-meta">' + esc(metaParts.join(" · ")) + "</div></div>";
    html += '<span class="course-credit">' + c.credit + " 分</span>";
    html += '<div class="seg" role="group" aria-label="' + esc(c.name) + ' 状态">';
    ["未修", "在读", "已修"].forEach(function (opt) {
      html += '<button type="button" class="st-' + (opt === "未修" ? "not" : opt === "在读" ? "doing" : "done") +
        '" data-key="' + esc(courseKey(c)) + '" data-status="' + opt + '" aria-pressed="' + (st === opt) + '">' + opt + "</button>";
    });
    html += "</div></div>";
    return html;
  }

  let query = "";
  const openBlocks = new Set();

  function searchMatches(c, q) {
    if (!q) return true;
    const hay = [c.name, c.code, c.block, c.type, c.semester, c.note].join(" ").toLowerCase();
    return q.split(/\s+/).every(function (part) { return hay.indexOf(part) >= 0; });
  }

  function renderCourses(system, containerId) {
    const blocks = BLOCK_REQ[system] || [];
    const list = coursesIn(system);
    const htmlParts = [];
    let matched = 0;
    const renderedBlocks = {};

    blocks.forEach(function (b) {
      let items = list.filter(function (c) { return c.block === b.name && searchMatches(c, query); });
      if (!items.length) return;
      renderedBlocks[b.name] = true;
      matched += items.length;
      const earned = blockStats(system, b.name);
      const remain = Math.max(0, b.req - earned);
      const statusText = remain === 0
        ? '<span class="block-done">已完成 ' + earned + "/" + b.req + " 分</span>"
        : '<span class="block-missing">还差 ' + remain + " 分</span>";
      const key = system + "|" + b.name;
      const open = openBlocks.has(key);
      htmlParts.push('<details class="block" data-blockkey="' + esc(key) + '"' + (open ? " open" : "") + ">");
      htmlParts.push('<summary class="block-title">' + esc(b.name) + ' <span class="mini">' + earned + " / " + b.req + " 分 · " + statusText + "</span></summary>");
      items.forEach(function (c) { htmlParts.push(courseItem(c)); });
      htmlParts.push("</details>");
    });

    list.forEach(function (c) {
      if (!renderedBlocks[c.block] && searchMatches(c, query)) {
        matched += 1;
        const key = system + "|" + c.block;
        htmlParts.push('<details class="block" data-blockkey="' + esc(key) + '" open>');
        htmlParts.push('<summary class="block-title">' + esc(c.block) + "</summary>");
        htmlParts.push(courseItem(c));
        htmlParts.push("</details>");
      }
    });

    if (!matched) {
      htmlParts.push('<p class="no-result">没有找到匹配的课程。</p>');
    }
    document.getElementById(containerId).innerHTML = htmlParts.join("");
    return matched;
  }

  function rerenderAllCourses() {
    const total = renderCourses("main", "mainCourses") +
      renderCourses("practice", "practiceCourses") +
      renderCourses("law", "lawCourses");
    const counter = document.getElementById("searchCount");
    if (counter) {
      counter.textContent = query ? "找到 " + total + " 门课程" : "共 " + courses.length + " 门课程";
    }
  }

  function setStatusByKey(key, status) {
    const target = courses.filter(function (c) { return courseKey(c) === key; })[0];
    if (!target) return;
    courses.forEach(function (c) {
      if (courseKey(c) === key || (c.code === "ENG847" && target.code === "ENG847")) {
        state[courseKey(c)] = status;
      }
    });
    saveState();
    renderCards();
    rerenderAllCourses();
  }

  function resetAll() {
    state = defaultState();
    saveState();
    openBlocks.clear();
    query = "";
    const input = document.getElementById("searchInput");
    if (input) input.value = "";
    renderCards();
    rerenderAllCourses();
  }

  function toggleAllBlocks(forceOpen) {
    const details = Array.prototype.slice.call(document.querySelectorAll("details.block"));
    details.forEach(function (d) {
      const key = d.getAttribute("data-blockkey");
      if (!key) return;
      d.open = forceOpen;
      if (forceOpen) openBlocks.add(key); else openBlocks.delete(key);
    });
  }

  const tabs = Array.prototype.slice.call(document.querySelectorAll("[role='tab']"));
  function switchTab(id) {
    tabs.forEach(function (tab) {
      const on = tab.id === id;
      tab.classList.toggle("active", on);
      tab.setAttribute("aria-selected", String(on));
      const panel = document.getElementById(tab.getAttribute("aria-controls"));
      panel.hidden = !on;
    });
  }
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () { switchTab(tab.id); });
  });

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      query = searchInput.value.trim().toLowerCase();
      rerenderAllCourses();
    });
  }
  const openAllBtn = document.getElementById("openAllBtn");
  if (openAllBtn) {
    openAllBtn.addEventListener("click", function () { toggleAllBlocks(true); });
  }
  const closeAllBtn = document.getElementById("closeAllBtn");
  if (closeAllBtn) {
    closeAllBtn.addEventListener("click", function () { toggleAllBlocks(false); });
  }

  document.addEventListener("toggle", function (e) {
    if (e.target && e.target.classList && e.target.classList.contains("block")) {
      const key = e.target.getAttribute("data-blockkey");
      if (key) {
        if (e.target.open) openBlocks.add(key); else openBlocks.delete(key);
      }
    }
  }, true);

  document.addEventListener("click", function (e) {
    const btn = e.target.closest ? e.target.closest("button[data-key]") : null;
    if (btn) {
      setStatusByKey(btn.getAttribute("data-key"), btn.getAttribute("data-status"));
      return;
    }
    if (e.target.id === "resetBtn") resetAll();
  });

  rerenderAllCourses();
  renderCards();
})();
