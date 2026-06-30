/* -------------------------------------------------------------
 * CS Fundamentals - Interactive Web App Logic
 * ------------------------------------------------------------- */

// Global State
let appData = [];
let currentSubject = null;
let currentChapterIdx = -1;
let readChapters = {}; // Key: chapterPath, Value: boolean

// DOM Elements
const homeLink = document.getElementById('home-link');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');
const sidebarClose = document.getElementById('sidebar-close');
const sidebarSubjectTitle = document.getElementById('sidebar-subject-title');
const sidebarChaptersList = document.getElementById('sidebar-chapters-list');
const mainContent = document.getElementById('main-content');
const appContainer = document.querySelector('.app-container');

// Views
const dashboardView = document.getElementById('dashboard-view');
const readerView = document.getElementById('reader-view');
const subjectsGrid = document.getElementById('subjects-grid');

// Search
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results'); // correct ID from HTML

// Stats
const statSubjects = document.getElementById('stat-subjects-count');
const statChapters = document.getElementById('stat-chapters-count');
const statCompleted = document.getElementById('stat-completed-count');

// Reader View Elements
const markdownContent = document.getElementById('markdown-content');
const breadcrumbs = document.getElementById('reader-breadcrumbs');
const prevBtn = document.getElementById('prev-chapter-btn');
const nextBtn = document.getElementById('next-chapter-btn');
const markReadBtn = document.getElementById('mark-read-btn');
const backToDashboardBtn = document.getElementById('back-to-dashboard');
const readerScrollProgress = document.getElementById('reader-scroll-progress');
const backToTopBtn = document.getElementById('back-to-top');

// Theme & Progress
const themeToggle = document.getElementById('theme-toggle');
const globalProgressBar = document.getElementById('global-progress-bar');
const globalProgressText = document.querySelector('.progress-text');

// Subject Details Configuration
const SUBJECT_CONFIGS = {
  "Data Structure and Algorithms": { icon: "fa-sitemap", gradient: "from-blue-to-purple" },
  "Operating System": { icon: "fa-microchip", gradient: "from-orange-to-red" },
  "Computer Network": { icon: "fa-network-wired", gradient: "from-teal-to-blue" },
  "DBMS": { icon: "fa-database", gradient: "from-green-to-teal" },
  "Object Oriented Programing": { icon: "fa-cubes", gradient: "from-purple-to-pink" },
  "Theory Of Computation": { icon: "fa-gears", gradient: "from-pink-to-red" },
  "Compiler Design": { icon: "fa-code-branch", gradient: "from-indigo-to-cyan" }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  loadProgress();
  await loadCatalog();
  setupEventListeners();
  renderDashboard();
  updateGlobalProgress();
  
  // Handle URL hash routing if active
  handleHashRoute();
});

// Load catalog metadata index.json
async function loadCatalog() {
  try {
    const response = await fetch('index.json');
    appData = await response.json();
    
    // Set counts in hero stats
    let totalChapters = 0;
    appData.forEach(sub => totalChapters += sub.chapters.length);
    
    statSubjects.textContent = appData.length;
    statChapters.textContent = totalChapters;
  } catch (error) {
    console.error("Failed to load course catalog index.json:", error);
    mainContent.innerHTML = `<div style="text-align:center; padding:3rem;"><i class="fa-solid fa-triangle-exclamation" style="font-size:3rem; color:var(--accent-warning);"></i><h2 style="margin-top:1rem;">Failed to load Catalog</h2><p>Please make sure you run this application from an HTTP server.</p></div>`;
  }
}

// Event Listeners Configuration
function setupEventListeners() {
  // Navigation & Routing
  homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    navigateToDashboard();
  });
  backToDashboardBtn.addEventListener('click', navigateToDashboard);
  
  // Sidebar Toggle
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('visible');
  });
  sidebarClose.addEventListener('click', () => {
    sidebar.classList.remove('visible');
  });
  
  // Search Box Event
  searchInput.addEventListener('input', handleSearch);
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.style.display = 'none';
    }
  });

  // Theme Toggle
  themeToggle.addEventListener('click', toggleTheme);

  // Chapter Status
  markReadBtn.addEventListener('click', toggleCurrentChapterReadStatus);

  // Navigation within chapters
  prevBtn.addEventListener('click', navigatePrev);
  nextBtn.addEventListener('click', navigateNext);

  // Scroll Actions
  window.addEventListener('scroll', handleWindowScroll);
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Hash route change listener
  window.addEventListener('hashchange', handleHashRoute);
}

// --- Theme Management ---
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// --- Progress Management ---
function loadProgress() {
  const saved = localStorage.getItem('read_chapters');
  if (saved) {
    readChapters = JSON.parse(saved);
  }
}

function saveProgress() {
  localStorage.setItem('read_chapters', JSON.stringify(readChapters));
  updateGlobalProgress();
  // Rerender dashboard if it's currently open
  if (dashboardView.style.display !== 'none') {
    renderDashboard();
  }
}

function updateGlobalProgress() {
  let total = 0;
  let completed = 0;
  
  appData.forEach(sub => {
    sub.chapters.forEach(ch => {
      total++;
      if (readChapters[ch.path]) {
        completed++;
      }
    });
  });
  
  statCompleted.textContent = completed;
  
  if (total > 0) {
    const percentage = Math.round((completed / total) * 100);
    globalProgressBar.style.width = `${percentage}%`;
    globalProgressText.textContent = `Progress: ${percentage}%`;
  }
}

// --- View State Routing ---
function navigateToDashboard() {
  window.location.hash = '';
  showDashboard();
}

function showDashboard() {
  dashboardView.style.display = 'block';
  readerView.style.display = 'none';
  sidebar.style.display = 'none';
  sidebarToggle.style.display = 'none';
  appContainer.classList.remove('has-sidebar');
  document.title = "CS Fundamentals - Premium Study Dashboard";
  renderDashboard();
}

function showReader(subjectName, chapterPath) {
  dashboardView.style.display = 'none';
  readerView.style.display = 'block';
  sidebar.style.display = 'block';
  sidebarToggle.style.display = 'flex';
  appContainer.classList.add('has-sidebar');
  
  currentSubject = appData.find(sub => sub.subject === subjectName);
  currentChapterIdx = currentSubject.chapters.findIndex(ch => ch.path === chapterPath);
  
  renderSidebar();
  loadChapter(chapterPath);
}

// --- Render Functions ---
function renderDashboard() {
  subjectsGrid.innerHTML = '';
  
  appData.forEach(sub => {
    const config = SUBJECT_CONFIGS[sub.subject] || { icon: "fa-book", gradient: "" };
    
    // Calculate progress for this subject
    let subjectTotal = sub.chapters.length;
    let subjectCompleted = 0;
    sub.chapters.forEach(ch => {
      if (readChapters[ch.path]) subjectCompleted++;
    });
    
    const percentage = subjectTotal > 0 ? Math.round((subjectCompleted / subjectTotal) * 100) : 0;
    
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.innerHTML = `
      <div>
        <div class="subject-icon-wrapper">
          <i class="fa-solid ${config.icon}"></i>
        </div>
        <h3>${sub.subject}</h3>
        <p>${subjectTotal} Chapters of Study Notes</p>
      </div>
      <div class="subject-progress-container">
        <div class="subject-progress-header">
          <span>${percentage}% Complete</span>
          <span>${subjectCompleted}/${subjectTotal}</span>
        </div>
        <div class="subject-progress-bar">
          <div class="subject-progress-fill" style="width: ${percentage}%"></div>
        </div>
      </div>
    `;
    
    card.addEventListener('click', () => {
      if (sub.chapters.length > 0) {
        const firstChapter = sub.chapters[0].path;
        window.location.hash = `reader/${encodeURIComponent(sub.subject)}/${encodeURIComponent(firstChapter)}`;
      }
    });
    
    subjectsGrid.appendChild(card);
  });
}

function renderSidebar() {
  if (!currentSubject) return;
  
  sidebarSubjectTitle.textContent = currentSubject.subject;
  sidebarChaptersList.innerHTML = '';
  
  currentSubject.chapters.forEach((ch, idx) => {
    const item = document.createElement('div');
    const isRead = readChapters[ch.path] ? 'read' : '';
    const isActive = idx === currentChapterIdx ? 'active' : '';
    
    item.className = `sidebar-item ${isActive} ${isRead}`;
    item.innerHTML = `
      <span>${ch.title}</span>
      <i class="fa-regular ${isRead ? 'fa-circle-check' : 'fa-circle'} status-check"></i>
    `;
    
    item.addEventListener('click', () => {
      window.location.hash = `reader/${encodeURIComponent(currentSubject.subject)}/${encodeURIComponent(ch.path)}`;
      sidebar.classList.remove('visible'); // Close on mobile
    });
    
    sidebarChaptersList.appendChild(item);
  });
}

// --- Load Markdown and Render ---
async function loadChapter(path) {
  try {
    markdownContent.innerHTML = `<div style="text-align:center; padding:5rem;"><i class="fa-solid fa-spinner fa-spin" style="font-size:3rem; color:var(--accent-primary);"></i><p style="margin-top:1rem;">Fetching content...</p></div>`;
    
    const response = await fetch(path);
    if (!response.ok) throw new Error("File not found");
    
    let markdownText = await response.text();
    
    // Parse alert blockquotes (GitHub Alert syntax)
    markdownText = parseGitHubAlerts(markdownText);
    
    // Parse Markdown into HTML
    const htmlContent = marked.parse(markdownText);
    markdownContent.innerHTML = htmlContent;
    
    // Setup chapter info display
    const chapter = currentSubject.chapters[currentChapterIdx];
    breadcrumbs.textContent = `${currentSubject.subject} / ${chapter.title}`;
    document.title = `${chapter.title} - CS Fundamentals`;
    
    // Update reader footer buttons
    updateReaderControls(chapter.path);
    
    // Render KaTeX formulas
    renderMathInElement(markdownContent, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false},
        {left: '\\(', right: '\\)', display: false},
        {left: '\\[', right: '\\]', display: true}
      ],
      throwOnError: false
    });
    
    // Trigger PrismJS syntax highlight
    if (window.Prism) {
      window.Prism.highlightAllUnder(markdownContent);
    }
    
    // Scroll to top of content
    window.scrollTo({ top: 0 });
    
  } catch (error) {
    console.error("Failed to load chapter:", error);
    markdownContent.innerHTML = `<div style="text-align:center; padding:3rem;"><i class="fa-solid fa-triangle-exclamation" style="font-size:3rem; color:var(--accent-warning);"></i><h2 style="margin-top:1rem;">Chapter Not Found</h2><p>Unable to load notes at <code>${path}</code>.</p></div>`;
  }
}

// Convert GitHub Alerts style blocks (e.g. > [!NOTE]) into styled HTML divs
function parseGitHubAlerts(text) {
  const alertTypes = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'];
  
  alertTypes.forEach(type => {
    const regex = new RegExp(`> \\[!${type}\\]\\n(>.*\\n?)*`, 'gi');
    text = text.replace(regex, (match) => {
      // Clean blockquote symbols
      let content = match
        .replace(new RegExp(`> \\[!${type}\\]`, 'i'), '')
        .replace(/^>\s?/gm, '')
        .trim();
        
      return `<div class="alert alert-${type.toLowerCase()}"><strong>${type}</strong><br>${content}</div>\n`;
    });
  });
  
  return text;
}

// Update reader navigation buttons and Mark Read buttons
function updateReaderControls(chapterPath) {
  // Previous button
  if (currentChapterIdx > 0) {
    prevBtn.style.opacity = '1';
    prevBtn.style.pointerEvents = 'auto';
  } else {
    prevBtn.style.opacity = '0.4';
    prevBtn.style.pointerEvents = 'none';
  }
  
  // Next button
  if (currentChapterIdx < currentSubject.chapters.length - 1) {
    nextBtn.style.opacity = '1';
    nextBtn.style.pointerEvents = 'auto';
  } else {
    nextBtn.style.opacity = '0.4';
    nextBtn.style.pointerEvents = 'none';
  }
  
  // Mark read button state
  if (readChapters[chapterPath]) {
    markReadBtn.innerHTML = `<i class="fa-solid fa-square-check"></i> Completed`;
    markReadBtn.classList.remove('btn-primary');
    markReadBtn.classList.add('btn-secondary');
  } else {
    markReadBtn.innerHTML = `<i class="fa-regular fa-square-check"></i> Mark as Read`;
    markReadBtn.classList.remove('btn-secondary');
    markReadBtn.classList.add('btn-primary');
  }
}

function toggleCurrentChapterReadStatus() {
  const chapter = currentSubject.chapters[currentChapterIdx];
  if (readChapters[chapter.path]) {
    delete readChapters[chapter.path];
  } else {
    readChapters[chapter.path] = true;
  }
  saveProgress();
  updateReaderControls(chapter.path);
  renderSidebar();
}

function navigatePrev() {
  if (currentChapterIdx > 0) {
    const nextChapter = currentSubject.chapters[currentChapterIdx - 1];
    window.location.hash = `reader/${encodeURIComponent(currentSubject.subject)}/${encodeURIComponent(nextChapter.path)}`;
  }
}

function navigateNext() {
  if (currentChapterIdx < currentSubject.chapters.length - 1) {
    const nextChapter = currentSubject.chapters[currentChapterIdx + 1];
    window.location.hash = `reader/${encodeURIComponent(currentSubject.subject)}/${encodeURIComponent(nextChapter.path)}`;
  }
}

// --- Scroll Indicators & Buttons ---
function handleWindowScroll() {
  // Back to top button visibility
  if (window.scrollY > 400) {
    backToTopBtn.classList.add('visible');
  } else {
    backToTopBtn.classList.remove('visible');
  }
  
  // Reading scroll progress bar
  if (readerView.style.display !== 'none') {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    
    const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
    readerScrollProgress.style.width = `${scrollPercent}%`;
  }
}

// --- Router Engine ---
function handleHashRoute() {
  const hash = window.location.hash;
  
  if (!hash || hash === '#') {
    showDashboard();
    return;
  }
  
  const parts = hash.split('/');
  if (parts[0] === '#reader' && parts.length >= 3) {
    const subject = decodeURIComponent(parts[1]);
    const chapterPath = decodeURIComponent(parts.slice(2).join('/'));
    showReader(subject, chapterPath);
  } else {
    showDashboard();
  }
}

// --- Search Engine ---
function handleSearch() {
  const query = searchInput.value.trim().toLowerCase();
  
  if (!query) {
    searchResults.style.display = 'none';
    return;
  }
  
  const matches = [];
  appData.forEach(sub => {
    sub.chapters.forEach(ch => {
      if (ch.title.toLowerCase().includes(query) || sub.subject.toLowerCase().includes(query)) {
        matches.push({
          subject: sub.subject,
          title: ch.title,
          path: ch.path
        });
      }
    });
  });
  
  if (matches.length === 0) {
    searchResults.innerHTML = `<div style="padding:0.75rem 1rem; color:var(--text-muted); font-size:0.9rem;">No results found</div>`;
  } else {
    searchResults.innerHTML = '';
    matches.slice(0, 10).forEach(match => {
      const item = document.createElement('div');
      item.className = 'search-item';
      item.innerHTML = `
        <span class="search-title">${match.title}</span>
        <span class="search-subj">${match.subject}</span>
      `;
      item.addEventListener('click', () => {
        window.location.hash = `reader/${encodeURIComponent(match.subject)}/${encodeURIComponent(match.path)}`;
        searchResults.style.display = 'none';
        searchInput.value = '';
      });
      searchResults.appendChild(item);
    });
  }
  
  searchResults.style.display = 'block';
}
