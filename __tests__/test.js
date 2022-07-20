import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import fs from 'fs';
import path from 'path';
import app from '../src/js/application.js';

const pathToHtml = path.resolve(__dirname, '__fixtures__/index.html');
const html = fs.readFileSync(pathToHtml, 'utf-8');
const testRSSUrl = 'http://lorem-rss.herokuapp.com/feed?unit=second&interval=10';
const htmlElements = {};
let user;

beforeEach(async () => {
  document.body.innerHTML = html;
  user = userEvent.setup();
  app();

  htmlElements.input = screen.getByRole('textbox', { name: 'url' });
  htmlElements.submit = screen.getByRole('button', { name: 'add' });
  htmlElements.radioEN = screen.getByRole('radio', { name: 'radio-en' });
  htmlElements.radioRU = screen.getByRole('radio', { name: 'radio-ru' });
});

const table = [
  ['required', ' ', 'Не должно быть пустым'],
  ['invalid url', 'test.com', 'Ссылка должна быть валидным URL'],
  ['invalid rss', 'http://lorem-rss.herokuapp.com', 'Ресурс не содержит валидный RSS'],
  ['uploaded', testRSSUrl, 'RSS успешно загружен'],
];

describe.each(table)('Feedback validation', (error, url, feedback) => {
  test(`${error}`, async () => {
    await user.type(htmlElements.input, url);
    await user.click(htmlElements.submit);
    await waitFor(() => {
      expect(screen.getByText(feedback)).toBeInTheDocument();
    });
  });
});

test('already exist', async () => {
  await user.type(htmlElements.input, testRSSUrl);
  await user.click(htmlElements.submit);

  await waitFor(() => {
    user.type(htmlElements.input, testRSSUrl);
    user.click(htmlElements.submit);
    expect(screen.getByText('RSS уже существует')).toBeInTheDocument();
  });
});

describe('Render check', () => {
  it('render feed and posts', async () => {
    await user.type(htmlElements.input, testRSSUrl);
    await user.click(htmlElements.submit);
    await waitFor(() => {
      expect(screen.getByText('Фиды')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Посты')).toBeInTheDocument();
    });

    const lastPost = screen.getAllByRole('postLink')[0];
    expect(lastPost).toHaveClass('fw-bold');
    await user.click(lastPost);
    expect(lastPost).toHaveClass('fw-normal');
  });

  it('change language', async () => {
    await user.click(htmlElements.radioEN);
    await waitFor(() => {
      expect(screen.getByText('RSS aggregator')).toBeInTheDocument();
    });

    await user.click(htmlElements.radioRU);
    await waitFor(() => {
      expect(screen.getByText('RSS агрегатор')).toBeInTheDocument();
    });
  });
});
