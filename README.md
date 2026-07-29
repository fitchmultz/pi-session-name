# pi-session-name

Make your [Pi](https://github.com/earendil-works/pi) sessions easier to find and resume later.

This extension asks the agent to give each session a short, useful name. The agent can update the name when the main task changes, while leaving it alone for small follow-up requests.

## Install

```sh
pi install git:github.com/fitchmultz/pi-session-name
```

Start a new Pi session after installation. If Pi is already open, enter:

```text
/reload
```

No other setup is required.

## Use

Work in Pi as usual. The agent will:

- name an unnamed session after it understands the main task
- keep the current name for small follow-up requests
- choose a new name when the main task changes
- use short names with hyphens instead of spaces, such as `fix-login-flow`

You can still choose a name yourself at any time:

```text
/name Refactor login flow
```

Your session names appear when you enter `/resume`.

## Update

```sh
pi update --extension git:github.com/fitchmultz/pi-session-name
```

## Remove

```sh
pi remove git:github.com/fitchmultz/pi-session-name
```

## Contributing

The automated check currently requires macOS or Linux, Pi installed through Node/npm, and Pi available on your command line.

```sh
npm test
```

## License

MIT
