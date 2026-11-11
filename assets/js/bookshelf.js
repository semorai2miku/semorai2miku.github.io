(() => {
  const shelf = document.querySelector('[data-bookshelf]');
  if (!shelf) return;

  const search = shelf.querySelector('[data-bookshelf-search]');
  const author = shelf.querySelector('[data-bookshelf-author]');
  const buttons = [...shelf.querySelectorAll('[data-bookshelf-status]')];
  const resets = [...shelf.querySelectorAll('[data-bookshelf-reset]')];
  const result = shelf.querySelector('[data-bookshelf-results]');
  const empty = shelf.querySelector('[data-bookshelf-empty]');
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase().trim();
  const picker = shelf.querySelector('[data-author-picker]');
  const authorTrigger = picker.querySelector('[data-author-trigger]');
  const authorPanel = picker.querySelector('[data-author-panel]');
  const authorSearch = picker.querySelector('[data-author-search]');
  const authorOptions = picker.querySelector('[data-author-options]');
  const authorAll = picker.querySelector('[data-author-all]');
  const authorEmpty = picker.querySelector('[data-author-empty]');
  const authorPrevious = picker.querySelector('[data-author-prev]');
  const authorNext = picker.querySelector('[data-author-next]');
  const authorPageLabel = picker.querySelector('[data-author-page]');
  const authors = [...author.options].filter(option => option.value).map(option => option.value);
  const authorPageSize = 10;
  let authorPage = 0;
  let authorQuery = '';
  const books = [...shelf.querySelectorAll('[data-book]')].map(element => ({
    element,
    author: element.dataset.author,
    status: element.dataset.status,
    text: normalize(`${element.dataset.title} ${element.dataset.author}`),
  }));
  const bookNavigation = [...shelf.querySelectorAll('[data-book-pagination]')].map(element => ({
    element,
    previous: element.querySelector('[data-book-prev]'),
    next: element.querySelector('[data-book-next]'),
    label: element.querySelector('[data-book-page]'),
  }));
  const bookPageSize = 50;
  let bookPage = 0;
  let matchingBooks = books;
  let status = 'all';

  function renderAuthors() {
    const matches = authors.filter(name => normalize(name).includes(authorQuery));
    const pageCount = Math.max(1, Math.ceil(matches.length / authorPageSize));
    authorPage = Math.min(authorPage, pageCount - 1);
    const fragment = document.createDocumentFragment();
    matches.slice(authorPage * authorPageSize, (authorPage + 1) * authorPageSize).forEach(name => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'bookshelf-author-option';
      button.dataset.authorChoice = name;
      button.textContent = name;
      button.setAttribute('aria-pressed', String(author.value === name));
      button.addEventListener('click', () => chooseAuthor(name));
      item.append(button);
      fragment.append(item);
    });
    authorOptions.replaceChildren(fragment);
    authorOptions.scrollTop = 0;
    authorAll.setAttribute('aria-pressed', String(!author.value));
    authorEmpty.hidden = matches.length > 0;
    authorPrevious.disabled = authorPage === 0;
    authorNext.disabled = authorPage >= pageCount - 1;
    authorPageLabel.textContent = matches.length ? `${authorPage + 1} / ${pageCount} 页 · ${matches.length} 位` : '0 位作者';
  }

  function setAuthorExpanded(expanded) {
    authorPanel.hidden = !expanded;
    authorSearch.setAttribute('aria-expanded', String(expanded));
    authorTrigger.setAttribute('aria-expanded', String(expanded));
    authorTrigger.setAttribute('aria-label', expanded ? '收起作者列表' : '展开作者列表');
  }

  function positionAuthorPanel() {
    if (authorPanel.hidden) return;
    const rectangle = authorSearch.getBoundingClientRect();
    const viewport = window.visualViewport;
    const top = viewport?.offsetTop || 0;
    const bottom = top + (viewport?.height || window.innerHeight);
    const below = bottom - rectangle.bottom - 16;
    const above = rectangle.top - top - 16;
    const opensAbove = below < 320 && above > below;
    authorPanel.classList.toggle('is-above', opensAbove);
    authorPanel.style.setProperty('--author-popup-height', `${Math.min(560, Math.max(160, opensAbove ? above : below))}px`);
  }

  function closeAuthors(restoreFocus = false) {
    setAuthorExpanded(false);
    authorSearch.value = author.value;
    authorQuery = '';
    if (restoreFocus) authorSearch.focus({preventScroll:true});
  }

  function openAuthors() {
    if (!authorPanel.hidden) return;
    authorPage = authorQuery ? 0 : Math.max(0, Math.floor(authors.indexOf(author.value) / authorPageSize));
    renderAuthors();
    setAuthorExpanded(true);
    positionAuthorPanel();
  }

  function chooseAuthor(name) {
    author.value = name;
    closeAuthors(true);
    update();
  }

  function changeAuthorPage(delta) {
    const focused = document.activeElement;
    authorPage += delta;
    renderAuthors();
    if (focused === authorPrevious && authorPrevious.disabled) authorNext.focus();
    if (focused === authorNext && authorNext.disabled) authorPrevious.focus();
  }

  function renderBooks() {
    const first = bookPage * bookPageSize;
    const visible = new Set(matchingBooks.slice(first, first + bookPageSize));
    books.forEach(book => { book.element.hidden = !visible.has(book); });
    const pageCount = Math.ceil(matchingBooks.length / bookPageSize);
    bookNavigation.forEach(({element, previous, next, label}) => {
      element.hidden = pageCount < 2;
      previous.disabled = bookPage === 0;
      next.disabled = bookPage >= pageCount - 1;
      label.textContent = pageCount ? `${bookPage + 1} / ${pageCount} 页` : '';
    });
  }

  function changeBookPage(delta, navigation) {
    bookPage += delta;
    renderBooks();
    const top = bookNavigation[0];
    const target = delta > 0 ? top.next : top.previous;
    (target.disabled ? (delta > 0 ? top.previous : top.next) : target).focus({preventScroll:true});
    if (navigation !== top) top.element.parentElement.scrollIntoView({block:'start'});
  }

  function update() {
    const terms = normalize(search.value).split(/\s+/).filter(Boolean);
    const scope = books.filter(book => (!author.value || book.author === author.value) && terms.every(term => book.text.includes(term)));
    matchingBooks = scope.filter(book => status === 'all' || book.status === status);
    bookPage = 0;
    renderBooks();

    buttons.forEach(button => {
      const value = button.dataset.bookshelfStatus;
      button.setAttribute('aria-pressed', String(value === status));
      button.querySelector('[data-bookshelf-count]').textContent = value === 'all' ? scope.length : scope.filter(book => book.status === value).length;
    });
    const filtered = !!(terms.length || author.value || status !== 'all');
    resets[0].hidden = !filtered;
    empty.hidden = matchingBooks.length !== 0;
    result.textContent = filtered ? `找到 ${matchingBooks.length} 项书目` : `全部 ${books.length} 项书目`;
  }

  search.addEventListener('input', update);
  bookNavigation.forEach(navigation => {
    navigation.previous.addEventListener('click', () => changeBookPage(-1, navigation));
    navigation.next.addEventListener('click', () => changeBookPage(1, navigation));
  });
  authorTrigger.addEventListener('click', () => {
    if (authorPanel.hidden) openAuthors();
    else closeAuthors();
    authorSearch.focus({preventScroll:true});
    if (!authorPanel.hidden) authorSearch.select();
  });
  authorSearch.addEventListener('click', () => {
    if (!authorPanel.hidden) return;
    openAuthors();
    authorSearch.select();
  });
  authorSearch.addEventListener('input', () => {
    authorQuery = normalize(authorSearch.value);
    if (authorPanel.hidden) {
      openAuthors();
      return;
    }
    authorPage = 0;
    renderAuthors();
  });
  authorAll.addEventListener('click', () => chooseAuthor(''));
  authorPrevious.addEventListener('click', () => changeAuthorPage(-1));
  authorNext.addEventListener('click', () => changeAuthorPage(1));
  picker.addEventListener('keydown', event => {
    if (event.isComposing) return;
    if (authorPanel.hidden) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        event.preventDefault();
        openAuthors();
        authorSearch.select();
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeAuthors(true);
      return;
    }
    const choices = [...authorOptions.querySelectorAll('[data-author-choice]')];
    if (!choices.length) return;
    const index = choices.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const next = index < 0 ? (event.key === 'ArrowDown' ? 0 : choices.length - 1) : Math.max(0, Math.min(choices.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)));
      choices[next].focus();
    } else if (event.key === 'Enter' && event.target === authorSearch) {
      event.preventDefault();
      if (choices.length === 1) choices[0].click();
      else choices[0].focus();
    }
  });
  document.addEventListener('focusin', event => {
    if (!authorPanel.hidden && !picker.contains(event.target)) closeAuthors();
  });
  document.addEventListener('pointerdown', event => {
    if (!authorPanel.hidden && !picker.contains(event.target)) closeAuthors();
  });
  window.addEventListener('resize', positionAuthorPanel);
  window.addEventListener('scroll', positionAuthorPanel, {passive:true});
  window.visualViewport?.addEventListener('resize', positionAuthorPanel);
  buttons.forEach(button => button.addEventListener('click', () => {
    status = button.dataset.bookshelfStatus;
    update();
  }));
  resets.forEach(button => button.addEventListener('click', () => {
    search.value = '';
    author.value = '';
    closeAuthors();
    status = 'all';
    update();
    search.focus();
  }));

  shelf.querySelectorAll('[data-book-cover] img').forEach(image => {
    const missing = () => {
      image.hidden = true;
      image.parentElement.querySelector('[data-book-missing]').hidden = false;
    };
    image.addEventListener('error', missing, {once:true});
    if (image.complete && image.naturalWidth === 0) missing();
  });

  shelf.querySelector('[data-bookshelf-controls]').hidden = false;
  update();
})();
