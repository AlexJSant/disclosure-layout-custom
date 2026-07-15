# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `generateStructuredData` prop (opt-in, defaults to `false`) on `disclosure-ld-layout` and `disclosure-ld-layout-group`, generating [schema.org `FAQPage`](https://schema.org/FAQPage) JSON-LD structured data (`<script type="application/ld+json">`, injected via `Helmet` from `vtex.render-runtime`, resolved during SSR). When enabled on a `disclosure-ld-layout-group`, all `disclosure-ld-layout` descendants are aggregated into a single script, taking precedence over their individual `generateStructuredData` prop. Both props are exposed in the Site Editor via block `schema`.

### Fixed

- Strip Markdown (not only HTML) from rich-text when building FAQ JSON-LD, so markers like `**bold**`, `*italic*`, links, and list bullets no longer appear literally in schema.org `name` / `text`.

### Changed

- Update GitHub actions/cache to v4

## [1.0.4] - 2023-06-30

### Fixed

- Fixes of i18n on readme.md

## [1.0.3] - 2020-09-15
### Fixed
- README.md file (app documentation).

## [1.0.2] - 2020-09-10

### Fixed

- Add media to docs.

## [1.0.1] - 2020-09-04

### Fixed

- Slot props.

## [1.0.0] - 2020-08-28

### Added

- Intial release.
