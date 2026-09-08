(function () {
  "use strict";

  const CONFIG = window.UIBE_PLANS;
  const DATA = window.V2DATA || {};
  const ACTIVE = ["已修", "在读"];

  const state = {
    year: "",
    channel: "",
    doubleId: "",
    mainId: "",
    secondType: "none",
    secondId: "",
    statuses: {},
    planKey: ""
  };
  let liveReq = null;
  const openBlocks = new Set();
  let blockInitialized = false;

  function $id(id) { return document.getElementById(id); }

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function planKeyOf() {
    const s = state;
    const parts = [s.year, s.channel, s.doubleId || "-", s.mainId || "-", s.secondType, s.secondId || "-"];
    return parts.join("|");
  }

  function statusKey(course) {
    return [course.block, course.code, course.name, course.credit, course.semester || ""].join("||");
  }

  function loadStatuses() {
    if (!state.planKey) return {};
    try {
      const raw = localStorage.getItem("v2-stat-" + state.planKey);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function saveStatuses() {
    if (!state.planKey) return;
    try {
      localStorage.setItem("v2-stat-" + state.planKey, JSON.stringify(state.statuses));
    } catch (e) { /* ignore */ }
  }

  function getYearData() {
    return DATA.years && DATA.years[state.year];
  }

  function selectedMainId() {
    return state.mainId || state.doubleId;
  }

  function getMainCourses() {
    const y = getYearData();
    if (!y || state.channel !== "normal" || !state.mainId) return [];
    return (y.majors && y.majors[state.mainId]) || [];
  }

  function getSecondProgram() {
    const y = getYearData();
    if (!y || state.secondType === "none" || !state.secondId) return null;
    const cat = y.second && y.second[state.secondType === "minor" ? "minor" : "dual"];
    if (!cat) return null;
    return cat.find(function (p) { return validProgram(p) && p.title === state.secondId; }) || null;
  }

  function validProgram(p) {
    const t = p.title || "";
    if (!t || t.length > 40) return false;
    if (t.indexOf("课程代码") >= 0 || t.indexOf("选修说明") >= 0 || t.indexOf("学位论文：") >= 0) return false;
    return true;
  }

  function assembleCourses() {
    const y = getYearData();
    if (!y) return [];
    const rows = [];
    const practiceMap = { "实验课": "exp", "劳动教育": "labor", "毕业论文": "thesis", "其他实践": "other" };
    const isDouble = state.channel === "double";
    const needsMathB = isDouble && (state.doubleId === "finance" || state.doubleId === "accounting");
    const commonRows = (y.common || []).filter(function (c) {
      return !(needsMathB && c.block === "math");
    });
    commonRows.forEach(function (c) {
      rows.push({ group: "主修课程", blockName: c.blockName || "通识课程", block: "common:" + c.block, c: c });
    });
    if (needsMathB) {
      (y.mathB || []).forEach(function (c) {
        rows.push({ group: "主修课程", blockName: "数学（B类）", block: "common:math", c: c });
      });
    }
    (y.practice || []).forEach(function (c) {
      const key = practiceMap[c.block] || "other";
      rows.push({ group: "主修实践", blockName: c.block, block: "practice:" + key, c: c });
    });
    if (state.channel === "normal") {
      const prof = CONFIG.majorProfessional[state.mainId] || [];
      const profMap = {};
      prof.forEach(function (b) { profMap[b.key] = b; });
      getMainCourses().forEach(function (c) {
        const b = profMap[c.block];
        rows.push({
          group: "主修专业课程",
          blockName: b ? b.label : c.block,
          block: "major:" + c.block,
          c: c
        });
      });
    } else if (state.channel === "double") {
      const prog = y.double && y.double[state.doubleId];
      if (prog) {
        prog.forEach(function (c) {
          const isBase = c.block === "majorReq";
          rows.push({
            group: "双学士学位项目",
            blockName: isBase ? "专业必修课（学科基础必修）" : "专业选修 / 方向课程目录",
            block: isBase ? "double:req" : "double:opt",
            c: c
          });
        });
      }
    }
    const prog = getSecondProgram();
    if (prog) {
      (prog.rows || []).forEach(function (c) {
        const isDualSecond = state.secondType === "dual";
        rows.push({
          group: state.secondType === "minor" ? "辅修专业" : "辅修双学位",
          blockName: isDualSecond ? "课程目录（论文已计入毕业要求）" : "课程目录",
          block: "second:req",
          c: c
        });
      });
    }
    return rows;
  }

  function selectedStatus(course) {
    return state.statuses[statusKey(course)] || "未修";
  }

  function setStatus(course, status) {
    const key = statusKey(course);
    if (status === "未修") delete state.statuses[key];
    else state.statuses[key] = status;
    saveStatuses();
    renderAll();
  }

  function blockRequirement() {
    const req = {};
    const isDouble = state.channel === "double";
    function addBlock(key, label, need, group) {
      req[key] = { label: label, need: need, have: 0, selected: 0, group: group };
    }
    if (!isDouble) {
      (CONFIG.commonBlocks || []).forEach(function (b) {
        addBlock("common:" + b.key, b.label, b.req, "主修课程");
      });
      (CONFIG.practiceBlocks || []).forEach(function (b) {
        addBlock("practice:" + b.key, b.label, b.req, "主修实践");
      });
    } else {
      const dcommon = CONFIG.doubleCommon[state.doubleId] || {};
      (CONFIG.commonBlocks || []).forEach(function (b) {
        const need = (dcommon[b.key] != null ? dcommon[b.key] : b.req);
        let label = b.label;
        if (state.doubleId !== "law" && b.key === "math") label = "数学（B类）";
        addBlock("common:" + b.key, label, need, "主修课程");
      });
      (CONFIG.practiceBlocks || []).forEach(function (b) {
        addBlock("practice:" + b.key, b.label, b.req, "主修实践");
      });
    }
    if (state.channel === "normal") {
      (CONFIG.majorProfessional[state.mainId] || []).forEach(function (b) {
        addBlock("major:" + b.key, b.label, b.req, "主修课程");
      });
    }
    if (isDouble) {
      const y = CONFIG.years[state.year];
      const dreq = y && y.doubleReq && y.doubleReq[state.doubleId];
      addBlock("double:req", "双学士专业必修课（学科基础必修）", (dreq && dreq.base) || 0, "双学士学位");
      addBlock("double:opt", "双学士专业选修 / 方向课程", (dreq && dreq.other) || 0, "双学士学位");
    }
    const prog = getSecondProgram();
    if (prog && prog.creditNote) {
      const m = prog.creditNote.match(/不少于\s*(\d+)\s*学分/) || prog.creditNote.match(/(\d+)\s*学分/);
      const need = m ? parseInt(m[1], 10) : 0;
      const group = state.secondType === "minor" ? "辅修专业" : "辅修双学位";
      addBlock("second:req", "第二专业毕业要求（论文已计入）", need, group);
    }
    return req;
  }

  function updateSummaryNumbers() {
    const rows = assembleCourses();
    const req = blockRequirement();
    rows.forEach(function (r) {
      const b = req[r.block];
      if (!b) return;
      if (ACTIVE.indexOf(selectedStatus(r.c)) >= 0) b.have += Number(r.c.credit);
    });
    liveReq = req;
  }

  function renderCards() {
    const el = $id("cards");
    const req = liveReq || blockRequirement();
    const groupOrder = ["主修课程", "主修实践", "辅修专业", "辅修双学位", "双学士学位"];
    const sums = {};
    Object.keys(req).forEach(function (k) {
      const b = req[k];
      if (!sums[b.group]) sums[b.group] = { need: 0, have: 0 };
      sums[b.group].need += b.need;
      sums[b.group].have += b.have;
    });
    const groups = groupOrder.filter(function (g) { return sums[g]; });
    const html = groups.map(function (g) {
      return "<div class='card'><div class='label'>" + esc(g) + "</div><div class='value'>" + sums[g].have +
        "<small> / " + sums[g].need + " 分</small></div></div>";
    }).join("");
    el.innerHTML = html;
  }

  function renderSummary() {
    const req = liveReq || blockRequirement();
    const groupOrder = ["主修课程", "主修实践", "辅修专业", "辅修双学位", "双学士学位"];
    const sortedKeys = Object.keys(req).sort(function (a, b) {
      const ga = groupOrder.indexOf(req[a].group);
      const gb = groupOrder.indexOf(req[b].group);
      return (ga < 0 ? 99 : ga) - (gb < 0 ? 99 : gb);
    });
    let lastGroup = "";
    const rows = sortedKeys.map(function (k) {
      const b = req[k];
      let groupRow = "";
      if (b.group !== lastGroup) {
        groupRow = "<tr class='group-head'><th colspan='4'>" + esc(b.group) + "</th></tr>";
        lastGroup = b.group;
      }
      const remain = Math.max(0, b.need - b.have);
      const cls = remain === 0 ? "ok" : "";
      return groupRow + "<tr><td>" + esc(b.label) + "</td><td class='num'>" + b.need +
        "</td><td class='num'>" + b.have + "</td><td class='num " + cls + "'>" + remain + "</td></tr>";
    }).join("");
    let note = "";
    if (state.channel === "double") {
      const y = CONFIG.years[state.year];
      const dreq = y && y.doubleReq && y.doubleReq[state.doubleId];
      if (dreq) {
        note = "<tr class='note-row'><td colspan='4'>方案口径：上方主修课程 = 本项目通识通修 " + dreq.ge +
          " 分；双学士专业课程 " + dreq.pro + " 分 + 主修实践 " + dreq.practice +
          " 分，毕业总要求 " + dreq.total + " 分。</td></tr>";
      }
    }
    $id("summaryTable").innerHTML = "<tr><th>板块</th><th>要求</th><th>已修/在读</th><th>还差</th></tr>" + rows + note;
  }

  function renderBlocks(query) {
    const area = $id("courseArea");
    // 记录当前每个板块的展开/折叠状态
    Array.prototype.forEach.call(area.querySelectorAll("details.block"), function (d) {
      const key = d.getAttribute("data-bkey");
      if (!key) return;
      if (d.open) openBlocks.add(key); else openBlocks.delete(key);
      blockInitialized = true;
    });
    const rows = assembleCourses().filter(function (r) {
      if (!query) return true;
      const hay = (r.c.name + " " + r.c.code + " " + r.blockName + " " + r.group).toLowerCase();
      return hay.indexOf(query.toLowerCase()) >= 0;
    });
    const grouped = {};
    const order = [];
    rows.forEach(function (r) {
      const key = r.group + "§" + r.block;
      if (!grouped[key]) {
        grouped[key] = { group: r.group, block: r.block, blockName: r.blockName, rows: [] };
        order.push(key);
      }
      grouped[key].rows.push(r);
    });

    const req = liveReq || blockRequirement();
    order.forEach(function (key) {
      const g = grouped[key];
      const need = (req[g.block] && req[g.block].need) || 0;
      const have = (req[g.block] && req[g.block].have) || 0;
      const sum = g.rows.reduce(function (acc, r) {
        return acc + (ACTIVE.indexOf(selectedStatus(r.c)) >= 0 ? Number(r.c.credit) : 0);
      }, 0);
      g.open = true;
    });

    const html = order.map(function (key) {
      const g = grouped[key];
      const need = (req[g.block] && req[g.block].need) || 0;
      const sum = g.rows.reduce(function (acc, r) {
        return acc + (ACTIVE.indexOf(selectedStatus(r.c)) >= 0 ? Number(r.c.credit) : 0);
      }, 0);
      const items = g.rows.map(function (r) {
        const st = selectedStatus(r.c);
        return "<div class='course-item'>" +
          "<div class='course-name'>" + esc(r.c.name) +
          "<div class='course-meta'>" + esc(r.c.code || "") + (r.c.semester ? " · " + esc(r.c.semester) + "学期" : "") + "</div>" +
          "</div>" +
          "<span class='course-credit'>" + esc(r.c.credit) + " 分</span>" +
          "<span class='seg'>" +
            statusBtn(r, "未修", st, "not") +
            statusBtn(r, "在读", st, "doing") +
            statusBtn(r, "已修", st, "done") +
          "</span>" +
          "</div>";
      }).join("");
      const wasOpen = !blockInitialized || openBlocks.has(key);
      return "<details class='block' data-bkey='" + key + "'" + (wasOpen ? " open" : "") + "><summary><span class='block-title'>" + esc(g.group + " · " + g.blockName) +
        "<small>" + sum + " / " + need + " 分</small></span></summary>" + items + "</details>";
    }).join("");
    area.innerHTML = html || "<p class='muted'>没有匹配的课程</p>";
  }

  function statusBtn(r, text, current, cls) {
    const on = current === text;
    const stateCls = on ? " on-" + cls : "";
    return "<button type='button' class='" + stateCls + "' data-sk='" + esc(statusKey(r.c)) +
      "' data-status='" + text + "' data-block='" + esc(r.block) + "' data-rowblock='" + esc(r.block) + "'>" + text + "</button>";
  }

  function renderAll() {
    if (!state.planKey) return;
    updateSummaryNumbers();
    renderCards();
    renderSummary();
    const q = $id("searchInput") ? $id("searchInput").value.trim() : "";
    renderBlocks(q);
    const y = CONFIG.years[state.year];
    const mainLabel = y.mainTracks.find(function (t) { return t.id === state.mainId; });
    const second = getSecondProgram();
    let label = y.label + " · ";
    if (state.channel === "double") {
      const dp = y.doublePrograms.find(function (p) { return p.id === state.doubleId; });
      label += (dp ? dp.label : "双学士学位");
    } else {
      label += mainLabel ? mainLabel.label : "英语大类";
    }
    if (state.secondType !== "none" && second) label += " · " + (state.secondType === "minor" ? "辅修" : "辅修双学位") + "：" + second.title;
    $id("planLabel").textContent = label;
    $id("saveHint").textContent = "选择已自动保存到本机";
  }

  function resetStatuses() {
    state.statuses = {};
    saveStatuses();
    renderAll();
  }

  function showApp() {
    $id("wizard").hidden = true;
    $id("app").hidden = false;
    state.planKey = planKeyOf();
    state.statuses = loadStatuses();
    renderAll();
    window.scrollTo(0, 0);
  }

  function renderChoices(el, items, selectedId, labelFn) {
    el.innerHTML = items.map(function (it) {
      const sel = it.id === selectedId;
      return "<button type='button' class='choice" + (sel ? " selected" : "") + "' data-id='" + esc(it.id) + "'>" + esc(labelFn ? labelFn(it) : it.label) + "</button>";
    }).join("");
  }

  function bindClick(el, fn) {
    el.addEventListener("click", function (e) {
      const b = e.target.closest("button[data-id]");
      if (b) fn(b.getAttribute("data-id"), b);
    });
  }

  function initWizard() {
    const yearList = $id("yearList");
    bindClick(yearList, function (id) {
      state.year = id;
      state.channel = ""; state.mainId = ""; state.secondType = "none"; state.secondId = "";
      renderYearChoices();
      renderChannelChoices();
      $id("channelSection").hidden = false;
      $id("mainSection").hidden = true;
      $id("secondSection").hidden = true;
    });

    const channelList = $id("channelList");
    bindClick(channelList, function (id) {
      state.channel = id;
      state.mainId = ""; state.secondType = "none"; state.secondId = "";
      if (id === "normal") {
        renderMainChoices();
        $id("mainSection").hidden = false;
        $id("doubleSection").hidden = true;
        $id("secondSection").hidden = false;
      } else {
        $id("mainSection").hidden = true;
        $id("secondSection").hidden = true;
        renderDoubleChoices();
        $id("doubleSection").hidden = false;
      }
      $id("wizardMsg").textContent = "";
    });

    const mainList = $id("mainList");
    bindClick(mainList, function (id) {
      state.mainId = id;
      renderMainChoices();
      renderSecondTypeChoices();
    });

    const doubleList = $id("doubleList");
    bindClick(doubleList, function (id) {
      state.doubleId = id;
      renderDoubleChoices();
      showApp();
    });

    const secondTypeList = $id("secondTypeList");
    bindClick(secondTypeList, function (id) {
      state.secondType = id;
      state.secondId = "";
      renderSecondTypeChoices();
      if (id === "none") {
        $id("wizardMsg").textContent = "";
        showApp();
      } else {
        renderSecondProgramChoices();
      }
    });

    const secondProgramList = $id("secondProgramList");
    bindClick(secondProgramList, function (id) {
      state.secondId = id;
      renderSecondProgramChoices();
      $id("wizardMsg").textContent = "方案已选择，进入统计页后仍可切换。";
      showApp();
    });

    function renderYearChoices() {
      const items = Object.keys(CONFIG.years).map(function (id) { return { id: id, label: CONFIG.years[id].label }; });
      renderChoices(yearList, items, state.year);
    }
    function renderChannelChoices() {
      const items = [
        { id: "normal", label: "英语大类（普通分流）" },
        { id: "double", label: "双学士学位项目" }
      ];
      renderChoices(channelList, items, state.channel);
    }
    function renderMainChoices() {
      const items = CONFIG.years[state.year] ? CONFIG.years[state.year].mainTracks : [];
      renderChoices(mainList, items, state.mainId);
    }
    function renderSecondTypeChoices() {
      const items = [
        { id: "none", label: "不修第二专业" },
        { id: "minor", label: "辅修专业" },
        { id: "dual", label: "辅修双学位" }
      ];
      renderChoices(secondTypeList, items, state.secondType);
    }
    function renderDoubleChoices() {
      const items = CONFIG.years[state.year] ? CONFIG.years[state.year].doublePrograms.filter(function (p) { return p.enabled; }) : [];
      renderChoices(doubleList, items, state.doubleId);
    }
    function renderSecondProgramChoices() {
      const y = getYearData();
      let items = [];
      if (state.secondType !== "none" && y && y.second && y.second[state.secondType]) {
        items = y.second[state.secondType].filter(validProgram).map(function (p) { return { id: p.title, label: p.title }; });
      }
      if (state.secondType === "none") {
        secondProgramList.innerHTML = "";
        return;
      }
      renderChoices(secondProgramList, items, state.secondId);
    }

    renderYearChoices();
  }

  function initApp() {
    $id("changePlanBtn").addEventListener("click", function () {
      $id("app").hidden = true;
      $id("wizard").hidden = false;
      window.scrollTo(0, 0);
    });
    $id("searchInput").addEventListener("input", function () {
      const q = this.value.trim();
      const saved = state;
      // 直接重绘当前块
      renderBlocks(q);
      const hint = $id("saveHint"); if (hint) hint.textContent = "";
    });
    $id("openAllBtn").addEventListener("click", function () { toggleAll(true); });
    $id("closeAllBtn").addEventListener("click", function () { toggleAll(false); });
    document.addEventListener("toggle", function (e) {
      const d = e.target;
      if (!d || !d.classList || !d.classList.contains("block")) return;
      const key = d.getAttribute("data-bkey");
      if (!key) return;
      if (d.open) openBlocks.add(key); else openBlocks.delete(key);
      blockInitialized = true;
    }, true);
    $id("courseArea").addEventListener("click", function (e) {
      const btn = e.target.closest("button[data-status]");
      if (!btn) return;
      const st = btn.getAttribute("data-status");
      const sk = btn.getAttribute("data-sk");
      const rows = assembleCourses();
      const course = sk
        ? rows.find(function (r) { return statusKey(r.c) === sk; })
        : null;
      if (course) setStatus(course.c, st);
    });
  }

  function toggleAll(open) {
    const els = document.querySelectorAll("#courseArea details.block");
    Array.prototype.forEach.call(els, function (d) { d.open = open; });
  }

  window.addEventListener("DOMContentLoaded", function () {
    if (!window.V2DATA || !window.UIBE_PLANS) {
      $id("wizardMsg").textContent = "数据文件加载失败";
      return;
    }
    initWizard();
    initApp();
  });
})();
