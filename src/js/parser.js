const isParserError = (doc) => !!doc.querySelector('parsererror');
const isAtom = (doc) => !!doc.querySelector('feed');
const isRSS = (doc) => !!doc.querySelector('rss');

const parseAtom = (doc) => {
  const feed = doc.querySelector('feed');

  const title = feed.querySelector('title')?.textContent || '';
  const description = feed.querySelector('description')?.textContent || '';
  const items = feed.querySelectorAll('entry');
  const posts = [];
  items.forEach((item) => {
    const header = item.querySelector('title')?.textContent || '';
    const content = item.querySelector('content')?.textContent || '';
    const link = item.querySelector('link')?.getAttribute('href') || '';
    posts.push({ header, content, link });
  });
  return { title, description, posts };
};

const parseRSS = (doc) => {
  const channel = doc.querySelector('channel');

  const title = channel.querySelector('title')?.textContent || '';
  const description = channel.querySelector('description')?.textContent || '';
  const items = channel.querySelectorAll('item');
  const posts = [];
  items.forEach((item) => {
    const header = item.querySelector('title')?.textContent || '';
    const content = item.querySelector('description')?.textContent || '';
    const link = item.querySelector('link')?.textContent || '';
    posts.push({ header, content, link });
  });
  return { title, description, posts };
};

const parseString = (xml) => {
  const promise = new Promise((resolve, reject) => {
    const parser = new window.DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');

    const error = new Error('Unable to parse XML.');
    error.isParsingError = true;

    if (isParserError(xmlDoc)) {
      reject(error);
    } else if (isAtom(xmlDoc)) {
      const result = parseAtom(xmlDoc);
      resolve(result);
    } else if (isRSS(xmlDoc)) {
      const result = parseRSS(xmlDoc);
      resolve(result);
    } else {
      error.message = 'RSS version not recognized.';
      reject(error);
    }
  });

  return promise;
};

export default parseString;
