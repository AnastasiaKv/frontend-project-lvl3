import * as yup from 'yup';
import axios from 'axios';
import i18n from 'i18next';
import _ from 'lodash';
import resources from './locales/index';
import * as view from './view';
import parser from './parser';

const defaultLanguage = 'ru';
const monitoringTimeInterval = 5000;

yup.setLocale({
  mixed: {
    default: 'unknown',
    notOneOf: 'alreadyExist',
    required: 'required',
  },
  string: {
    url: 'invalidURL',
  },
});

const generateSchema = (urls) => yup.object().shape({
  url: yup.string().required().url().notOneOf(urls),
});

const createRequestUrl = (url) => {
  const requestUrl = new URL('/get', 'https://allorigins.hexlet.app');
  requestUrl.searchParams.set('disableCache', 'true');
  requestUrl.searchParams.set('url', url);
  return requestUrl;
};

const feedsMonitoring = (watchedState) => {
  const promises = watchedState.feeds.map((feed) => {
    const requestUrl = createRequestUrl(feed.url);
    return axios.get(requestUrl)
      .then((response) => {
        const { posts } = parser(response.data.contents);
        const oldPostsLinks = watchedState.posts
          .filter((post) => post.feedId === feed.id)
          .map((post) => post.link);
        const newPosts = posts
          .filter((post) => !oldPostsLinks.includes(post.link))
          .map((post) => ({ ...post, id: _.uniqueId('post_'), feedId: feed.id }));
        if (newPosts.length) watchedState.posts.unshift(...newPosts);
      })
      .catch((err) => {
        console.error(err);
      });
  });

  Promise.allSettled(promises).finally(() => {
    setTimeout(() => feedsMonitoring(watchedState), monitoringTimeInterval);
  });
};

const getRSS = (url, watchedState) => {
  const requestUrl = createRequestUrl(url);
  axios.get(requestUrl)
    .then((response) => {
      watchedState.form.status = 'success';
      const feedData = parser(response.data.contents);
      const { posts, ...feed } = feedData;
      feed.id = _.uniqueId('feed_');
      feed.url = url;
      const feedPosts = posts.map((post) => ({ ...post, id: _.uniqueId('post_'), feedId: feed.id }));

      watchedState.feeds.unshift(feed);
      watchedState.posts.unshift(...feedPosts);
      watchedState.form.status = 'filling';
    })
    .catch((err) => {
      let errorType = 'unknown';
      if (err.isParsingError) errorType = 'invalidRSS';
      if (err.isAxiosError) errorType = 'network';
      watchedState.form.error = errorType;
      watchedState.form.status = 'fail';
      console.error(err);
    });
};

const getStoredFeeds = () => JSON.parse(localStorage.getItem('feeds')) || [];

const submitFormHandler = (watchedState) => (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const url = formData.get('url').trim();
  const feedsUrls = watchedState.feeds.map((feed) => feed.url);

  generateSchema(feedsUrls).validate({ url })
    .then(() => {
      watchedState.form.status = 'sending';
      watchedState.form.error = null;
      watchedState.form.valid = true;
      getRSS(url, watchedState);
    })
    .catch((err) => {
      watchedState.form.status = 'fail';
      watchedState.form.error = err.errors;
      watchedState.form.valid = false;
      console.error(err);
    });
};

const previewBtnHandler = (watchedState) => ({ target }) => {
  if (target.hasAttribute('data-id')) {
    const { id } = target.dataset;
    watchedState.modalPostId = id;
    if (!watchedState.visitedPosts.includes(id)) watchedState.visitedPosts.push(id);
  }
};

const feedHandler = (watchedState) => ({ target }) => {
  let feedId = target.dataset.feedId ?? target.parentElement.dataset.feedId;
  if (target.type === 'button') {
    watchedState.feeds = watchedState.feeds.filter((feed) => feed.id !== feedId);
    watchedState.posts = watchedState.posts.filter((post) => post.feedId !== feedId);
  } else {
    watchedState.activeFeedId = watchedState.activeFeedId !== feedId ? feedId : null;
  }
};

const getHTMLElements = () => ({
  form: document.querySelector('.rss-form'),
  input: document.getElementById('url-input'),
  submit: document.querySelector('.rss-form button[type="submit"]'),
  feedback: document.querySelector('.feedback'),
  postsCard: document.querySelector('.posts'),
  feedsCard: document.querySelector('.feeds'),
  modal: document.querySelector('.modal'),
  main: document.querySelector('main'),
  lngGroup: document.querySelector('.language-group'),
});

const app = () => {
  const elements = getHTMLElements();
  const state = {
    lng: defaultLanguage,
    form: {
      status: 'filling',
      error: null,
      valid: true,
    },
    feeds: getStoredFeeds(),
    posts: [],
    visitedPosts: [],
    modalPostId: null,
    activeFeedId: null,
  };

  const i18nInstance = i18n.createInstance();
  i18nInstance.init({ lng: defaultLanguage, debug: true, resources }).then(() => {
    const watchedState = view.stateWatcher(state, elements, i18nInstance);

    elements.form.addEventListener('submit', submitFormHandler(watchedState));
    elements.postsCard.addEventListener('click', previewBtnHandler(watchedState));
    elements.feedsCard.addEventListener('click', feedHandler(watchedState));
    elements.lngGroup.addEventListener('click', ({ target }) => {
      if (target.value) watchedState.lng = target.value;
    });

    view.render(elements, i18nInstance, watchedState);
    feedsMonitoring(watchedState);
  }).catch((err) => { console.error(err); });
};

export default app;
