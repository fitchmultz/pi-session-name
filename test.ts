import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const piExecutable = execFileSync("which", ["pi"], { encoding: "utf8" }).trim();
const piPackageRoot = dirname(dirname(realpathSync(piExecutable)));
const { createExtensionRuntime, loadExtensions } = await import(
	pathToFileURL(join(piPackageRoot, "dist/core/extensions/loader.js")).href
);

const runtime = createExtensionRuntime();
let active = true;
let currentName: string | undefined;
const names: string[] = [];
runtime.getActiveTools = () => (active ? ["name_session"] : []);
runtime.getSessionName = () => currentName;
runtime.setSessionName = (name: string) => {
	currentName = name.replace(/[\r\n]+/g, " ").trim();
	names.push(currentName);
};

const loaded = await loadExtensions([join(process.cwd(), "index.ts")], process.cwd(), undefined, runtime);
assert.deepEqual(loaded.errors, []);
assert.equal(loaded.extensions.length, 1);

const extension = loaded.extensions[0];
const tool = extension.tools.get("name_session")?.definition;
assert.ok(tool);
assert.equal(tool.executionMode, "sequential");
type ContextResult = {
	messages: Array<{ role?: string; content?: unknown }>;
};
const context = extension.handlers.get("context")?.[0] as
	| ((event: { messages: unknown[] }) => ContextResult | undefined)
	| undefined;
assert.ok(context);
assert.match(tool.promptGuidelines?.join("\n") ?? "", /must call name_session/);
assert.match(tool.promptGuidelines?.join("\n") ?? "", /overall purpose/);
assert.match(tool.promptGuidelines?.join("\n") ?? "", /When unsure, keep the current name/);
assert.match(tool.promptGuidelines?.join("\n") ?? "", /require the user to confirm/);
assert.match(tool.promptGuidelines?.join("\n") ?? "", /avoid spaces/);

const userMessage = { role: "user", content: "task", timestamp: 1 };
const unnamedContext = await context({ messages: [userMessage] });
assert.equal(unnamedContext?.messages[0]?.role, "custom");
assert.match(String(unnamedContext?.messages[0]?.content), /"currentName":null/);
assert.deepEqual(unnamedContext?.messages.slice(1), [userMessage]);

const first = await tool.execute(
	"first",
	{ name: "  Fix auth refresh  " },
	new AbortController().signal,
	undefined,
	{} as never,
);
assert.deepEqual(names, ["Fix auth refresh"]);
assert.deepEqual(first.details, { name: "Fix auth refresh", previousName: undefined });

await tool.execute(
	"same",
	{ name: "Fix auth refresh" },
	new AbortController().signal,
	undefined,
	{} as never,
);
assert.deepEqual(names, ["Fix auth refresh"]);

await assert.rejects(
	tool.execute(
		"control-character",
		{ name: "Fix\nauth refresh" },
		new AbortController().signal,
		undefined,
		{} as never,
	),
	/control or formatting characters/,
);
await assert.rejects(
	tool.execute(
		"format-character",
		{ name: "auth-\u200Bcoordinator" },
		new AbortController().signal,
		undefined,
		{} as never,
	),
	/control or formatting characters/,
);
assert.deepEqual(names, ["Fix auth refresh"]);

const followUpMessages = [
	userMessage,
	{ role: "assistant", content: [{ type: "toolCall", name: "name_session" }] },
	{ role: "toolResult", toolName: "name_session" },
];
const namedContext = await context({ messages: followUpMessages });
assert.match(String(namedContext?.messages[0]?.content), /"currentName":"Fix auth refresh"/);
assert.deepEqual(namedContext?.messages.slice(1), followUpMessages);

await tool.execute(
	"rename",
	{ name: "Ship auth migration" },
	new AbortController().signal,
	undefined,
	{} as never,
);
assert.deepEqual(names, ["Fix auth refresh", "Ship auth migration"]);
assert.match(
	String((await context({ messages: followUpMessages }))?.messages[0]?.content),
	/"currentName":"Ship auth migration"/,
);

await tool.execute(
	"coordinator",
	{ name: "release-coordinator" },
	new AbortController().signal,
	undefined,
	{} as never,
);
await assert.rejects(
	tool.execute(
		"remove-coordinator-without-ui",
		{ name: "release-planning" },
		new AbortController().signal,
		undefined,
		{} as never,
	),
	/ask the user to rename it with \/name/,
);
assert.equal(currentName, "release-coordinator");
let confirmations = 0;
const removalContext = (confirmed: boolean) =>
	({
		hasUI: true,
		ui: {
			confirm: async (_title: string, message: string) => {
				confirmations++;
				assert.doesNotMatch(message, /release-coordinator/);
				return confirmed;
			},
		},
	}) as never;
await assert.rejects(
	tool.execute(
		"decline-coordinator-removal",
		{ name: "release-planning" },
		new AbortController().signal,
		undefined,
		removalContext(false),
	),
	/not confirmed by the user/,
);
assert.equal(currentName, "release-coordinator");
await tool.execute(
	"confirm-coordinator-removal",
	{ name: "release-planning" },
	new AbortController().signal,
	undefined,
	removalContext(true),
);
assert.equal(confirmations, 2);
assert.equal(currentName, "release-planning");

await tool.execute(
	"restore-coordinator",
	{ name: "release-coordinator" },
	new AbortController().signal,
	undefined,
	{} as never,
);
const abortController = new AbortController();
const abortContext = {
	hasUI: true,
	ui: {
		confirm: async (_title: string, _message: string, options: { signal?: AbortSignal }) => {
			assert.equal(options.signal, abortController.signal);
			abortController.abort();
			return true;
		},
	},
} as never;
await assert.rejects(
	tool.execute(
		"abort-coordinator-removal",
		{ name: "release-planning" },
		abortController.signal,
		undefined,
		abortContext,
	),
	/Coordinator removal was cancelled/,
);
assert.equal(currentName, "release-coordinator");

await assert.rejects(
	tool.execute(
		"blank",
		{ name: "   " },
		new AbortController().signal,
		undefined,
		{} as never,
	),
	/Session name cannot be blank/,
);

active = false;
assert.equal(await context({ messages: [userMessage] }), undefined);

console.log("pi-session-name checks passed");
