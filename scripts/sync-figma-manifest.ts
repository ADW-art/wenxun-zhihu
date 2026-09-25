import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type FigmaVariable = {
  figmaName: string;
  cssVariable: string;
  type: "COLOR" | "FLOAT" | "STRING";
  value: string;
};

type VariableCollection = {
  name: string;
  variables: FigmaVariable[];
};

type Manifest = {
  variableCollections: VariableCollection[];
  [key: string]: unknown;
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tokensPath = path.join(root, "src", "app", "tokens.css");
const manifestPath = path.join(root, "design", "figma", "ui-foundation.manifest.json");

const css = readFileSync(tokensPath, "utf8");
const rootBlock = css.match(/:root\s*\{([\s\S]*?)\}\s*@theme inline/);
if (!rootBlock) throw new Error("tokens.css 缺少 :root Token 区块");

const declarations = new Map<string, string>();
for (const match of rootBlock[1].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
  declarations.set(`--${match[1]}`, match[2].trim());
}

function resolve(name: string, stack: string[] = []): string {
  if (stack.includes(name)) throw new Error(`Token 循环引用: ${name}`);
  const raw = declarations.get(name);
  if (raw === undefined) throw new Error(`Token 不存在: ${name}`);

  const exact = raw.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (exact) return resolve(exact[1], [...stack, name]);

  return raw.replace(/var\(\s*(--[\w-]+)\s*\)/g, (_, dependency: string) =>
    resolve(dependency, [...stack, name]),
  );
}

function normalizeNumeric(value: string) {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)(rem|px)?$/);
  if (!match) throw new Error(`无法转换为数值: ${value}`);
  const number = Number(match[1]);
  return String(match[2] === "rem" ? Math.round(number * 16) : number);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
const colorCollection = manifest.variableCollections.find(
  (collection) => collection.name === "Semantic/Color",
);
if (!colorCollection) throw new Error("manifest 缺少 Semantic/Color");

if (
  !colorCollection.variables.some(
    (variable) => variable.figmaName === "color/surface/navigation",
  )
) {
  colorCollection.variables.push({
    figmaName: "color/surface/navigation",
    cssVariable: "--semantic-color-surface-navigation",
    type: "COLOR",
    value: "#23302b",
  });
}

let updated = 0;
for (const collection of manifest.variableCollections) {
  for (const variable of collection.variables) {
    const resolved = resolve(variable.cssVariable);
    const value =
      variable.type === "FLOAT"
        ? normalizeNumeric(resolved)
        : variable.type === "COLOR"
          ? resolved.toLowerCase()
          : resolved;
    if (variable.value !== value) {
      variable.value = value;
      updated += 1;
    }
  }
}

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Figma manifest synced: ${updated} values updated.`);
