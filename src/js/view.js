const renderFeedback = (elements, status, i18n) => {
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

const renderFeeds = (elements, value, prevValue) => {
  console.log(value, prevValue);
  console.log('Feeds loading');
}

const renderPosts = (elements, value, prevValue) => {
  console.log(value, prevValue);
  console.log('Posts loading');
  // elements.posts.innerHTML = value[0].content
}

const render = (elements, i18n) => (path, value, prevValue) => {
  switch (path) {
    case 'form.status':
      renderFeedback(elements, value, i18n);
      break;
    case 'form.error':
      elements.feedback.textContent = value ? i18n.t(`errors.${value}`) : '';
      break;
    case 'form.valid':
      if (!value) elements.input.classList.add('is-invalid');
      else elements.input.classList.remove('is-invalid');
      break;
    case 'feeds':
      renderFeeds(elements, value, prevValue);
      break;
    case 'posts':
      renderPosts(elements, value, prevValue);
      break;
    default:
      break;
  }
};

export default render;
