# Incluir English Workbook - Templating Guide

## For AI Agents: Content Generation Rules

This document defines the **exact rules** for generating workbook content. Follow these rules strictly to ensure consistent, valid output.

---

## Content Contract

### Allowed HTML Tags

**Structural:**
- `<html>`, `<head>`, `<body>`
- `<main>`, `<header>`, `<footer>`, `<section>`, `<nav>`
- `<div>`, `<span>`

**Text:**
- `<h1>`, `<h2>`, `<h3>`, `<h4>` (no h5/h6)
- `<p>`
- `<strong>`, `<em>`
- `<ul>`, `<ol>`, `<li>`
- `<a>` (for internal links only)

**Tables:**
- `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`

**Media:**
- `<img>` (with alt text required)
- `<figure>`, `<figcaption>`

### Forbidden Patterns

**NEVER use:**
- `<script>` tags
- `<style>` tags (all styles in external CSS)
- `<iframe>`, `<embed>`, `<object>`
- Inline styles (`style="..."`)
- External URLs in `href` or `src`
- `<br>` for spacing (use CSS margins)
- Empty elements
- Deeply nested structures (max 4 levels)

---

## Component Vocabulary

### Structural Components

#### Chapter Container
```html
<div class="chapter" id="chapter-N">
    <header class="chapter-header">
        <span class="chapter-number">Chapter N</span>
        <h1 class="chapter-title">Title Here</h1>
        <p class="chapter-intro">Optional introduction text.</p>
    </header>
    <!-- units go here -->
</div>
```

#### Unit Container
```html
<section class="unit" id="unit-N-M">
    <header class="unit-header">
        <span class="unit-number">Unit N.M</span>
        <h2 class="unit-title">Unit Title</h2>
    </header>
    <!-- content goes here -->
</section>
```

Use `class="unit page-break-before"` to force a page break before the unit.

---

### Content Components

#### Rule Box
**Purpose:** Grammar rules, key points, important information.

```html
<div class="rule-box">
    <div class="rule-box-header">
        <span class="rule-box-icon">📐</span>
        <span class="rule-box-title">Rule Title</span>
    </div>
    <div class="rule-box-content">
        <p>Rule explanation here.</p>
        <ul>
            <li>Point one</li>
            <li>Point two</li>
        </ul>
    </div>
</div>
```

**Can contain:** `<p>`, `<ul>`, `<ol>`, `<table>`, `.example`
**Cannot contain:** `.exercise`, `.callout`, `.answer-key`, nested `.rule-box`

---

#### Callout
**Purpose:** Tips, notes, warnings, reminders.

**Variants:** `.tip`, `.note`, `.warning`, `.remember`

```html
<div class="callout tip">
    <div class="callout-icon">💡</div>
    <div class="callout-content">
        <strong class="callout-label">Tip:</strong>
        <p>Helpful tip text here.</p>
    </div>
</div>
```

**Can contain:** `<p>`, `<ul>`, `<ol>`, `<strong>`, `<em>`
**Cannot contain:** `.exercise`, `.rule-box`, `.example`, `.vocab-table`, nested `.callout`

---

#### Example
**Purpose:** Show example sentences, phrases, usage.

```html
<div class="example">
    <div class="example-label">Example:</div>
    <div class="example-content">
        <p class="example-english">English sentence here.</p>
        <p class="example-translation">Portuguese translation here.</p>
        <p class="example-note">Optional note.</p>
    </div>
</div>
```

For multiple examples:
```html
<div class="example-group">
    <div class="example">...</div>
    <div class="example">...</div>
</div>
```

**Cannot contain:** `.exercise`, `.callout`, `.rule-box`

---

#### Vocabulary Table
**Purpose:** Word lists with translations.

```html
<div class="vocab-table">
    <table>
        <thead>
            <tr>
                <th>English</th>
                <th>Português</th>
                <th>Example</th>
            </tr>
        </thead>
        <tbody>
            <tr class="vocab-item">
                <td class="vocab-english">word</td>
                <td class="vocab-translation">palavra</td>
                <td class="vocab-example">Usage example</td>
            </tr>
        </tbody>
    </table>
</div>
```

---

#### Dialogue Block
**Purpose:** Conversations between characters.

```html
<div class="dialogue-block">
    <div class="dialogue-header">Scene Title</div>
    <div class="dialogue-line">
        <span class="dialogue-speaker">Name:</span>
        <span class="dialogue-text">What they say.</span>
    </div>
    <div class="dialogue-line">
        <span class="dialogue-speaker">Name2:</span>
        <span class="dialogue-text">Response.</span>
    </div>
</div>
```

---

### Exercise Components

#### Exercise Container
```html
<div class="exercise" data-exercise-type="TYPE">
    <div class="exercise-header">
        <span class="exercise-number">Exercise N</span>
        <span class="exercise-title">Exercise Title</span>
    </div>
    <div class="exercise-instructions">
        <p>Instructions for the exercise.</p>
    </div>
    <div class="exercise-items">
        <!-- exercise items here -->
    </div>
</div>
```

**Exercise types** (use in `data-exercise-type`):
- `fill-blank` - Fill in the blanks
- `multiple-choice` - Multiple choice questions
- `matching` - Match items
- `true-false` - True/false questions
- `short-answer` - Short written answers
- `translation` - Translation exercises
- `ordering` - Put in correct order

---

#### Fill-in-the-Blank Item
```html
<div class="exercise-item">
    <span class="exercise-item-number">1.</span>
    <span class="exercise-item-content">
        She <span class="answer-blank" data-answer="is"></span> a teacher.
    </span>
    <span class="answer">is</span>
</div>
```

---

#### Multiple Choice Item
```html
<div class="exercise-item">
    <span class="exercise-item-number">1.</span>
    <span class="exercise-item-content">
        <p>Question text here?</p>
        <ul class="exercise-options">
            <li class="exercise-option">
                <span class="exercise-checkbox"></span>
                <span class="exercise-option-letter">a)</span>
                <span class="exercise-option-text">Option A</span>
            </li>
            <li class="exercise-option">
                <span class="exercise-checkbox"></span>
                <span class="exercise-option-letter">b)</span>
                <span class="exercise-option-text">Option B</span>
            </li>
        </ul>
        <span class="answer">b) Option B</span>
    </span>
</div>
```

---

#### Writing Lines
```html
<!-- Single line -->
<div class="answer-line"></div>

<!-- Multiple lines -->
<div class="answer-lines">
    <div class="answer-line"></div>
    <div class="answer-line"></div>
    <div class="answer-line"></div>
</div>
```

---

### Reading Passage
**Purpose:** Text for reading comprehension exercises.

```html
<div class="reading-passage">
    <div class="reading-passage-header">
        <span class="reading-passage-title">Story Title</span>
        <span class="reading-passage-meta">Read the text and answer the questions.</span>
    </div>
    <div class="reading-passage-content">
        <p>First paragraph of the story...</p>
        <p>Second paragraph...</p>
    </div>
    <div class="reading-passage-footer">
        <span class="reading-passage-source">Source or attribution</span>
    </div>
</div>
```

---

### Matching Exercise
**Purpose:** Connect items from two columns.

```html
<div class="exercise" data-exercise-type="matching">
    <div class="exercise-header">...</div>
    <div class="exercise-instructions">...</div>
    <div class="matching-columns">
        <div class="matching-column matching-column-left">
            <div class="matching-item">
                <span class="matching-number">1.</span>
                <span class="matching-text">hello</span>
            </div>
        </div>
        <div class="matching-column matching-column-right">
            <div class="matching-item">
                <span class="matching-letter">a)</span>
                <span class="matching-text">olá</span>
            </div>
        </div>
    </div>
    <div class="matching-answer-area">
        <span class="matching-answer-slot">1. <span class="answer-blank" data-answer="a"></span></span>
    </div>
    <span class="answer">1-a</span>
</div>
```

---

### Ordering Exercise
**Purpose:** Put items in correct sequence.

```html
<div class="exercise" data-exercise-type="ordering">
    <div class="exercise-header">...</div>
    <div class="exercise-instructions">...</div>
    <div class="ordering-items">
        <div class="ordering-item">
            <span class="ordering-box"></span>
            <span class="ordering-text">She wakes up.</span>
            <span class="answer">1</span>
        </div>
        <div class="ordering-item">
            <span class="ordering-box"></span>
            <span class="ordering-text">She eats breakfast.</span>
            <span class="answer">2</span>
        </div>
    </div>
</div>
```

---

### Word Bank
**Purpose:** Box of words to use in fill-in-the-blank exercises.

```html
<div class="word-bank">
    <div class="word-bank-title">Word Bank</div>
    <div class="word-bank-items">
        <span class="word-bank-item">hello</span>
        <span class="word-bank-item">goodbye</span>
        <span class="word-bank-item">morning</span>
    </div>
</div>
```

---

### Image Components

#### Single Image with Caption
```html
<figure class="image-figure">
    <img src="../../assets/images/photo.png" alt="Description">
    <figcaption>Caption text here</figcaption>
</figure>
```

#### Image Grid (2-4 images)
```html
<div class="image-grid">
    <div class="image-grid-item">
        <img src="../../assets/images/place1.png" alt="Coffee shop">
        <span class="image-label">A. Coffee Shop</span>
    </div>
    <div class="image-grid-item">
        <img src="../../assets/images/place2.png" alt="Park">
        <span class="image-label">B. Park</span>
    </div>
</div>
```

#### Image Exercise (image + questions side by side)
```html
<div class="image-exercise">
    <div class="image-exercise-image">
        <img src="../../assets/images/scene.png" alt="Scene description">
    </div>
    <div class="image-exercise-content">
        <div class="exercise-items">
            <!-- questions here -->
        </div>
    </div>
</div>
```

---

### Listening Placeholder
**Purpose:** Indicate audio content for future digital versions.

```html
<div class="listening-box">
    <div class="listening-icon">🎧</div>
    <div class="listening-content">
        <span class="listening-label">Listen to Track 3</span>
        <span class="listening-description">A conversation at the airport</span>
    </div>
</div>
```

---

### Answer Key
```html
<div class="answer-key">
    <h3 class="answer-key-title">Chapter N - Answer Key</h3>

    <div class="answer-key-section">
        <h4>Exercise 1: Title</h4>
        <div class="answer-key-items">
            <span class="answer-key-item">1. answer</span>
            <span class="answer-key-item">2. answer</span>
        </div>
    </div>
</div>
```

---

### Teacher Notes
```html
<div class="teacher-note">
    <div class="teacher-note-label">Teacher Note:</div>
    <div class="teacher-note-content">
        <p><strong>Suggested time:</strong> 15 minutes</p>
        <p><strong>Activity:</strong> Description of suggested activity.</p>
    </div>
</div>
```

---

## Nesting Rules Summary

| Component | Can Contain | Cannot Contain |
|-----------|-------------|----------------|
| `.chapter` | `.unit`, all content/exercise components | - |
| `.unit` | `.section`, all content/exercise components | - |
| `.rule-box` | `<p>`, lists, `<table>`, `.example` | `.exercise`, `.callout`, `.answer-key`, nested `.rule-box` |
| `.callout` | `<p>`, lists, inline formatting | `.exercise`, `.rule-box`, `.example`, `.vocab-table`, nested `.callout` |
| `.example` | `.example-*` classes only | `.exercise`, `.callout`, `.rule-box` |
| `.exercise` | `.exercise-*` classes, `.answer` | `.rule-box`, `.callout`, nested `.exercise` |

---

## Page Break Rules

### Force Page Break Before
Add `page-break-before` class or use `.chapter-start`, `.unit-start`:
```html
<section class="unit page-break-before">
```

### Prevent Element Splitting
These classes automatically prevent page breaks inside:
- `.exercise`
- `.callout`
- `.rule-box`
- `.example`
- `.vocab-item`
- `.dialogue-block`

### Keep Heading with Content
All headings (`h1`-`h4`) have `page-break-after: avoid` by default.

---

## Common Mistakes to Avoid

### ❌ Wrong: Inline Styles
```html
<p style="color: red;">Text</p>
```

### ✓ Correct: Use CSS Classes
```html
<div class="callout warning">
    <p>Text</p>
</div>
```

---

### ❌ Wrong: Nested Callouts
```html
<div class="callout">
    <div class="callout">  <!-- WRONG -->
    </div>
</div>
```

### ✓ Correct: Separate Callouts
```html
<div class="callout tip">...</div>
<div class="callout note">...</div>
```

---

### ❌ Wrong: Missing Answer Tags
```html
<div class="exercise-item">
    <span class="answer-blank" data-answer="is"></span>
    <!-- Missing .answer span! -->
</div>
```

### ✓ Correct: Include Both
```html
<div class="exercise-item">
    <span class="answer-blank" data-answer="is"></span>
    <span class="answer">is</span>
</div>
```

---

### ❌ Wrong: External Resources
```html
<img src="https://example.com/image.png">
```

### ✓ Correct: Local Paths
```html
<img src="../../assets/images/image.png" alt="Description">
```

---

## Checklist for Content Generation

Before considering content complete, verify:

- [ ] Uses only allowed HTML tags
- [ ] All content uses defined component classes
- [ ] No inline styles
- [ ] No external URLs
- [ ] All images have alt text
- [ ] All exercises have `.answer` spans
- [ ] Answer key includes all exercises
- [ ] IDs are unique (chapter-N, unit-N-M)
- [ ] Nesting rules are followed
- [ ] Teacher notes are included where appropriate
