const docs = [
  {
    title: "Curriculum Revamp",
    file: "CURRICULUM-REVAMP.md",
    summary: "The course philosophy: survival English, not grammar coverage."
  },
  {
    title: "Current vs Next Curriculum",
    file: "CURRENT-VS-NEXT-CURRICULUM.md",
    summary: "B1-B4 map with current anchors and next-semester missions."
  },
  {
    title: "Class Model",
    file: "CLASS-MODEL.md",
    summary: "The volunteer-friendly rhythm: Formula, Practice, Real Use."
  },
  {
    title: "Volunteer Teaching Guide",
    file: "VOLUNTEER-TEACHING-GUIDE.md",
    summary: "Principles for teaching, correction, Portuguese, and student talk."
  },
  {
    title: "Assessment Model",
    file: "ASSESSMENT-MODEL.md",
    summary: "Two foundation tests and one speaking mission exam."
  },
  {
    title: "AI Study Missions",
    file: "AI-STUDY-MISSIONS.md",
    summary: "Extra-class study with ChatGPT Voice and offline alternatives."
  },
  {
    title: "Simple Present Prototype",
    file: "LESSON-SIMPLE-PRESENT.md",
    summary: "A concrete lesson prototype using the new model."
  }
];

const docList = document.querySelector("#docList");
const docTitle = document.querySelector("#docTitle");
const docContent = document.querySelector("#docContent");
const docDownload = document.querySelector("#docDownload");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderInline(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function renderTable(lines, startIndex) {
  const rows = [];
  let index = startIndex;

  while (index < lines.length && /^\|.+\|$/.test(lines[index].trim())) {
    const rawCells = lines[index].trim().slice(1, -1).split("|");
    rows.push(rawCells.map((cell) => renderInline(cell.trim())));
    index += 1;
  }

  const hasDivider = rows[1]?.every((cell) => /^:?-{3,}:?$/.test(cell));
  const header = rows[0] || [];
  const body = hasDivider ? rows.slice(2) : rows.slice(1);

  const thead = `<thead><tr>${header.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>`;

  return { html: `<table>${thead}${tbody}</table>`, nextIndex: index };
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let index = 0;
  let listOpen = false;
  let orderedOpen = false;
  let inCode = false;
  let code = [];

  function closeLists() {
    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }
    if (orderedOpen) {
      html.push("</ol>");
      orderedOpen = false;
    }
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
        closeLists();
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
      closeLists();
      index += 1;
      continue;
    }

    if (/^\|.+\|$/.test(trimmed)) {
      closeLists();
      const table = renderTable(lines, index);
      html.push(table.html);
      index = table.nextIndex;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      closeLists();
      html.push(`<h3>${renderInline(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      closeLists();
      html.push(`<h2>${renderInline(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith("# ")) {
      closeLists();
      html.push(`<h1>${renderInline(trimmed.slice(2))}</h1>`);
    } else if (/^- /.test(trimmed)) {
      if (orderedOpen) {
        html.push("</ol>");
        orderedOpen = false;
      }
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${renderInline(trimmed.slice(2))}</li>`);
    } else if (/^\d+\. /.test(trimmed)) {
      if (listOpen) {
        html.push("</ul>");
        listOpen = false;
      }
      if (!orderedOpen) {
        html.push("<ol>");
        orderedOpen = true;
      }
      html.push(`<li>${renderInline(trimmed.replace(/^\d+\. /, ""))}</li>`);
    } else {
      closeLists();
      html.push(`<p>${renderInline(trimmed)}</p>`);
    }

    index += 1;
  }

  closeLists();
  return html.join("");
}

async function loadDoc(doc, button) {
  docTitle.textContent = doc.title;
  docDownload.href = `assets/docs/${doc.file}`;
  docDownload.setAttribute("download", doc.file);
  docContent.innerHTML = "<p>Loading document...</p>";

  document.querySelectorAll(".doc-button").forEach((item) => item.classList.remove("active"));
  button?.classList.add("active");

  try {
    const response = await fetch(`assets/docs/${doc.file}`);
    if (!response.ok) throw new Error("Document not found");
    const markdown = await response.text();
    docContent.innerHTML = renderMarkdown(markdown);
  } catch (error) {
    docContent.innerHTML = "<p>Could not load this document.</p>";
  }
}

docs.forEach((doc, index) => {
  const button = document.createElement("button");
  button.className = "doc-button";
  button.type = "button";
  button.innerHTML = `${doc.title}<span>${doc.summary}</span>`;
  button.addEventListener("click", () => loadDoc(doc, button));
  docList.appendChild(button);

  if (index === 0) {
    loadDoc(doc, button);
  }
});
