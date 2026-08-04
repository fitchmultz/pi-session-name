# pi-session-name

Make your [Pi](https://github.com/earendil-works/pi) sessions easier to find and resume later.

This extension asks the agent to give each session a short, useful name. Names stay broad and stable so they remain useful throughout the work.

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

- name an unnamed session after it understands the overall purpose
- choose a broad name for the whole job, not the current step
- keep the current name through follow-ups, phases, and temporary side tasks
- choose a new name only when the overall purpose clearly and permanently changes
- use short names with hyphens instead of spaces, such as `fix-login-flow`

You can still choose a name yourself at any time:

```text
/name refactor-login-flow
```

Names containing `coordinator` or a numbered identifier such as `subagent-1` are protected. The agent will keep the same role or exact identifier in every future name. If you tell the agent it no longer applies, Pi will ask you to confirm before removing it. You can also rename the session yourself with `/name`.

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
