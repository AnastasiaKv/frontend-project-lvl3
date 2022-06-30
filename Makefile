install:
		npm ci
		npx simple-git-hooks

develop:
		npm run serve

build:
		rm -rf dist
		npm run build

test:
		npm test

test-coverage:
		npm test -- --coverage --coverageProvider=v8

lint:
		npx eslint .

.PHONY: test

