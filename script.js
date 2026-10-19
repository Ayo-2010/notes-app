const STORE_KEY = 'notely.notes';
const THEME_KEY = 'notely.theme';

let notes = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
let activeId = null;
let searchTerm = '';
let saveTimer = null;

const noteList = document.getElementById('noteList');
const listEmpty = document.getElementById('listEmpty');
const noteCount = document.getElementById('noteCount');
const searchInput = document.getElementById('searchInput');
const newBtn = document.getElementById('newBtn');
const clearAll = document.getElementById('clearAll');
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menuBtn');
const editorEmpty = document.getElementById('editorEmpty');
const editorPane = document.getElementById('editorPane');
const noteTitle = document.getElementById('noteTitle');
const noteBody = document.getElementById('noteBody');
const noteDate = document.getElementById('noteDate');
const noteWords = document.getElementById('noteWords');
const savedIndicator = document.getElementById('savedIndicator');
const deleteBtn = document.getElementById('deleteBtn');
const themeBtn = document.getElementById('themeBtn');

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(notes));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function wordCount(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function renderList() {
  const filtered = notes
    .filter((n) => {
      if (!searchTerm) return true;
      const haystack = (n.title + ' ' + n.body).toLowerCase();
      return haystack.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => b.updated - a.updated);

  noteList.innerHTML = '';
  listEmpty.hidden = filtered.length !== 0;
  listEmpty.textContent = notes.length === 0 ? 'No notes yet. Create one →' : 'No notes match your search.';

  filtered.forEach((note) => {
    const li = document.createElement('li');
    li.className = 'note-item' + (note.id === activeId ? ' active' : '');
    const preview = note.body.trim().slice(0, 60) || 'Empty note';

    const title = document.createElement('h3');
    title.textContent = note.title.trim() || 'Untitled note';
    const para = document.createElement('p');
    para.textContent = preview;
    const time = document.createElement('time');
    time.textContent = timeAgo(note.updated);

    li.append(title, para, time);
    li.addEventListener('click', () => openNote(note.id));
    noteList.appendChild(li);
  });

  noteCount.textContent = `${notes.length} note${notes.length === 1 ? '' : 's'}`;
}

function openNote(id) {
  const note = notes.find((n) => n.id === id);
  if (!note) return;

  activeId = id;
  editorEmpty.hidden = true;
  editorPane.hidden = false;

  noteTitle.value = note.title;
  noteBody.value = note.body;
  noteDate.textContent = `Edited ${timeAgo(note.updated)}`;
  noteWords.textContent = `${wordCount(note.body)} words`;

  renderList();
  if (window.innerWidth <= 760) sidebar.classList.remove('open');
  noteTitle.focus();
}

function createNote() {
  const note = {
    id: uid(),
    title: '',
    body: '',
    updated: Date.now(),
    created: Date.now(),
  };
  notes.unshift(note);
  save();
  renderList();
  openNote(note.id);
}

function deleteNote() {
  if (!activeId) return;
  const note = notes.find((n) => n.id === activeId);
  if (!note) return;

  const label = note.title.trim() || 'this note';
  if (!confirm(`Delete "${label}"?`)) return;

  notes = notes.filter((n) => n.id !== activeId);
  activeId = null;
  save();
  renderList();

  editorPane.hidden = true;
  editorEmpty.hidden = false;
}

function scheduleSave() {
  if (!activeId) return;
  const note = notes.find((n) => n.id === activeId);
  if (!note) return;

  note.title = noteTitle.value;
  note.body = noteBody.value;
  note.updated = Date.now();

  savedIndicator.textContent = 'Saving…';
  savedIndicator.classList.remove('flash');

  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    save();
    renderList();
    savedIndicator.textContent = 'Saved';
    savedIndicator.classList.add('flash');
    setTimeout(() => savedIndicator.classList.remove('flash'), 1200);
  }, 400);
}

newBtn.addEventListener('click', createNote);
deleteBtn.addEventListener('click', deleteNote);

noteTitle.addEventListener('input', scheduleSave);
noteBody.addEventListener('input', () => {
  scheduleSave();
  noteWords.textContent = `${wordCount(noteBody.value)} words`;
});

noteBody.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = noteBody.selectionStart;
    noteBody.value = noteBody.value.slice(0, start) + '  ' + noteBody.value.slice(noteBody.selectionEnd);
    noteBody.selectionStart = noteBody.selectionEnd = start + 2;
    scheduleSave();
  }
});

searchInput.addEventListener('input', () => {
  searchTerm = searchInput.value;
  renderList();
});

clearAll.addEventListener('click', () => {
  if (notes.length === 0) return;
  if (!confirm('Delete all notes? This cannot be undone.')) return;
  notes = [];
  activeId = null;
  save();
  renderList();
  editorPane.hidden = true;
  editorEmpty.hidden = false;
});

menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

document.addEventListener('click', (e) => {
  if (window.innerWidth > 760) return;
  if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== menuBtn) {
    sidebar.classList.remove('open');
  }
});

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    save();
    savedIndicator.textContent = 'Saved';
    savedIndicator.classList.add('flash');
    setTimeout(() => savedIndicator.classList.remove('flash'), 1200);
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    searchInput.focus();
  }
});

function applyTheme(dark) {
  document.body.classList.toggle('dark', dark);
  themeBtn.textContent = dark ? '☀️' : '🌙';
  localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
}

themeBtn.addEventListener('click', () => {
  applyTheme(!document.body.classList.contains('dark'));
});

applyTheme(localStorage.getItem(THEME_KEY) === 'dark');
renderList();

if (notes.length > 0) {
  openNote(notes.slice().sort((a, b) => b.updated - a.updated)[0].id);
}
