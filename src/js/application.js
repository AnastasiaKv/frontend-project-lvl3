import * as yup from 'yup';
import axios from 'axios';
import i18n from 'i18next';
import _ from 'lodash';
import resources from './locales/index';
import * as view from './view';
import parser from './parser';

yup.setLocale({
  mixed: {
    default: 'ERR_UNKNOWN',
    notOneOf: 'ERR_ALREADY_EXISTS',
    required: 'ERR_REQUIRED',
  },
  string: {
    url: 'ERR_INVALID_URL',
  },
});

const schema = (urls) => yup.object().shape({
  url: yup.string().required().url().notOneOf(urls),
});

const createRequestUrl = (url) => {
  // `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;
  const request = new URL('/get', 'https://allorigins.hexlet.app');
  request.searchParams.set('disableCache', 'true');
  request.searchParams.set('url', url);
  return request;
};

const feedsMonitoring = (watchedState) => {
  const promises = watchedState.feeds.map((feed) => {
    const requestUrl = createRequestUrl(feed.url);
    return axios.get(requestUrl)
      .then((response) => response.data.contents)
      .then((xml) => parser(xml))
      .then((data) => {
        const oldPostsLinks = watchedState.posts
          .filter((post) => post.feedId === feed.id)
          .map((post) => post.link);
        const newPosts = data.posts
          .filter((post) => !oldPostsLinks.includes(post.link))
          .map((post) => ({ ...post, id: _.uniqueId('post_'), feedId: feed.id }));
        watchedState.posts.unshift(...newPosts);
      })
      .catch((err) => {
        console.error(err);
      });
  });

  Promise.allSettled(promises).finally(() => {
    setTimeout(() => feedsMonitoring(watchedState), 5000);
  });
};

const getRSS = (url, watchedState) => {
  const requestUrl = createRequestUrl(url);
  axios.get(requestUrl)
    .then((response) => {
      watchedState.form.status = 'success';
      return response.data.contents;
    })
    .then((xml) => parser(xml))
    .then((data) => {
      const { title, description, posts } = data;
      const feed = {
        id: _.uniqueId('feed_'),
        url,
        title,
        description,
      };
      const feedPosts = posts.map((post) => ({ ...post, id: _.uniqueId('post_'), feedId: feed.id }));

      watchedState.feeds.unshift(feed);
      watchedState.posts.unshift(...feedPosts);
      watchedState.form.status = 'filling';
    })
    .catch((err) => {
      let errorType = 'ERR_UNKNOWN';
      if (err.isParsingError) errorType = 'ERR_INVALID_RSS';
      if (err.isAxiosError) errorType = 'ERR_NETWORK';
      watchedState.form.error = errorType;
      watchedState.form.status = 'fail';
    });
};

const app = () => {
  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.getElementById('url-input'),
    submit: document.querySelector('.rss-form button[type="submit"]'),
    feedback: document.querySelector('.feedback'),
    postsCard: document.querySelector('.posts'),
    feedsCard: document.querySelector('.feeds'),
    modal: document.querySelector('#modal'),
    main: document.querySelector('main'),
    lngGroup: document.querySelector('.language-group'),
  };
  const defaultLanguage = 'ru';
  const state = {
    lng: defaultLanguage,
    form: {
      status: 'filling',
      error: null,
      valid: true,
    },
    feeds: [],
    posts: [],
    visitedPosts: [],
    modalPostId: null,
  };

  const i18nInstance = i18n.createInstance();
  i18nInstance.init({
    lng: defaultLanguage,
    debug: true,
    resources,
  }).then(() => {
    const watchedState = view.stateWatcher(state, elements, i18nInstance);

    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const url = formData.get('url').trim();
      const feedsUrls = watchedState.feeds.map((feed) => feed.url);

      schema(feedsUrls).validate({ url })
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
        });
    });

    elements.postsCard.addEventListener('click', ({ target }) => {
      if (target.hasAttribute('data-id')) {
        const { id } = target.dataset;
        watchedState.modalPostId = id;
        if (!watchedState.visitedPosts.includes(id)) watchedState.visitedPosts.push(id);
      }
    });

    elements.lngGroup.addEventListener('click', (e) => {
      if (e.target.value) watchedState.lng = e.target.value;
    });

    view.render(elements, i18nInstance, watchedState);

    setTimeout(() => feedsMonitoring(watchedState), 5000);
  }).catch((err) => {
    console.error(err);
  });
};

export default app;
