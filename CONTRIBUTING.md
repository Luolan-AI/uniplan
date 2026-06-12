# Contributing to UniPlan

Thank you for helping improve UniPlan. Contributions can include code, tests,
documentation, translations, accessibility fixes, and university curriculum
templates.

## Before You Start

- Search existing issues and pull requests to avoid duplicate work.
- Keep each pull request focused on one clear change.
- Do not include personal grades, names, student IDs, login details, API keys,
  copyrighted course material, or private university documents.
- Verify curriculum data against a current official source and state the source
  date in the pull request description.

## Development Setup

```bash
# Fork and clone the repository first, then:
cd uniplan
npm install
npm run dev
```

Before submitting a pull request:

```bash
npm test
npm run build
```

## Code Guidelines

- Follow the existing React and plain-CSS patterns.
- Keep the application local-first unless a change explicitly introduces an
  optional, clearly disclosed external service.
- Do not add an API key or shared AI token to frontend code.
- Preserve English, Chinese, and German behavior when changing UI text.
- Use stable unique IDs for modules and courses. Course codes are not unique IDs.
- Add tests when changing statistics, imports, validation, or storage behavior.
- Keep accessibility labels and keyboard navigation intact.

## Adding a Translation

Translations are stored in `src/i18n.js`.

1. Add every existing translation key to the new language dictionary.
2. Add the language to the selectors in `src/App.jsx`.
3. Check desktop and mobile layouts for longer labels.
4. Verify that missing values still fall back to English.

## Adding a Curriculum Template

Templates are stored in `src/templates.js`.

1. Use a unique template ID.
2. Use a unique internal ID for every course, even when the official code is
   missing or duplicated.
3. Include the university, program, regulation version, total credits, semester
   count, and grading system.
4. Keep personal progress out of public templates. Courses should normally start
   as `available`; mandatory semester recommendations may start as `planned`.
5. Add a disclaimer when the template is unofficial.
6. Test total module requirements and representative semester assignments.

Curriculum facts can become outdated. Include links to authoritative public
documentation in the pull request rather than embedding copyrighted documents.

## Pull Request Description

Explain:

- what changed;
- why the change is needed;
- user-visible impact;
- tests performed;
- source and verification date for curriculum changes.

## Reporting Bugs

Include the browser and operating system, reproduction steps, expected behavior,
actual behavior, and a screenshot if it contains no private information.
