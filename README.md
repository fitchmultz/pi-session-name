# pi-session-name

A tiny [Pi](https://github.com/earendil-works/pi) extension that lets the agent keep its session name useful.

The agent names an unnamed session after it understands the primary task. It may rename the session when the work materially changes scope, but not for minor follow-ups. Manual `/name` changes still work.

## Install

```sh
pi install git:github.com/fitchmultz/pi-session-name
```

Restart Pi or run `/reload` in an open session.

## What it adds

- `name_session`, an agent-callable tool backed by Pi's `setSessionName()` API
- a short per-turn metadata message containing the current name, so the agent can decide whether it still fits

Names persist in the session and appear in `/resume`.

## Development

The test currently requires macOS or Linux and a Node/npm installation of Pi on `PATH` (it uses Pi's npm package layout).

```sh
npm test
pi -e ./index.ts
```

## License

MIT
