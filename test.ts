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
type ContextResult = {
	messages: Array<{ role?: string; content?: unknown }>;
};
const context = extension.handlers.get("context")?.[0] as
	| ((event: { messages: unknown[] }) => ContextResult | undefined)
	| undefined;
assert.ok(context);
assert.match(tool.promptGuidelines?.join("\n") ?? "", /must call name_session/);
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

await tool.execute(
	"normalized-same",
	{ name: "Fix\nauth refresh" },
	new AbortController().signal,
	undefined,
	{} as never,
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
