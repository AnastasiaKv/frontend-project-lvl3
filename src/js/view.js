import onChange from 'on-change';
import DOMPurify from 'dompurify';

const renderFeedback = (elements, i18n, status) => {
  elements.input.readOnly = false;
  elements.submit.disabled = false;

  switch (status) {
    case 'sending':
      elements.input.readOnly = true;
      elements.submit.disabled = true;
      break;
    case 'success':
      elements.feedback.classList.remove('text-danger');
      elements.feedback.classList.add('text-success');
      elements.feedback.textContent = i18n.t('feedbacks.uploaded');
      break;
    case 'fail':
      elements.feedback.classList.remove('text-success');
      elements.feedback.classList.add('text-danger');
      break;
    case 'filling':
      elements.input.value = '';
      elements.input.focus();
      break;
    default:
      throw new Error(`Unknown process state: ${status}`);
  }
};

const renderFeeds = (elements, i18n, feeds) => {
  const card = document.createElement('div');
  card.classList.add('card', 'border-0');
  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');
  const cardTitle = document.createElement('h2');
  cardTitle.classList.add('card-title', 'h4');
  cardTitle.textContent = i18n.t('ui.feeds');
  cardBody.append(cardTitle);

  const listGroup = document.createElement('ul');
  listGroup.classList.add('list-group', 'border-0');
  const listItems = feeds.map(({ id, title, description }) => (
    `<li class="list-group-item border-0" role="feedItem">
      <div class="row">
        <div class="col">
          <h3 class="title h6 m-0">${DOMPurify.sanitize(title)}</h3>
          <p class="description m-0 small text-black-50">${DOMPurify.sanitize(description)}</p>
        </div>
        <div class="col-auto">
          <button type="button" class="btn-close" aria-label="Close" data-feed-id="${id}"></button>
        </div>
      </div>
    </li>`
  ));
  listGroup.innerHTML = listItems.join('');

  card.append(cardBody, listGroup);
  elements.feedsCard.innerHTML = '';
  if (feeds.length) elements.feedsCard.append(card);
};

const renderPosts = (elements, i18n, posts) => {
  const card = document.createElement('div');
  card.classList.add('card', 'border-0');
  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');
  const cardTitle = document.createElement('h2');
  cardTitle.classList.add('card-title', 'h4');
  cardTitle.textContent = i18n.t('ui.posts');
  cardBody.append(cardTitle);

  const listGroup = document.createElement('ul');
  listGroup.classList.add('list-group', 'border-0');
  const listItems = posts.map((post) => (
    `<li class="list-group-item d-flex justify-content-between align-items-start border-0">
      <a
        href="${DOMPurify.sanitize(post.link)}"
        class="fw-bold"
        data-id="${post.id}"
        target="_blank"
        rel="noopener noreferrer"
        role="postLink"
      >${DOMPurify.sanitize(post.header)}</a>
      <button
        type="button"
        class="btn btn-outline-primary btn-sm"
        data-id="${post.id}"
        data-bs-toggle="modal"
        data-bs-target="#modal"
        role="postBtn"
      >${i18n.t('ui.preview')}</button>
    </li>`
  ));
  listGroup.innerHTML = listItems.join('');

  card.append(cardBody, listGroup);
  elements.postsCard.innerHTML = '';
  if (posts.length) elements.postsCard.append(card);
};

const renderVisitedPost = (elements, visitedPosts) => {
  const items = elements.postsCard.querySelectorAll('ul li a');
  items.forEach((item) => {
    if (visitedPosts.includes(item.dataset.id)) {
      item.classList.remove('fw-bold');
      item.classList.add('fw-normal', 'text-secondary');
    }
  });
};

const renderModal = (elements, i18n, post) => {
  const modalTitle = elements.modal.querySelector('.modal-title');
  modalTitle.textContent = post.header;
  const modalBody = elements.modal.querySelector('.modal-body');
  modalBody.innerHTML = DOMPurify.sanitize(post.content);
  const readMoreBtn = elements.modal.querySelector('.read-more-btn');
  readMoreBtn.href = post.link;
  readMoreBtn.textContent = i18n.t('ui.readMore');
  const closeBtn = elements.modal.querySelector('.close-btn');
  closeBtn.textContent = i18n.t('ui.close');
};

const render = (elements, i18n, state) => {
  const ruLabel = elements.lngGroup.querySelector('label[for="ru-option"]');
  ruLabel.textContent = i18n.t('ui.ru');
  const enLabel = elements.lngGroup.querySelector('label[for="en-option"]');
  enLabel.textContent = i18n.t('ui.en');

  const header = elements.main.querySelector('.main-header');
  header.textContent = i18n.t('ui.header');
  const paragraph = elements.main.querySelector('.main-paragraph');
  paragraph.textContent = i18n.t('ui.paragraph');
  const label = elements.main.querySelector('.main-label');
  label.textContent = i18n.t('ui.label');
  const addBtn = elements.main.querySelector('.main-add-btn');
  addBtn.textContent = i18n.t('ui.add');
  const example = elements.main.querySelector('.main-example');
  example.textContent = i18n.t('ui.example');

  let feedbackText = '';
  if (state.form.error) feedbackText = i18n.t(`errors.${state.form.error}`);
  else if (state.form.status === 'success') feedbackText = i18n.t('feedbacks.uploaded');
  elements.feedback.textContent = feedbackText;

  if (state.feeds.length) {
    renderFeeds(elements, i18n, state.feeds);
  }
  if (state.posts.length) {
    renderPosts(elements, i18n, state.posts);
    renderVisitedPost(elements, state.visitedPosts);
  }
};

const stateWatcher = (state, elements, i18n) => onChange(state, (path, value) => {
  switch (path) {
    case 'form.status':
      renderFeedback(elements, i18n, value);
      break;
    case 'form.error':
      elements.feedback.textContent = value ? i18n.t(`errors.${value}`) : '';
      break;
    case 'form.valid':
      if (!value) elements.input.classList.add('is-invalid');
      else elements.input.classList.remove('is-invalid');
      break;
    case 'feeds':
      renderFeeds(elements, i18n, value);
      localStorage.setItem('feeds', JSON.stringify(value));
      break;
    case 'posts':
      renderPosts(elements, i18n, value);
      renderVisitedPost(elements, state.visitedPosts);
      break;
    case 'visitedPosts':
      renderVisitedPost(elements, value);
      break;
    case 'modalPostId':
      renderModal(elements, i18n, state.posts.find(({ id }) => id === value));
      break;
    case 'lng':
      i18n.changeLanguage(value).then(() => render(elements, i18n, state));
      break;
    default:
      break;
  }
});

export { stateWatcher, render };
