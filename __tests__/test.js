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

describe('Feedback validation', () => {
  it('required', async () => {
    await user.type(htmlElements.input, ' ');
    await user.click(htmlElements.submit);
    await waitFor(() => {
      expect(screen.getByText('Не должно быть пустым')).toBeInTheDocument();
    });
  });

  it('invalid url', async () => {
    await user.type(htmlElements.input, 'test.com');
    await user.click(htmlElements.submit);
    await waitFor(() => {
      expect(screen.getByText('Ссылка должна быть валидным URL')).toBeInTheDocument();
    });
  });

  it('invalid rss', async () => {
    await user.type(htmlElements.input, 'http://lorem-rss.herokuapp.com');
    await user.click(htmlElements.submit);
    await waitFor(() => {
      expect(screen.getByText('Ресурс не содержит валидный RSS')).toBeInTheDocument();
    });
  });

  it('uploaded & already exist', async () => {
    await user.type(htmlElements.input, testRSSUrl);
    await user.click(htmlElements.submit);
    await waitFor(() => {
      expect(screen.getByText('RSS успешно загружен')).toBeInTheDocument();
    });

    await user.type(htmlElements.input, testRSSUrl);
    await user.click(htmlElements.submit);
    await waitFor(() => {
      expect(screen.getByText('RSS уже существует')).toBeInTheDocument();
    });
  });
});

describe('Render check', () => {
  it('render feed and posts', async () => {
    await user.type(htmlElements.input, testRSSUrl);
    await user.click(htmlElements.submit);
    await waitFor(() => {
      expect(screen.queryAllByRole('feedItem')[0]).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.queryAllByRole('postLink')[0]).toBeInTheDocument();
    });

    const lastPost = screen.queryAllByRole('postLink')[0];
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
