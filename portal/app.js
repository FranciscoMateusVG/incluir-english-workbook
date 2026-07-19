const docs = [
  {
    title: "Curriculum Revamp",
    file: "CURRICULUM-REVAMP.md",
    category: "Course strategy",
    summary: "The shift from grammar coverage to survival English."
  },
  {
    title: "Current vs Next Curriculum",
    file: "CURRENT-VS-NEXT-CURRICULUM.md",
    category: "Curriculum map",
    summary: "B1–B4 anchors and the eight missionized classes."
  },
  {
    title: "Class Model",
    file: "CLASS-MODEL.md",
    category: "Class design",
    summary: "The volunteer-friendly Formula, Practice, Real Use rhythm."
  },
  {
    title: "Volunteer Teaching Guide",
    file: "VOLUNTEER-TEACHING-GUIDE.md",
    category: "Volunteer guide",
    summary: "Teaching, correction, Portuguese, and student talk."
  },
  {
    title: "Assessment Model",
    file: "ASSESSMENT-MODEL.md",
    category: "Assessment",
    summary: "Two foundation tests and one speaking mission exam."
  },
  {
    title: "AI Study Missions",
    file: "AI-STUDY-MISSIONS.md",
    category: "Independent study",
    summary: "Extra-class voice practice with offline alternatives."
  },
  {
    title: "Simple Present Prototype",
    file: "LESSON-SIMPLE-PRESENT.md",
    category: "Lesson prototype",
    summary: "A concrete lesson built around the new class model."
  }
];

const docList = document.querySelector("#docList");
const docTitle = document.querySelector("#docTitle");
const docCategory = document.querySelector("#docCategory");
const docMeta = document.querySelector("#docMeta");
const docContent = document.querySelector("#docContent");
const docDownload = document.querySelector("#docDownload");
const docToc = document.querySelector("#docToc");
const docReader = document.querySelector("#docReader");
const docStatus = document.querySelector("#docStatus");
const docSearch = document.querySelector("#docSearch");
const docEmpty = document.querySelector("#docEmpty");
const libraryCount = document.querySelector("#libraryCount");
const readerScroll = document.querySelector("#readerScroll");
const progressBar = document.querySelector(".reading-progress");
const readingProgress = document.querySelector("#readingProgress");
const focusReader = document.querySelector("#focusReader");
const continueReading = document.querySelector("#continueReading");

const STORAGE_KEYS = {
  lastDoc: "incluirEnglish.portal.lastDoc",
  positions: "incluirEnglish.portal.readingPositions"
};

let currentDoc = null;
let currentButton = null;
let loadSequence = 0;
let scrollFrame = null;
let suppressPositionSave = false;

function storageGet(key, fallback = null) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch (error) {
    return fallback;
  }
}

function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    // The portal still works when storage is disabled.
  }
}

function getReadingPositions() {
  try {
    return JSON.parse(storageGet(STORAGE_KEYS.positions, "{}"));
  } catch (error) {
    return {};
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderInline(value) {
  const codeTokens = [];
  const linkTokens = [];

  let source = String(value).replace(/`([^`\n]+)`/g, (match, code) => {
    const token = `%%CODETOKEN${codeTokens.length}%%`;
    codeTokens.push(`<code>${escapeHtml(code)}</code>`);
    return token;
  });

  source = source.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (match, label, url) => {
    const token = `%%LINKTOKEN${linkTokens.length}%%`;
    linkTokens.push(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`);
    return token;
  });

  let html = escapeHtml(source)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?])/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

  linkTokens.forEach((link, index) => {
    html = html.replace(`%%LINKTOKEN${index}%%`, link);
  });

  codeTokens.forEach((code, index) => {
    html = html.replace(`%%CODETOKEN${index}%%`, code);
  });

  return html;
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "section";
}

function renderTable(lines, startIndex) {
  const rows = [];
  let index = startIndex;

  while (index < lines.length && /^\|.+\|$/.test(lines[index].trim())) {
    rows.push(lines[index].trim().slice(1, -1).split("|").map((cell) => cell.trim()));
    index += 1;
  }

  const hasDivider = rows[1]?.every((cell) => /^:?-{3,}:?$/.test(cell));
  const header = rows[0] || [];
  const body = hasDivider ? rows.slice(2) : rows.slice(1);
  const thead = `<thead><tr>${header.map((cell) => `<th>${renderInline(cell)}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`).join("")}</tbody>`;

  return {
    html: `<div class="table-scroll" tabindex="0"><table>${thead}${tbody}</table></div>`,
    nextIndex: index
  };
}

function isBlockStart(line) {
  const trimmed = line.trim();
  return !trimmed
    || trimmed.startsWith("```")
    || /^#{1,4}\s/.test(trimmed)
    || /^\|.+\|$/.test(trimmed)
    || /^[-*]\s/.test(trimmed)
    || /^\d+\.\s/.test(trimmed)
    || /^>\s?/.test(trimmed)
    || /^(-{3,}|\*{3,})$/.test(trimmed);
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  const headings = [];
  const headingCounts = new Map();
  let index = 0;
  let listType = null;
  let inCode = false;
  let code = [];

  function closeList() {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  }

  function headingId(text) {
    const base = slugify(text.replace(/[*_`]/g, ""));
    const count = headingCounts.get(base) || 0;
    headingCounts.set(base, count + 1);
    return count ? `${base}-${count + 1}` : base;
  }

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = [];
        inCode = false;
      } else {
        closeList();
        inCode = true;
      }
      index += 1;
      continue;
    }

    if (inCode) {
      code.push(line);
      index += 1;
      continue;
    }

    if (!trimmed) {
      closeList();
      index += 1;
      continue;
    }

    if (/^\|.+\|$/.test(trimmed)) {
      closeList();
      const table = renderTable(lines, index);
      html.push(table.html);
      index = table.nextIndex;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const id = headingId(text);
      headings.push({ level, text: text.replace(/[*_`]/g, ""), id });
      html.push(`<h${level} id="${id}">${renderInline(text)}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      closeList();
      html.push("<hr>");
      index += 1;
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      closeList();
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quote.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      html.push(`<blockquote><p>${renderInline(quote.join(" "))}</p></blockquote>`);
      continue;
    }

    if (/^[-*]\s/.test(trimmed)) {
      if (listType !== "ul") {
        closeList();
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${renderInline(trimmed.replace(/^[-*]\s/, ""))}</li>`);
      index += 1;
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      if (listType !== "ol") {
        closeList();
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${renderInline(trimmed.replace(/^\d+\.\s/, ""))}</li>`);
      index += 1;
      continue;
    }

    closeList();
    const paragraph = [trimmed];
    index += 1;
    while (index < lines.length && !isBlockStart(lines[index])) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
  }

  if (inCode && code.length) {
    html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  }
  closeList();

  const wordCount = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#|*_`>\[\]()\-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return { html: html.join(""), headings, wordCount };
}

function renderToc(headings) {
  docToc.replaceChildren();
  headings
    .filter((heading) => heading.level === 2 || heading.level === 3)
    .forEach((heading) => {
      const link = document.createElement("a");
      link.className = `toc-link level-${heading.level}`;
      link.href = `#${heading.id}`;
      link.textContent = heading.text;
      link.addEventListener("click", (event) => {
        event.preventDefault();
        document.getElementById(heading.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      docToc.appendChild(link);
    });
}

function setActiveButton(button) {
  document.querySelectorAll(".doc-button").forEach((item) => {
    const active = item === button;
    item.classList.toggle("active", active);
    if (active) item.setAttribute("aria-current", "true");
    else item.removeAttribute("aria-current");
  });
  currentButton = button;
}

function saveReadingPosition() {
  if (!currentDoc || readerScroll.scrollHeight <= readerScroll.clientHeight) return;
  const positions = getReadingPositions();
  const available = readerScroll.scrollHeight - readerScroll.clientHeight;
  positions[currentDoc.file] = Math.max(0, Math.min(1, readerScroll.scrollTop / available));
  storageSet(STORAGE_KEYS.positions, JSON.stringify(positions));
}

function restoreReadingPosition(file) {
  const ratio = Number(getReadingPositions()[file] || 0);
  const available = readerScroll.scrollHeight - readerScroll.clientHeight;
  readerScroll.scrollTop = Math.max(0, Math.min(available, ratio * available));
  updateReadingProgress();
}

function updateReadingProgress() {
  const available = readerScroll.scrollHeight - readerScroll.clientHeight;
  const progress = available > 0 ? Math.round((readerScroll.scrollTop / available) * 100) : 100;
  readingProgress.style.width = `${progress}%`;
  progressBar.setAttribute("aria-valuenow", String(progress));

  const headings = [...docContent.querySelectorAll("h2[id], h3[id]")];
  let activeId = headings[0]?.id;
  headings.forEach((heading) => {
    if (heading.offsetTop <= readerScroll.scrollTop + 90) activeId = heading.id;
  });
  docToc.querySelectorAll(".toc-link").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${activeId}`);
  });
}

function handleReaderScroll() {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(() => {
    updateReadingProgress();
    if (!suppressPositionSave) saveReadingPosition();
    scrollFrame = null;
  });
}

async function loadDoc(doc, button, options = {}) {
  saveReadingPosition();
  const sequence = ++loadSequence;
  suppressPositionSave = true;

  currentDoc = doc;
  docReader.setAttribute("aria-busy", "true");
  setActiveButton(button);
  docCategory.textContent = doc.category;
  docTitle.textContent = doc.title;
  docMeta.textContent = "Loading guide…";
  docDownload.href = `assets/docs/${doc.file}`;
  docDownload.setAttribute("download", doc.file);
  docContent.innerHTML = `
    <div class="doc-loading" aria-label="Loading document">
      <span></span><span></span><span></span><span></span><span></span>
    </div>`;
  docToc.replaceChildren();
  readerScroll.scrollTop = 0;
  updateReadingProgress();

  try {
    const response = await fetch(`assets/docs/${doc.file}`);
    if (!response.ok) throw new Error(`Document returned ${response.status}`);
    const markdown = await response.text();
    if (sequence !== loadSequence) return;

    const rendered = renderMarkdown(markdown);
    const minutes = Math.max(1, Math.ceil(rendered.wordCount / 220));
    docContent.innerHTML = rendered.html;
    docReader.setAttribute("aria-busy", "false");
    docMeta.textContent = `${rendered.wordCount.toLocaleString()} words · about ${minutes} min read`;
    renderToc(rendered.headings);
    docStatus.textContent = `${doc.title} loaded.`;
    storageSet(STORAGE_KEYS.lastDoc, doc.file);
    setContinueReading(doc);

    window.requestAnimationFrame(() => {
      restoreReadingPosition(doc.file);
      if (options.focusContent) readerScroll.focus({ preventScroll: true });
      window.requestAnimationFrame(() => {
        suppressPositionSave = false;
      });
    });
  } catch (error) {
    if (sequence !== loadSequence) return;
    suppressPositionSave = false;
    docReader.setAttribute("aria-busy", "false");
    docMeta.textContent = "Guide unavailable";
    docContent.innerHTML = `
      <div class="reader-error">
        <h1>We could not open this guide.</h1>
        <p>Preview the portal through a local web server, then try again.</p>
      </div>`;
    docStatus.textContent = `${doc.title} could not be loaded.`;
  }
}

function setContinueReading(doc) {
  continueReading.hidden = false;
  continueReading.textContent = `Continue reading: ${doc.title} →`;
  continueReading.onclick = () => {
    const button = docList.querySelector(`[data-file="${doc.file}"]`);
    loadDoc(doc, button, { focusContent: true });
    document.querySelector("#guides").scrollIntoView({ behavior: "smooth" });
  };
}

function createDocButton(doc) {
  const button = document.createElement("button");
  const category = document.createElement("small");
  const title = document.createElement("strong");
  const summary = document.createElement("span");

  button.className = "doc-button";
  button.type = "button";
  button.dataset.file = doc.file;
  button.dataset.search = `${doc.title} ${doc.category} ${doc.summary}`.toLowerCase();
  category.textContent = doc.category;
  title.textContent = doc.title;
  summary.textContent = doc.summary;
  button.append(category, title, summary);
  button.addEventListener("click", () => loadDoc(doc, button, { focusContent: true }));
  return button;
}

function filterDocs() {
  const query = docSearch.value.trim().toLowerCase();
  let visible = 0;
  docList.querySelectorAll(".doc-button").forEach((button) => {
    const matches = button.dataset.search.includes(query);
    button.hidden = !matches;
    if (matches) visible += 1;
  });
  libraryCount.textContent = `${visible} ${visible === 1 ? "guide" : "guides"}`;
  docEmpty.hidden = visible > 0;
}

function toggleFocusMode(force) {
  const focused = typeof force === "boolean" ? force : !docReader.classList.contains("focused");
  const ratio = readerScroll.scrollHeight > readerScroll.clientHeight
    ? readerScroll.scrollTop / (readerScroll.scrollHeight - readerScroll.clientHeight)
    : 0;

  docReader.classList.toggle("focused", focused);
  document.body.classList.toggle("reader-is-focused", focused);
  focusReader.setAttribute("aria-pressed", String(focused));
  focusReader.textContent = focused ? "Exit focus" : "Focus view";
  if (focused) {
    docReader.setAttribute("role", "dialog");
    docReader.setAttribute("aria-modal", "true");
  } else {
    docReader.removeAttribute("role");
    docReader.removeAttribute("aria-modal");
  }

  window.requestAnimationFrame(() => {
    const available = readerScroll.scrollHeight - readerScroll.clientHeight;
    readerScroll.scrollTop = ratio * Math.max(0, available);
    updateReadingProgress();
    if (focused) readerScroll.focus({ preventScroll: true });
    else focusReader.focus({ preventScroll: true });
  });
}

docs.forEach((doc) => docList.appendChild(createDocButton(doc)));

const rememberedFile = storageGet(STORAGE_KEYS.lastDoc);
const initialDoc = docs.find((doc) => doc.file === rememberedFile) || docs[0];
const initialButton = docList.querySelector(`[data-file="${initialDoc.file}"]`);
if (rememberedFile) setContinueReading(initialDoc);
loadDoc(initialDoc, initialButton);

docSearch.addEventListener("input", filterDocs);
readerScroll.addEventListener("scroll", handleReaderScroll, { passive: true });
focusReader.addEventListener("click", () => toggleFocusMode());
window.addEventListener("beforeunload", saveReadingPosition);

document.addEventListener("keydown", (event) => {
  const target = event.target;
  const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

  if (event.key === "Tab" && docReader.classList.contains("focused")) {
    const focusable = [...docReader.querySelectorAll("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])")]
      .filter((item) => !item.hidden && item.getClientRects().length > 0);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  if (event.key === "/" && !isTyping && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    docSearch.focus();
  }

  if (event.key === "Escape" && docReader.classList.contains("focused")) {
    toggleFocusMode(false);
  }
});

const materialRows = [...document.querySelectorAll(".material-row")];
const materialCount = document.querySelector("#materialCount");
document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    let visible = 0;

    document.querySelectorAll(".filter-button").forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });

    materialRows.forEach((row) => {
      const matches = filter === "all" || row.dataset.audience === filter;
      row.hidden = !matches;
      if (matches) visible += 1;
    });

    materialCount.textContent = `Showing ${visible} ${visible === 1 ? "material" : "materials"}`;
  });
});

if ("IntersectionObserver" in window) {
  const navLinks = [...document.querySelectorAll(".section-nav a")];
  const sections = ["guides", "materials", "levels"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach((link) => link.classList.toggle("active", link.hash === `#${visible.target.id}`));
  }, { rootMargin: "-20% 0px -65%", threshold: [0, 0.15, 0.4] });

  sections.forEach((section) => sectionObserver.observe(section));
}
