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

  it('uploaded', async () => {
    await user.type(htmlElements.input, testRSSUrl);
    await user.click(htmlElements.submit);
    await waitFor(() => {
      expect(screen.getByText('RSS успешно загружен')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Фиды')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Посты')).toBeInTheDocument();
    });
  });

  it('uploaded & already exist', async () => {
    await user.type(htmlElements.input, testRSSUrl);
    await user.click(htmlElements.submit);

    await waitFor(() => {
      expect(screen.getByText('RSS успешно загружен')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Фиды')).toBeInTheDocument();
      const feeds = document.querySelectorAll('.feeds li');
      expect(feeds).toHaveLength(1);
    });
    await waitFor(() => {
      expect(screen.getByText('Посты')).toBeInTheDocument();
      const posts = document.querySelectorAll('.posts li');
      expect(posts).not.toHaveLength(0);
    });

    await user.type(htmlElements.input, testRSSUrl);
    await user.click(htmlElements.submit);

    await waitFor(() => {
      expect(screen.getByText('RSS уже существует')).toBeInTheDocument();
    });
  });
});
