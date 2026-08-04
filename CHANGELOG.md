# Changelog

## Unreleased

- Protects exact numbered subagent identifiers such as `subagent-1` from automatic removal or replacement.

## v0.2.0 - 2026-08-03

- Keeps automatically chosen session names broad and stable across follow-ups, phases, and temporary side tasks.
- Preserves `coordinator` in coordinator session names unless the user explicitly confirms its removal.
- Prefers short names with hyphens instead of spaces.
- Rejects hidden control characters in agent-chosen names and makes coordinator confirmation safe to cancel.

## v0.1.0 - 2026-08-02

- Initial release with automatic session naming and support for renaming after a material change in purpose.
