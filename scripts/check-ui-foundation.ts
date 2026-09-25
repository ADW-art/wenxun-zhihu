import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type VariableType = "COLOR" | "FLOAT" | "STRING";

type FigmaVariable = {
  figmaName: string;
  cssVariable: string;
  type: VariableType;
  value: string;
};

type VariableCollection = {
  name: string;
  variables: FigmaVariable[];
};

type UiFoundationManifest = {
  version: number;
  pages: string[];
  variableCollections: VariableCollection[];
  components: Array<{
    name: string;
    code: string | null;
    states: string[];
    status: "existing" | "planned";
  }>;
  screens: Array<{
    name: string;
    route: string;
    figmaFrame: string;
    viewports: string[];
    priority: number;
  }>;
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tokensPath = path.join(root, "src", "app", "tokens.css");
const manifestPath = path.join(root, "design", "figma", "ui-foundation.manifest.json");
const sourceRoot = path.join(root, "src");

const requiredPages = [
  "00 Cover & Status",
  "01 Research & Flows",
  "02 Wireframes",
  "03 Foundations",
  "04 Components & Patterns",
  "05 Desktop Screens",
  "06 Mobile Screens",
  "07 Prototype",
  "08 Handoff & Archive",
];

const errors: string[] = [];

function fail(message: string) {
  errors.push(message);
}

function readJson<T>(file: string): T {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch (error) {
    throw new Error(
      `无法解析 ${path.relative(root, file)}: ${(error as Error).message}`,
    );
  }
}

function parseRootVariables(css: string) {
  const rootBlock = css.match(/:root\s*\{([\s\S]*?)\}\s*@theme inline/);
  if (!rootBlock) {
    throw new Error("tokens.css 缺少 :root 到 @theme inline 的 Token 区块");
  }

  const declarations = new Map<string, string>();
  const declarationPattern = /--([\w-]+)\s*:\s*([^;]+);/g;
  for (const match of rootBlock[1].matchAll(declarationPattern)) {
    declarations.set(`--${match[1]}`, match[2].trim());
  }
  return declarations;
}

function resolveVariable(
  name: string,
  declarations: Map<string, string>,
  stack: string[] = [],
): string {
  if (stack.includes(name)) {
    throw new Error(`Token 循环引用: ${[...stack, name].join(" -> ")}`);
  }
  const raw = declarations.get(name);
  if (raw === undefined) {
    throw new Error(`Token 不存在: ${name}`);
  }

  const exactReference = raw.match(/^var\((--[\w-]+)\)$/);
  if (exactReference) {
    return resolveVariable(exactReference[1], declarations, [...stack, name]);
  }

  return raw.replace(/var\((--[\w-]+)\)/g, (_, dependency: string) =>
    resolveVariable(dependency, declarations, [...stack, name]),
  );
}

function normalizeNumericValue(value: string) {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)(rem|px)?$/);
  if (!match) return null;
  const number = Number(match[1]);
  if (match[2] === "rem") return String(Math.round(number * 16));
  return String(number);
}

function walkFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const file = path.join(directory, entry);
    return statSync(file).isDirectory() ? walkFiles(file) : [file];
  });
}

function checkManifest(
  manifest: UiFoundationManifest,
  declarations: Map<string, string>,
) {
  if (manifest.version !== 1) fail("manifest.version 必须为 1");

  for (const page of requiredPages) {
    if (!manifest.pages.includes(page)) fail(`Figma 页面缺失: ${page}`);
  }

  const declaredCssVariables = new Set<string>();
  for (const collection of manifest.variableCollections) {
    for (const variable of collection.variables) {
      declaredCssVariables.add(variable.cssVariable);
      const actual = resolveVariable(variable.cssVariable, declarations);

      if (variable.type === "COLOR") {
        if (actual.toLowerCase() !== variable.value.toLowerCase()) {
          fail(
            `${variable.figmaName} 与 ${variable.cssVariable} 不一致: ${variable.value} != ${actual}`,
          );
        }
        continue;
      }

      if (variable.type === "FLOAT") {
        const numeric = normalizeNumericValue(actual);
        if (numeric === null || Number(numeric) !== Number(variable.value)) {
          fail(`${variable.figmaName} 数值不一致: ${variable.value} != ${actual}`);
        }
      }
    }
  }

  const semanticColorTokens = [...declarations.keys()].filter((name) =>
    name.startsWith("--semantic-color-"),
  );
  for (const token of semanticColorTokens) {
    if (!declaredCssVariables.has(token)) {
      fail(`Figma manifest 未声明语义色 Token: ${token}`);
    }
  }

  for (const component of manifest.components) {
    if (component.states.length === 0) {
      fail(`组件 ${component.name} 未定义状态`);
    }
    if (component.code === null) continue;
    try {
      statSync(path.join(root, component.code));
    } catch {
      fail(`组件 ${component.name} 的代码入口不存在: ${component.code}`);
    }
  }

  const routes = new Set(manifest.screens.map((screen) => screen.route));
  for (const requiredRoute of [
    "/login",
    "/dashboard",
    "/inspections/[id]",
    "/tasks/[id]",
    "/reports",
  ]) {
    if (!routes.has(requiredRoute)) {
      fail(`核心页面清单缺失路由: ${requiredRoute}`);
    }
  }
}

function checkRawStyles() {
  const forbiddenClass =
    /(?:bg|text|border|ring|from|to|via)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}/;
  const rawHex = /#[0-9a-fA-F]{3,8}/;

  for (const file of walkFiles(sourceRoot)) {
    if (!file.endsWith(".tsx")) continue;
    const relative = path.relative(root, file).replaceAll("\\", "/");
    const source = readFileSync(file, "utf8");

    if (/bg-white|text-white|shadow-\[/.test(source)) {
      fail(`${relative} 仍包含原始白色或任意阴影类`);
    }
    if (forbiddenClass.test(source)) {
      fail(`${relative} 仍包含 Tailwind 默认状态色类`);
    }
    if (rawHex.test(source)) {
      fail(`${relative} 仍包含硬编码十六进制颜色`);
    }
  }
}

const declarations = parseRootVariables(readFileSync(tokensPath, "utf8"));
const manifest = readJson<UiFoundationManifest>(manifestPath);

checkManifest(manifest, declarations);
checkRawStyles();

if (errors.length > 0) {
  console.error("UI foundation check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `UI foundation check passed: ${manifest.pages.length} pages, ${manifest.variableCollections.reduce((sum, collection) => sum + collection.variables.length, 0)} variables, ${manifest.components.length} components.`,
  );
}
