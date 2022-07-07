import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';
import i18n from 'i18next';
import { v1 as uuid } from 'uuid';
import resources from './locales/index';
import render from './view';
import parser from './parser';

yup.setLocale({
  mixed: {
    default: 'ERR_UNKNOWN',
    notOneOf: 'ERR_ALREADY_EXISTS',
  },
  string: {
    url: 'ERR_INVALID_URL',
  },
});

const schema = (urls) => yup.object().shape({
  url: yup.string().required().url().notOneOf(urls),
});

const getRSS = (url, watchedState) => {
  // const axiosInstance = axios.create({
  //   baseURL: 'https://allorigins.hexlet.app',
  //   timeout: 5000,
  // });
  // axiosInstance.get(`/get?url=${encodeURIComponent(url)}`)

  const request = `https://allorigins.hexlet.app/get?url=${encodeURIComponent(url)}`;
  axios.get(request)
    .then((response) => {
      watchedState.form.status = 'success';
      return response.data;
    })
    .then((data) => data.contents)
    .then((xml) => parser(xml))
    .then((parsedData) => {
      const { title, description, posts } = parsedData;
      const feed = {
        id: uuid(),
        url,
        title,
        description,
      };
      const feedPosts = posts.map((post) => ({ ...post, id: uuid(), feedId: feed.id }));

      watchedState.form.status = 'filling';
      watchedState.feeds.unshift(feed);
      watchedState.posts.unshift(...feedPosts);
    })
    .catch((err) => {
      watchedState.form.status = 'fail';
      let errorType = 'ERR_UNKNOWN';
      if (err.isParsingError) errorType = 'ERR_INVALID_RSS';
      if (err.isAxiosError) errorType = 'ERR_NETWORK';
      watchedState.form.error = errorType;
    });
};

const app = () => {
  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.getElementById('url-input'),
    submit: document.querySelector('button[type="submit"]'),
    feedback: document.querySelector('.feedback'),
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
    modal: document.querySelector('.modal'),
  };

  const i18nInstance = i18n.createInstance();
  i18nInstance.init({
    lng: 'ru',
    debug: true,
    resources,
  }).then(() => {
    const state = onChange({
      form: {
        status: 'filling',
        error: null,
        valid: true,
      },
      feeds: [],
      posts: [],
    }, render(elements, i18nInstance));

    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const url = formData.get('url');
      const feedsUrls = state.feeds.map((feed) => feed.url);

      schema(feedsUrls).validate({ url })
        .then(() => {
          state.form.status = 'sending';
          state.form.error = null;
          state.form.valid = true;
          getRSS(url, state);
        })
        .catch((err) => {
          state.form.status = 'fail';
          state.form.error = err.errors;
          state.form.valid = false;
        });
    });
  });
};

export default app;
