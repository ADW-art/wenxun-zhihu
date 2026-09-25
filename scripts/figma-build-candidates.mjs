import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { readFileSync } from "node:fs";

const SERVER = "D:/nodejs/node_global/node_modules/@figwright/mcp/dist/index.mjs";
const PAGE_ID = "3:6";
const ROOT_ONE = "S1 · 风险地图 | 1440×1024";
const ROOT_TWO = "S2 · 巡查总览 | 1440×1024";
const ROOT_THREE = "S3 · 巡查详情与证据工作台 | 1440×1024";
const ROOT_FOUR = "S4 · 风险复核与创建整改任务 | 1440×1024";
const ROOT_FIVE = "S5 · 整改任务详情与证据复核 | 1440×1024";
const ROOT_SIX = "S6 · 复查归档与报告中心 | 1440×1024";
const MOBILE_PAGE_ID = "3:7";
const MOBILE_ONE = "M1 · 现场巡查采集 | 375×812";
const MOBILE_TWO = "M2 · 巡查提交确认 | 375×812";
const referenceOneData = readFileSync(
  new URL("../design/references/risk-map-reference.png", import.meta.url),
).toString("base64");
const referenceTwoData = readFileSync(
  new URL("../design/references/inspection-overview-reference.png", import.meta.url),
).toString("base64");
const heritageMapData = readFileSync(
  new URL("../design/assets/heritage-risk-map-v1.png", import.meta.url),
).toString("base64");
const sidebarMotifData = readFileSync(
  new URL("../design/assets/sidebar-landscape-motif-v2.png", import.meta.url),
).toString("base64");

const client = new Client({
  name: "wenxun-figma-builder",
  version: "1.0.0",
});

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [SERVER],
});

await client.connect(transport);

let queue = [];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function call(name, args = {}) {
  const result = await client.callTool({ name, arguments: args });
  const content = result.content?.find((item) => item.type === "text");
  if (result.isError) {
    throw new Error(content?.text ?? `${name} failed`);
  }
  if (!content?.text) return result;
  try {
    return JSON.parse(content.text);
  } catch {
    return content.text;
  }
}

async function flush() {
  if (queue.length === 0) return;
  const pending = queue;
  queue = [];
  for (const op of pending) {
    await call(op.tool, op.params);
  }
  await sleep(50);
}

function push(tool, params) {
  queue.push({ tool, params });
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16) / 255,
    g: parseInt(value.slice(2, 4), 16) / 255,
    b: parseInt(value.slice(4, 6), 16) / 255,
  };
}

const variableDefinitions = await call("get_variable_defs");
const variables = new Map(
  variableDefinitions.variables.map((variable) => [variable.name, variable]),
);

function variablePaint(name, opacity = 1) {
  const variable = variables.get(name);
  const hex = variable.valuesByMode[Object.keys(variable.valuesByMode)[0]].hex;
  return {
    type: "SOLID",
    color: hexToRgb(hex),
    opacity,
    boundVariables: { color: variable.id },
  };
}

function fill(id, variableName, opacity = 1) {
  push("set_fills", {
    nodeId: id,
    fills: [variablePaint(variableName, opacity)],
  });
}

function stroke(id, variableName, weight = 1, dashPattern) {
  push("set_strokes", {
    nodeId: id,
    strokes: [variablePaint(variableName)],
    strokeWeight: weight,
    strokeAlign: "INSIDE",
    dashPattern: dashPattern ?? [],
  });
}

function radius(id, value) {
  push("set_corner_radius", { nodeId: id, radius: value });
}

function autoLayout(id, mode, options = {}) {
  push("set_auto_layout", {
    nodeId: id,
    layoutMode: mode,
    paddingTop: options.paddingTop ?? 0,
    paddingRight: options.paddingRight ?? 0,
    paddingBottom: options.paddingBottom ?? 0,
    paddingLeft: options.paddingLeft ?? 0,
    itemSpacing: options.itemSpacing ?? 0,
    primaryAxisAlignItems: options.primaryAxisAlignItems,
    counterAxisAlignItems: options.counterAxisAlignItems,
    layoutWrap: options.layoutWrap,
  });
}

async function box(parentId, name, x, y, width, height) {
  const result = await call("create_frame", {
    ...(parentId ? { parentId } : {}),
    name,
    x,
    y,
    width,
    height,
  });
  return result.nodeId;
}

async function rect(parentId, name, x, y, width, height) {
  const result = await call("create_rectangle", {
    parentId,
    name,
    x,
    y,
    width,
    height,
  });
  return result.nodeId;
}

async function ellipse(parentId, name, x, y, width, height) {
  const result = await call("create_ellipse", {
    parentId,
    name,
    x,
    y,
    width,
    height,
  });
  return result.nodeId;
}

async function imageCrop(parentId, name, data, x, y, width, height) {
  const result = await call("import_image", {
    parentId,
    name,
    data,
    x,
    y,
    width,
    height,
    scaleMode: "FILL",
  });
  return result.nodeId;
}

async function divider(parentId, name, x, y, width, height = 1) {
  const id = await rect(parentId, name, x, y, width, height);
  fill(id, "color/border/default");
  return id;
}

const textStyles = {
  display: { family: "Noto Serif SC", style: "SemiBold", size: 30, line: 40 },
  h1: { family: "Noto Serif SC", style: "SemiBold", size: 24, line: 34 },
  h2: { family: "Noto Serif SC", style: "SemiBold", size: 18, line: 28 },
  body: { family: "Noto Sans SC", style: "Regular", size: 14, line: 22 },
  small: { family: "Noto Sans SC", style: "Regular", size: 12, line: 18 },
  label: { family: "Noto Sans SC", style: "Medium", size: 12, line: 18 },
  metric: { family: "Noto Sans SC", style: "Bold", size: 22, line: 30 },
  brand: { family: "KaiTi", style: "Regular", size: 24, line: 32, letter: 0 },
  nav: { family: "Noto Serif SC", style: "SemiBold", size: 15, line: 22, letter: 0.4 },
  sidebarSub: {
    family: "Noto Serif SC",
    style: "Regular",
    size: 10,
    line: 17,
    letter: 0.8,
  },
  footer: { family: "KaiTi", style: "Regular", size: 14, line: 24, letter: 2 },
  mapProvince: {
    family: "Noto Serif SC",
    style: "SemiBold",
    size: 26,
    line: 36,
    letter: 7,
  },
  mapNeighbor: {
    family: "Noto Serif SC",
    style: "Regular",
    size: 15,
    line: 22,
    letter: 4,
  },
  mapCity: {
    family: "Noto Serif SC",
    style: "SemiBold",
    size: 13,
    line: 20,
    letter: 0.4,
  },
};

const navIconPaths = [
  `<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>`,
  `<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>`,
  `<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>`,
  `<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/>`,
  `<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>`,
  `<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>`,
];

function navIconSvg(index, strokeColor) {
  return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${navIconPaths[index]}</svg>`;
}

async function text(
  parentId,
  characters,
  x,
  y,
  width,
  styleName = "body",
  colorName = "color/text/primary",
  align = "LEFT",
) {
  const style = textStyles[styleName];
  const result = await call("create_text", {
    characters,
    parentId,
    x,
    y,
    fontSize: style.size,
  });
  push("resize_nodes", {
    nodeIds: [result.nodeId],
    width,
    height: style.line,
  });
  push("set_text_properties", {
    nodeId: result.nodeId,
    fontName: { family: style.family, style: style.style },
    fontSize: style.size,
    lineHeight: { unit: "PIXELS", value: style.line },
    letterSpacing: { unit: "PIXELS", value: style.letter ?? 0 },
    textAlignHorizontal: align,
    textAutoResize: "HEIGHT",
    textWrapStyle: "AUTO",
  });
  fill(result.nodeId, colorName);
  return result.nodeId;
}

async function labelChip(parentId, textValue, x, y, width, variant) {
  const palette = {
    high: {
      surface: "color/risk/high-surface",
      border: "color/risk/high-border",
      text: "color/risk/high-foreground",
    },
    medium: {
      surface: "color/risk/medium-surface",
      border: "color/risk/medium-border",
      text: "color/risk/medium-foreground",
    },
    success: {
      surface: "color/status/success-surface",
      border: "color/status/success-border",
      text: "color/status/success-foreground",
    },
    warning: {
      surface: "color/status/warning-surface",
      border: "color/status/warning-border",
      text: "color/status/warning-foreground",
    },
    info: {
      surface: "color/status/info-surface",
      border: "color/status/info-border",
      text: "color/status/info-foreground",
    },
  }[variant];
  const chip = await box(parentId, `Status / ${textValue}`, x, y, width, 26);
  fill(chip, palette.surface);
  stroke(chip, palette.border, 1);
  radius(chip, 4);
  autoLayout(chip, "HORIZONTAL", {
    paddingLeft: 10,
    paddingRight: 10,
    primaryAxisAlignItems: "CENTER",
    counterAxisAlignItems: "CENTER",
  });
  await text(chip, textValue, 0, 0, width - 20, "label", palette.text);
  return chip;
}

async function button(parentId, textValue, x, y, width, height = 46) {
  const id = await box(parentId, `Button / ${textValue}`, x, y, width, height);
  fill(id, "color/action/primary");
  radius(id, 4);
  autoLayout(id, "HORIZONTAL", {
    paddingLeft: 18,
    paddingRight: 18,
    primaryAxisAlignItems: "CENTER",
    counterAxisAlignItems: "CENTER",
  });
  await text(id, textValue, 0, 0, width - 36, "label", "color/text/inverse");
  return id;
}

async function sidebar(parentId, selectedIndex, width, variant = "standard") {
  const root = await box(parentId, "Sidebar", 0, 0, width, 1024);
  fill(root, "color/surface/navigation");
  const navItems = [
    "风险地图",
    "巡查总览",
    "巡查任务",
    "文物档案",
    "问题处置",
    "统计分析",
    "系统管理",
  ];

  if (variant === "compact") {
    await text(root, "文巡智护", 26, 28, width - 40, "display", "color/surface/panel");
    await text(
      root,
      "文物建筑\n智能巡查与保护整改",
      27,
      74,
      width - 42,
      "small",
      "color/surface/subtle",
    );
  } else {
    const seal = await box(root, "Brand Seal", 30, 28, 38, 38);
    stroke(seal, "color/risk/high", 2);
    radius(seal, 2);
    await text(seal, "文", 8, 7, 22, "h2", "color/risk/high");
    await text(root, "文巡智护", 78, 22, width - 78, "brand", "color/surface/panel");
    await text(
      root,
      "文物建筑\n智能巡查与保护整改",
      80,
      60,
      width - 84,
      "sidebarSub",
      "color/surface/subtle",
    );
  }

  const startY = variant === "compact" ? 176 : 148;
  const rowHeight = variant === "compact" ? 58 : 62;
  const iconColorMuted = variables.get("color/surface/subtle").valuesByMode["3:0"].hex;
  const iconColorSelected = variables.get("color/text/inverse").valuesByMode["3:0"].hex;
  for (let index = 0; index < navItems.length; index += 1) {
    const y = startY + index * rowHeight;
    const item = await box(root, `Nav / ${navItems[index]}`, 0, y, width, rowHeight);
    fill(
      item,
      index === selectedIndex ? "color/action/primary" : "color/surface/navigation",
    );
    if (index === selectedIndex) {
      const accent = await rect(item, "Selected Accent", 0, 0, 4, rowHeight);
      fill(accent, "color/status/warning");
    }
    const icon = await call("import_svg", {
      svg: navIconSvg(
        Math.min(index, navIconPaths.length - 1),
        index === selectedIndex ? iconColorSelected : iconColorMuted,
      ),
      name: `Icon / ${navItems[index]}`,
      parentId: item,
      x: 27,
      y: (rowHeight - 20) / 2,
      width: 20,
      height: 20,
    });
    await call("set_opacity", {
      nodeId: icon.nodeId,
      opacity: index === selectedIndex ? 1 : 0.82,
    });
    await text(
      item,
      navItems[index],
      64,
      (rowHeight - 22) / 2,
      width - 76,
      "nav",
      index === selectedIndex ? "color/text/inverse" : "color/surface/subtle",
    );
  }

  const footerY = variant === "compact" ? 604 : 600;
  const motif = await imageCrop(
    root,
    "Sidebar Heritage Landscape / 山水草木亭塔暗纹",
    sidebarMotifData,
    0,
    footerY,
    width,
    410,
  );
  await call("set_opacity", { nodeId: motif, opacity: 0.16 });
  const motto = await box(root, "Sidebar Footer Motto", 0, 938, width, 60);
  autoLayout(motto, "VERTICAL", {
    itemSpacing: 0,
    primaryAxisAlignItems: "CENTER",
    counterAxisAlignItems: "CENTER",
  });
  await text(
    motto,
    "保护文化遗产",
    0,
    0,
    150,
    "footer",
    "color/surface/subtle",
    "CENTER",
  );
  await text(
    motto,
    "守住历史根脉",
    0,
    0,
    150,
    "footer",
    "color/surface/subtle",
    "CENTER",
  );
  return root;
}

async function riskTopBar(root, width) {
  const top = await box(root, "Top Bar", 0, 0, width, 64);
  fill(top, "color/surface/page");
  await divider(top, "Bottom Divider", 0, 63, width, 1);
  await text(top, "文物建筑风险地图", 26, 15, 300, "h1", "color/text/primary");

  const search = await box(top, "Search", 350, 12, 238, 40);
  fill(search, "color/surface/panel");
  stroke(search, "color/border/default", 1);
  radius(search, 4);
  const searchIcon = await ellipse(search, "Search Icon", 14, 13, 14, 14);
  stroke(searchIcon, "color/text/primary", 1.5);
  await text(search, "搜索文物点位", 42, 9, 176, "body", "color/text/secondary");

  const filters = await box(top, "Filters", 610, 12, 250, 40);
  fill(filters, "color/surface/panel");
  stroke(filters, "color/border/default", 1);
  radius(filters, 4);
  const labels = ["全部", "高风险", "待复查"];
  for (let i = 0; i < labels.length; i += 1) {
    const item = await box(
      filters,
      `Filter / ${labels[i]}`,
      i * 83,
      0,
      i === 2 ? 84 : 83,
      40,
    );
    if (i === 0) fill(item, "color/action/primary");
    if (i > 0) await divider(filters, `Filter Divider ${i}`, i * 83, 0, 1, 40);
    await text(
      item,
      labels[i],
      0,
      9,
      83,
      "body",
      i === 0 ? "color/text/inverse" : "color/text/primary",
    );
  }

  await text(
    top,
    "▣  2026年9月25日 ⌄",
    width - 206,
    18,
    184,
    "body",
    "color/text/primary",
  );
  return top;
}

async function overviewHeader(root, width) {
  const header = await box(root, "Overview Header", 0, 0, width, 158);
  fill(header, "color/surface/page");
  await text(header, "巡查总览", 38, 26, 190, "display", "color/text/primary");
  await divider(header, "Title Divider", 224, 32, 1, 30);
  await text(
    header,
    "2026年9月25日    星期五",
    246,
    38,
    220,
    "body",
    "color/text/secondary",
  );
  await text(header, "♧", width - 168, 28, 24, "h2", "color/text/primary");
  const avatar = await ellipse(header, "User Avatar", width - 126, 22, 38, 38);
  fill(avatar, "color/surface/subtle");
  stroke(avatar, "color/border/default", 1);
  await text(header, "李文博 ⌄", width - 80, 30, 76, "body", "color/text/primary");
  await divider(header, "Header Rule", 38, 84, width - 210, 1);

  const metrics = [
    ["▤", "今日巡查", "12", "color/action/primary"],
    ["◷", "待整改", "7", "color/status/warning"],
    ["△", "逾期", "2", "color/risk/high"],
  ];
  for (let i = 0; i < metrics.length; i += 1) {
    const x = 38 + i * 188;
    await text(header, metrics[i][0], x, 103, 28, "h2", metrics[i][3]);
    await text(header, metrics[i][1], x + 42, 105, 74, "body", "color/text/primary");
    await text(header, metrics[i][2], x + 122, 96, 48, "metric", metrics[i][3]);
    if (i < 2) await divider(header, `Metric Divider ${i + 1}`, x + 170, 100, 1, 28);
  }
  await button(header, "＋  发起巡查", width - 150, 68, 126, 48);
  return header;
}

async function riskMap() {
  const old = await call("search_nodes", { name: ROOT_ONE, root: PAGE_ID });
  if (old.nodes?.length) {
    await call("delete_nodes", { nodeIds: old.nodes.map((node) => node.id) });
  }

  const root = await box(PAGE_ID, ROOT_ONE, 0, 0, 1440, 1024);
  fill(root, "color/surface/page");
  stroke(root, "color/border/default", 1);

  await sidebar(root, 0, 192, "standard");
  const main = await box(root, "Main", 192, 0, 1248, 1024);
  fill(main, "color/surface/page");
  await riskTopBar(main, 1248);

  const map = await box(main, "Map Canvas", 0, 64, 716, 960);
  fill(map, "color/surface/subtle");
  stroke(map, "color/border/default", 1);
  await imageCrop(
    map,
    "古朴文保风险地图底图 / AI 重绘 / 不用于定位",
    heritageMapData,
    0,
    0,
    716,
    960,
  );
  const provinceLabels = [
    [108, 42, "内蒙古自治区"],
    [610, 302, "河北省"],
    [22, 522, "陕西省"],
    [488, 900, "河南省"],
  ];
  for (const [x, y, value] of provinceLabels)
    await text(map, value, x, y, 160, "mapNeighbor", "color/text/secondary");
  await text(map, "山西省", 288, 338, 210, "mapProvince", "color/action/primary");

  const cityLabels = [
    [466, 108, "大同市"],
    [372, 178, "朔州市"],
    [334, 274, "忻州市"],
    [542, 382, "阳泉市"],
    [380, 448, "太原市"],
    [198, 484, "吕梁市"],
    [438, 552, "晋中市"],
    [488, 666, "长治市"],
    [254, 718, "临汾市"],
    [402, 798, "晋城市"],
    [176, 856, "运城市"],
  ];
  for (const [x, y, value] of cityLabels)
    await text(map, value, x, y, 82, "mapCity", "color/text/primary");

  const pointColors = ["color/risk/low", "color/risk/medium", "color/risk/high"];
  const points = [
    [208, 138, 0],
    [292, 112, 1],
    [366, 152, 2],
    [446, 126, 0],
    [516, 206, 1],
    [256, 226, 0],
    [338, 210, 2],
    [432, 246, 1],
    [180, 300, 2],
    [270, 326, 0],
    [350, 294, 0],
    [470, 320, 0],
    [536, 350, 1],
    [226, 404, 1],
    [318, 382, 2],
    [418, 410, 0],
    [516, 432, 2],
    [194, 492, 0],
    [286, 468, 1],
    [392, 500, 0],
    [476, 534, 2],
    [230, 580, 2],
    [330, 558, 0],
    [424, 594, 1],
    [526, 620, 0],
    [202, 672, 1],
    [290, 650, 0],
    [374, 690, 2],
    [470, 674, 0],
    [250, 754, 1],
    [340, 732, 0],
    [446, 776, 2],
    [518, 736, 1],
    [316, 834, 2],
    [406, 818, 0],
    [492, 844, 0],
  ];
  for (let index = 0; index < points.length; index += 1) {
    const [x, y, colorIndex] = points[index];
    const marker = await ellipse(map, `Risk Marker ${index + 1}`, x, y, 12, 12);
    fill(marker, pointColors[colorIndex]);
    stroke(marker, "color/surface/panel", 2);
  }
  const selected = await ellipse(map, "Selected Marker", 428, 472, 30, 30);
  fill(selected, "color/risk/high");
  stroke(selected, "color/surface/panel", 4);
  const selectedLabel = await box(map, "Selected Label", 456, 466, 176, 38);
  fill(selectedLabel, "color/risk/high");
  radius(selectedLabel, 4);
  await text(
    selectedLabel,
    "示范木构院落 A-01",
    14,
    8,
    150,
    "label",
    "color/text/inverse",
  );

  const legend = await box(map, "Legend", 18, 818, 140, 104);
  fill(legend, "color/surface/panel", 0.94);
  stroke(legend, "color/border/default", 1);
  radius(legend, 4);
  const legendRows = [
    ["高风险", "12", "color/risk/high"],
    ["中风险", "28", "color/risk/medium"],
    ["正常", "246", "color/risk/low"],
  ];
  for (let i = 0; i < legendRows.length; i += 1) {
    const dot = await ellipse(legend, `Legend Dot ${i + 1}`, 14, 16 + i * 28, 10, 10);
    fill(dot, legendRows[i][2]);
    await text(
      legend,
      legendRows[i][0],
      34,
      10 + i * 28,
      66,
      "small",
      "color/text/primary",
    );
    await text(
      legend,
      legendRows[i][1],
      106,
      10 + i * 28,
      26,
      "small",
      "color/text/secondary",
    );
  }
  const controls = await box(map, "Map Controls", 664, 764, 36, 118);
  fill(controls, "color/surface/panel");
  stroke(controls, "color/border/default", 1);
  radius(controls, 4);
  await text(controls, "+", 9, 4, 20, "h2", "color/text/primary");
  await divider(controls, "Control Divider 1", 0, 38, 36, 1);
  await text(controls, "−", 10, 42, 20, "h2", "color/text/primary");
  await divider(controls, "Control Divider 2", 0, 78, 36, 1);
  await text(controls, "◎", 8, 84, 20, "h2", "color/text/primary");
  const summary = await box(map, "Map Summary", 18, 930, 372, 30);
  fill(summary, "color/surface/panel", 0.94);
  radius(summary, 4);
  await text(
    summary,
    "在管点位 286  ·  今日新增风险 5  ·  待复核 11",
    12,
    4,
    348,
    "small",
    "color/text/primary",
  );
  await text(
    map,
    "示意地图 · 不展示精确坐标",
    514,
    934,
    184,
    "small",
    "color/text/secondary",
  );

  const detail = await box(main, "Risk Detail", 716, 64, 532, 960);
  fill(detail, "color/surface/panel");
  stroke(detail, "color/border/default", 1);
  const hero = await box(detail, "Heritage Photo / Reference Demo", 0, 0, 532, 252);
  fill(hero, "color/surface/subtle");
  await imageCrop(
    hero,
    "参考图演示素材 / 城墙",
    referenceOneData,
    -1006,
    -70,
    1608,
    1144,
  );
  const photoLabel = await box(hero, "Demo Material Label", 14, 214, 190, 26);
  fill(photoLabel, "color/surface/panel", 0.9);
  radius(photoLabel, 3);
  await text(
    photoLabel,
    "参考图演示素材 · 非真实证据",
    8,
    4,
    174,
    "small",
    "color/text/secondary",
  );

  await text(detail, "示范木构院落 A-01", 26, 270, 330, "h1", "color/text/primary");
  const high = await box(detail, "Status / 高风险", 422, 270, 82, 30);
  fill(high, "color/risk/high");
  radius(high, 4);
  await text(high, "高风险", 16, 6, 54, "label", "color/text/inverse");
  await text(
    detail,
    "⌖ 华北地区某历史文化街区    ▱ 清代木构建筑",
    26,
    314,
    456,
    "small",
    "color/text/secondary",
  );

  const aiPanel = await box(detail, "Latest Inspection Result", 26, 346, 480, 78);
  fill(aiPanel, "color/risk/high-surface");
  radius(aiPanel, 4);
  await text(
    aiPanel,
    "最近巡查（AI初判）",
    14,
    10,
    150,
    "small",
    "color/text/secondary",
  );
  await divider(aiPanel, "AI Divider 1", 188, 10, 1, 56);
  await text(aiPanel, "AI 识别结果", 208, 10, 110, "small", "color/text/secondary");
  await text(
    aiPanel,
    "墙体裂缝、潮湿盐析",
    208,
    36,
    190,
    "h2",
    "color/risk/high-foreground",
  );
  await divider(aiPanel, "AI Divider 2", 396, 10, 1, 56);
  await text(aiPanel, "置信度", 412, 10, 54, "small", "color/text/secondary");
  await text(aiPanel, "92%", 410, 34, 58, "metric", "color/risk/high-foreground");

  await text(detail, "现场证据（3）", 26, 440, 130, "h2", "color/text/primary");
  await text(detail, "查看全部  ›", 430, 446, 78, "small", "color/action/primary");
  const evidence = [
    [26, 474, 967, "北段墙体裂缝"],
    [188, 474, 1138, "砖体风化剥落"],
    [350, 474, 1307, "檐部构件裂隙"],
  ];
  for (let i = 0; i < evidence.length; i += 1) {
    const [x, y, sourceX, caption] = evidence[i];
    const card = await box(detail, `Evidence Card ${i + 1}`, x, y, 152, 126);
    fill(card, "color/surface/panel");
    const imageFrame = await box(card, "Image", 0, 0, 152, 82);
    radius(imageFrame, 3);
    await imageCrop(
      imageFrame,
      `Evidence Image ${i + 1}`,
      referenceOneData,
      -sourceX,
      -535,
      1500,
      1067,
    );
    await text(card, caption, 0, 88, 152, "small", "color/text/primary");
    await text(
      card,
      "2026-09-25 10:3" + (i + 1),
      0,
      108,
      152,
      "small",
      "color/text/secondary",
    );
  }
  await button(detail, "▤   进入巡查记录    ›", 26, 622, 480, 48);

  await text(detail, "处置进度", 26, 690, 110, "h2", "color/text/primary");
  const progress = [
    ["AI 初判", "已识别风险并生成草案", "已完成", "success"],
    ["待复核人员确认", "核对证据与规范来源", "进行中", "warning"],
    ["待生成整改任务", "确认后指定责任人与期限", "待处理", "info"],
  ];
  for (let i = 0; i < progress.length; i += 1) {
    const y = 730 + i * 68;
    if (i < 2) await divider(detail, `Timeline Line ${i + 1}`, 35, y + 14, 1, 58);
    const dot = await ellipse(detail, `Timeline Dot ${i + 1}`, 29, y + 6, 14, 14);
    fill(dot, i === 0 ? "color/risk/high" : "color/surface/panel");
    stroke(dot, i === 0 ? "color/risk/high-border" : "color/border/strong", 1.5);
    await text(detail, progress[i][0], 60, y, 210, "label", "color/text/primary");
    await text(
      detail,
      progress[i][1],
      60,
      y + 24,
      260,
      "small",
      "color/text/secondary",
    );
    await labelChip(detail, progress[i][2], 418, y, 78, progress[i][3]);
  }

  await flush();
  return root;
}

async function overview() {
  const old = await call("search_nodes", { name: ROOT_TWO, root: PAGE_ID });
  if (old.nodes?.length) {
    await call("delete_nodes", { nodeIds: old.nodes.map((node) => node.id) });
  }

  const root = await box(PAGE_ID, ROOT_TWO, 0, 1120, 1440, 1024);
  fill(root, "color/surface/page");
  stroke(root, "color/border/default", 1);

  await sidebar(root, 1, 192, "standard");
  const main = await box(root, "Main", 192, 0, 1248, 1024);
  fill(main, "color/surface/page");
  await overviewHeader(main, 1248);

  const feature = await box(main, "Featured Inspection", 22, 158, 1204, 548);
  fill(feature, "color/surface/panel");
  await divider(feature, "Feature Top Divider", 0, 0, 1204, 1);
  await divider(feature, "Feature Bottom Divider", 0, 547, 1204, 1);
  const photo = await box(
    feature,
    "Featured Heritage Photo / Reference Demo",
    0,
    0,
    658,
    548,
  );
  fill(photo, "color/surface/subtle");
  await imageCrop(
    photo,
    "参考图演示素材 / 古建筑墙体",
    referenceTwoData,
    -223,
    -163,
    1500,
    1067,
  );
  const sourceNote = await box(photo, "Demo Material Label", 18, 506, 176, 26);
  fill(sourceNote, "color/surface/panel", 0.9);
  radius(sourceNote, 3);
  await text(
    sourceNote,
    "参考图演示素材 · 非真实证据",
    8,
    4,
    160,
    "small",
    "color/text/secondary",
  );
  const info = await box(feature, "Inspection Information", 658, 0, 546, 548);
  fill(info, "color/surface/panel");
  await text(
    info,
    "华北地区  ›  某历史文化街区",
    26,
    18,
    310,
    "small",
    "color/text/secondary",
  );
  await text(
    info,
    "编号：WX-A01-20260925",
    356,
    18,
    168,
    "small",
    "color/text/secondary",
  );
  await text(info, "示范木构院落 A-01", 26, 58, 332, "display", "color/text/primary");
  const risk = await box(info, "Status / 高风险", 416, 54, 90, 36);
  fill(risk, "color/risk/high");
  radius(risk, 4);
  await text(risk, "高风险", 18, 7, 56, "body", "color/text/inverse");
  await text(
    info,
    "墙脚出现新增裂缝与潮湿盐析线索。AI 仅生成风险草案，需由复核人员结合原始证据和规范来源确认。",
    26,
    110,
    486,
    "body",
    "color/text/secondary",
  );
  await divider(info, "Info Divider 1", 26, 168, 486, 1);
  await text(info, "发现问题", 26, 182, 90, "label", "color/text/primary");
  await text(info, "◇", 28, 216, 26, "h2", "color/risk/high");
  await text(info, "墙体裂缝", 62, 208, 104, "label", "color/text/primary");
  await text(
    info,
    "新增纵向裂缝线索，待人工测量",
    62,
    232,
    220,
    "small",
    "color/text/secondary",
  );
  await text(info, "♢", 28, 272, 26, "h2", "color/status/warning");
  await text(info, "潮湿盐析", 62, 264, 104, "label", "color/text/primary");
  await text(info, "墙脚水渍与盐析结晶", 62, 288, 220, "small", "color/text/secondary");
  await divider(info, "Confidence Divider", 350, 184, 1, 112);
  await text(info, "AI 识别置信度", 370, 184, 130, "label", "color/text/primary");
  await text(info, "92%", 370, 218, 90, "display", "color/text/primary");
  const confTrack = await rect(info, "Confidence Track", 370, 264, 134, 10);
  fill(confTrack, "color/surface/subtle");
  radius(confTrack, 5);
  const confFill = await rect(info, "Confidence Fill", 370, 264, 123, 10);
  fill(confFill, "color/action/primary");
  radius(confFill, 5);
  await divider(info, "Info Divider 2", 26, 316, 486, 1);
  await text(info, "参考依据", 26, 330, 86, "label", "color/text/primary");
  await text(
    info,
    "▧  PROJECT-RULES-V1 · DEMO-STRUCT-01  结构异常线索记录\n▧  PROJECT-RULES-V1 · DEMO-WATER-01   排水与渗漏巡查",
    26,
    356,
    486,
    "small",
    "color/text/secondary",
  );
  await text(info, "现场照片（3）", 26, 414, 110, "label", "color/text/primary");
  const thumbs = [
    [26, 440, 908],
    [132, 440, 1017],
    [238, 440, 1126],
  ];
  for (let i = 0; i < thumbs.length; i += 1) {
    const thumb = await box(
      info,
      `Photo Thumbnail ${i + 1}`,
      thumbs[i][0],
      thumbs[i][1],
      96,
      70,
    );
    radius(thumb, 3);
    await imageCrop(
      thumb,
      `Thumbnail Image ${i + 1}`,
      referenceTwoData,
      -thumbs[i][2],
      -636,
      1500,
      1067,
    );
  }
  await button(info, "▤   审阅风险草案   ›", 350, 432, 162, 76);

  const table = await box(main, "Pending Inspection Table", 22, 724, 1204, 278);
  fill(table, "color/surface/panel");
  await text(table, "待处理巡查", 0, 8, 156, "h1", "color/text/primary");
  await text(table, "（共 4 条）", 156, 13, 90, "body", "color/text/secondary");
  await text(table, "查看全部  ›", 1114, 14, 90, "small", "color/action/primary");
  const columns = [
    { title: "点位", x: 18, width: 300 },
    { title: "问题", x: 322, width: 250 },
    { title: "风险", x: 574, width: 120 },
    { title: "负责人", x: 704, width: 128 },
    { title: "截止时间", x: 842, width: 140 },
    { title: "状态", x: 1000, width: 106 },
  ];
  const header = await box(table, "Table Header", 0, 52, 1204, 38);
  fill(header, "color/surface/subtle");
  for (const column of columns)
    await text(
      header,
      column.title,
      column.x,
      9,
      column.width,
      "small",
      "color/text/secondary",
    );
  const rows = [
    [
      "示范木构院落 A-01",
      "墙体裂缝 / 潮湿盐析",
      "高风险",
      "王建国",
      "2026-09-28",
      "待整改",
    ],
    [
      "示范砖石会馆 B-02",
      "砖体风化 / 局部脱落",
      "高风险",
      "张丽",
      "2026-09-27",
      "待整改",
    ],
    [
      "示范石构遗址 C-03",
      "渗水痕迹 / 彩绘起甲",
      "中风险",
      "刘强",
      "2026-09-30",
      "处理中",
    ],
    [
      "示范近代建筑 D-04",
      "构件槽朽 / 油饰剥落",
      "中风险",
      "陈敏",
      "2026-09-29",
      "待复核",
    ],
  ];
  for (let i = 0; i < rows.length; i += 1) {
    const row = await box(table, `Task Row ${i + 1}`, 0, 90 + i * 46, 1204, 46);
    fill(row, "color/surface/panel");
    await divider(row, "Row Divider", 0, 45, 1204, 1);
    const thumb = await box(row, "Point Thumbnail", 16, 6, 56, 34);
    await imageCrop(
      thumb,
      "Reference Demo Thumbnail",
      referenceTwoData,
      -223,
      -163,
      1500,
      1067,
    );
    await text(row, rows[i][0], 82, 12, 226, "label", "color/text/primary");
    await text(row, rows[i][1], 322, 12, 238, "small", "color/text/primary");
    await labelChip(
      row,
      rows[i][2],
      574,
      10,
      74,
      rows[i][2] === "高风险" ? "high" : "medium",
    );
    await text(row, rows[i][3], 704, 12, 110, "small", "color/text/primary");
    await text(row, rows[i][4], 842, 12, 126, "small", "color/text/primary");
    await labelChip(
      row,
      rows[i][5],
      1000,
      10,
      74,
      rows[i][5] === "处理中" ? "info" : "warning",
    );
    await text(row, "›", 1174, 10, 20, "h2", "color/text/secondary");
  }

  await flush();
  return root;
}

async function removeNamedRoot(pageId, name) {
  const old = await call("search_nodes", { name, root: pageId });
  if (old.nodes?.length) {
    await call("delete_nodes", { nodeIds: old.nodes.map((node) => node.id) });
  }
}

async function desktopShell(name, y, selectedIndex, title, meta, status, variant) {
  await removeNamedRoot(PAGE_ID, name);
  const root = await box(PAGE_ID, name, 0, y, 1440, 1024);
  fill(root, "color/surface/page");
  stroke(root, "color/border/default", 1);
  await sidebar(root, selectedIndex, 192, "standard");
  const main = await box(root, "Main", 192, 0, 1248, 1024);
  fill(main, "color/surface/page");
  const header = await box(main, "Page Header", 0, 0, 1248, 112);
  fill(header, "color/surface/page");
  await text(header, title, 34, 24, 600, "display", "color/text/primary");
  await text(header, meta, 36, 70, 720, "small", "color/text/secondary");
  await labelChip(header, status, 1086, 28, 108, variant);
  await divider(header, "Header Rule", 34, 110, 1160, 1);
  return { root, main };
}

async function sectionHeading(parentId, titleValue, meta, x, y, width) {
  await text(parentId, titleValue, x, y, width, "h2", "color/text/primary");
  if (meta) {
    await text(parentId, meta, x, y + 30, width, "small", "color/text/secondary");
  }
}

async function evidencePhoto(
  parentId,
  name,
  x,
  y,
  width,
  height,
  sourceX = -220,
  sourceY = -160,
) {
  const frame = await box(parentId, name, x, y, width, height);
  fill(frame, "color/surface/subtle");
  stroke(frame, "color/border/default", 1);
  radius(frame, 3);
  await imageCrop(
    frame,
    "参考图演示素材 / 非真实证据",
    referenceTwoData,
    sourceX,
    sourceY,
    1500,
    1067,
  );
  const note = await box(frame, "Demo Material Label", 14, height - 34, 184, 24);
  fill(note, "color/surface/panel", 0.92);
  radius(note, 3);
  await text(
    note,
    "参考图演示素材 · 非真实证据",
    8,
    3,
    168,
    "small",
    "color/text/secondary",
  );
  return frame;
}

async function outlineButton(parentId, textValue, x, y, width, height = 44) {
  const id = await box(parentId, `Button / ${textValue}`, x, y, width, height);
  fill(id, "color/surface/panel");
  stroke(id, "color/action/primary", 1);
  radius(id, 4);
  autoLayout(id, "HORIZONTAL", {
    paddingLeft: 14,
    paddingRight: 14,
    primaryAxisAlignItems: "CENTER",
    counterAxisAlignItems: "CENTER",
  });
  await text(id, textValue, 0, 0, width - 28, "label", "color/action/primary");
  return id;
}

async function inspectionWorkbench() {
  const { root, main } = await desktopShell(
    ROOT_THREE,
    2240,
    2,
    "巡查详情 · 证据工作台",
    "巡查编号 WX-20260925-001  ·  示范木构院落 A-01  ·  执行人 刘强  ·  2026年9月25日",
    "待人工复核",
    "warning",
  );

  const steps = await box(main, "Inspection Steps", 34, 130, 1160, 62);
  fill(steps, "color/surface/panel");
  stroke(steps, "color/border/default", 1);
  radius(steps, 4);
  const stepItems = [
    ["01", "现场记录", "已完成"],
    ["02", "AI 初判", "已完成"],
    ["03", "人工复核", "当前步骤"],
    ["04", "整改闭环", "待开始"],
  ];
  for (let i = 0; i < stepItems.length; i += 1) {
    const x = 24 + i * 284;
    const dot = await ellipse(steps, `Step ${i + 1}`, x, 17, 28, 28);
    fill(dot, i < 3 ? "color/action/primary" : "color/surface/subtle");
    await text(
      steps,
      stepItems[i][0],
      x + 6,
      21,
      18,
      "small",
      i < 3 ? "color/text/inverse" : "color/text/secondary",
    );
    await text(steps, stepItems[i][1], x + 40, 11, 90, "label", "color/text/primary");
    await text(steps, stepItems[i][2], x + 40, 33, 90, "small", "color/text/secondary");
    if (i < 3) await divider(steps, `Step Line ${i + 1}`, x + 154, 30, 106, 1);
  }

  const left = await box(main, "Original Evidence", 34, 214, 626, 772);
  fill(left, "color/surface/panel");
  stroke(left, "color/border/default", 1);
  radius(left, 4);
  await sectionHeading(
    left,
    "原始证据",
    "现场照片、观察记录和环境信息保持原始顺序",
    22,
    18,
    420,
  );
  await evidencePhoto(left, "Primary Evidence", 22, 76, 582, 430);
  const thumbXs = [22, 134, 246, 358];
  for (let i = 0; i < thumbXs.length; i += 1) {
    const thumb = await box(
      left,
      `Evidence Thumbnail ${i + 1}`,
      thumbXs[i],
      522,
      98,
      66,
    );
    await imageCrop(
      thumb,
      `Evidence ${i + 1}`,
      referenceTwoData,
      -220 - i * 170,
      -162,
      1500,
      1067,
    );
    stroke(
      thumb,
      i === 0 ? "color/action/primary" : "color/border/default",
      i === 0 ? 2 : 1,
    );
    radius(thumb, 3);
  }
  await labelChip(left, "照片 4", 492, 542, 88, "info");
  await divider(left, "Evidence Divider", 22, 610, 582, 1);
  await text(left, "现场观察", 22, 630, 90, "label", "color/text/primary");
  await text(
    left,
    "北侧山墙墙脚出现纵向裂缝线索，局部伴随潮湿痕迹；裂缝宽度尚未完成工具测量。",
    22,
    658,
    570,
    "body",
    "color/text/secondary",
  );
  await text(
    left,
    "天气：小雨后转阴   ·   环境：墙脚潮湿   ·   定位：仅记录建筑内相对位置",
    22,
    718,
    570,
    "small",
    "color/text/secondary",
  );

  const right = await box(main, "AI Draft And Review Entry", 682, 214, 512, 772);
  fill(right, "color/surface/panel");
  stroke(right, "color/border/default", 1);
  radius(right, 4);
  await sectionHeading(
    right,
    "AI 风险草案",
    "模型输出仅供复核，不作为最终文保结论",
    22,
    18,
    400,
  );
  const warning = await box(right, "AI Limitation", 22, 76, 468, 58);
  fill(warning, "color/status/warning-surface");
  stroke(warning, "color/status/warning-border", 1);
  radius(warning, 4);
  await text(
    warning,
    "需人工确认：缺少裂缝宽度测量，风险等级仍可能调整。",
    14,
    17,
    438,
    "body",
    "color/status/warning-foreground",
  );
  await text(right, "初判问题", 22, 158, 100, "label", "color/text/secondary");
  await text(
    right,
    "墙体裂缝线索 / 潮湿盐析线索",
    22,
    186,
    330,
    "h2",
    "color/risk/high-foreground",
  );
  await labelChip(right, "高风险草案", 370, 182, 118, "high");
  await text(right, "置信度", 22, 232, 80, "small", "color/text/secondary");
  await text(right, "92%", 22, 254, 80, "metric", "color/text/primary");
  const track = await rect(right, "Confidence Track", 102, 266, 356, 10);
  fill(track, "color/surface/subtle");
  radius(track, 5);
  const progress = await rect(right, "Confidence Value", 102, 266, 328, 10);
  fill(progress, "color/action/primary");
  radius(progress, 5);
  await divider(right, "Draft Divider", 22, 306, 468, 1);
  await text(right, "可审阅依据", 22, 326, 110, "label", "color/text/primary");
  await text(
    right,
    "PROJECT-RULES-V1 · DEMO-STRUCT-01\n结构异常线索记录与人工复核要求",
    22,
    358,
    452,
    "body",
    "color/text/secondary",
  );
  await text(
    right,
    "PROJECT-RULES-V1 · DEMO-WATER-01\n排水、渗漏与潮湿线索巡查要求",
    22,
    420,
    452,
    "body",
    "color/text/secondary",
  );
  await divider(right, "Run Divider", 22, 488, 468, 1);
  await text(right, "智能体运行记录", 22, 508, 130, "label", "color/text/primary");
  await text(
    right,
    "ANALYZE_FINDINGS  ·  已完成  ·  12.4s\n检索 2 条项目规则；输出已通过结构化校验。",
    22,
    538,
    452,
    "small",
    "color/text/secondary",
  );
  await outlineButton(right, "要求补充证据", 22, 662, 176, 48);
  await button(right, "进入风险复核  ›", 214, 662, 274, 48);
  await text(
    right,
    "复核操作仅对复核人员和管理员开放",
    22,
    724,
    360,
    "small",
    "color/text/secondary",
  );
  await flush();
  return root;
}

async function riskReview() {
  const { root, main } = await desktopShell(
    ROOT_FOUR,
    3360,
    4,
    "风险复核 · 创建整改任务",
    "发现项 F-20260925-03  ·  来源巡查 WX-20260925-001  ·  当前复核人 李文博",
    "高风险草案",
    "high",
  );
  const left = await box(main, "Evidence And Basis", 34, 132, 420, 854);
  fill(left, "color/surface/panel");
  stroke(left, "color/border/default", 1);
  radius(left, 4);
  await sectionHeading(
    left,
    "原始证据与依据",
    "先核对证据，再决定是否确认风险",
    20,
    18,
    360,
  );
  await evidencePhoto(left, "Review Evidence", 20, 76, 380, 270, -300, -170);
  await text(left, "现场描述", 20, 372, 90, "label", "color/text/primary");
  await text(
    left,
    "北侧山墙墙脚出现新增纵向裂缝线索，伴随潮湿盐析；缺少工具测量值。",
    20,
    402,
    380,
    "body",
    "color/text/secondary",
  );
  await divider(left, "Basis Divider", 20, 472, 380, 1);
  await text(left, "引用依据", 20, 494, 90, "label", "color/text/primary");
  await text(
    left,
    "PROJECT-RULES-V1 · DEMO-STRUCT-01\nPROJECT-RULES-V1 · DEMO-WATER-01",
    20,
    526,
    380,
    "body",
    "color/action/primary",
  );
  await text(
    left,
    "引用为项目演示规则，可追溯到知识库源文件。",
    20,
    588,
    380,
    "small",
    "color/text/secondary",
  );
  await divider(left, "History Divider", 20, 630, 380, 1);
  await text(left, "处理历史", 20, 652, 90, "label", "color/text/primary");
  await text(
    left,
    "10:32  刘强提交巡查\n10:33  AI 完成风险草案\n10:41  李文博开始复核",
    20,
    684,
    360,
    "body",
    "color/text/secondary",
  );

  const center = await box(main, "Human Review Decision", 474, 132, 360, 854);
  fill(center, "color/surface/panel");
  stroke(center, "color/border/default", 1);
  radius(center, 4);
  await sectionHeading(center, "人工复核决定", "模型草案不能绕过人工确认", 20, 18, 320);
  const options = [
    ["确认风险", "证据足以确认，进入整改任务创建"],
    ["要求补充证据", "退回巡查人员补拍或补测"],
    ["驳回草案", "说明不构成风险的理由"],
  ];
  for (let i = 0; i < options.length; i += 1) {
    const card = await box(
      center,
      `Decision / ${options[i][0]}`,
      20,
      82 + i * 82,
      320,
      66,
    );
    fill(card, i === 0 ? "color/status/success-surface" : "color/surface/page");
    stroke(card, i === 0 ? "color/status/success-border" : "color/border/default", 1);
    radius(card, 4);
    const radio = await ellipse(card, "Radio", 14, 18, 16, 16);
    fill(radio, i === 0 ? "color/action/primary" : "color/surface/panel");
    stroke(radio, i === 0 ? "color/action/primary" : "color/border/strong", 1);
    await text(card, options[i][0], 42, 10, 140, "label", "color/text/primary");
    await text(card, options[i][1], 42, 34, 260, "small", "color/text/secondary");
  }
  await text(center, "确认后的风险等级", 20, 346, 180, "label", "color/text/primary");
  const select = await box(center, "Risk Select", 20, 378, 320, 44);
  fill(select, "color/surface/page");
  stroke(select, "color/border/default", 1);
  radius(select, 4);
  await text(select, "高风险", 12, 11, 250, "body", "color/risk/high-foreground");
  await text(select, "⌄", 292, 10, 16, "body", "color/text/secondary");
  await text(center, "复核意见（必填）", 20, 448, 180, "label", "color/text/primary");
  const reviewNote = await box(center, "Review Note", 20, 480, 320, 134);
  fill(reviewNote, "color/surface/page");
  stroke(reviewNote, "color/border/default", 1);
  radius(reviewNote, 4);
  await text(
    reviewNote,
    "现场证据显示裂缝与潮湿线索同时存在。确认高风险，要求先补测裂缝宽度并采取临时防雨措施。",
    12,
    12,
    294,
    "body",
    "color/text/primary",
  );
  const audit = await box(center, "Audit Note", 20, 646, 320, 84);
  fill(audit, "color/status/info-surface");
  radius(audit, 4);
  await text(
    audit,
    "复核人、时间、决定和理由将写入审计记录，确认后不可静默覆盖。",
    12,
    14,
    294,
    "small",
    "color/status/info-foreground",
  );

  const right = await box(main, "Rectification Task Draft", 854, 132, 340, 854);
  fill(right, "color/surface/panel");
  stroke(right, "color/border/default", 1);
  radius(right, 4);
  await sectionHeading(right, "整改任务草案", "确认风险后同步创建", 20, 18, 300);
  const fields = [
    ["任务标题", "补测裂缝并完成临时防雨处置"],
    ["责任人", "王建国  ·  整改人员"],
    ["截止时间", "2026年9月28日 18:00"],
    ["验收要求", "补充测量照片、处置前后对比及说明"],
  ];
  for (let i = 0; i < fields.length; i += 1) {
    const y = 82 + i * 96;
    await text(right, fields[i][0], 20, y, 110, "label", "color/text/secondary");
    const field = await box(
      right,
      `Field / ${fields[i][0]}`,
      20,
      y + 28,
      300,
      i === 3 ? 68 : 44,
    );
    fill(field, "color/surface/page");
    stroke(field, "color/border/default", 1);
    radius(field, 4);
    await text(
      field,
      fields[i][1],
      12,
      11,
      274,
      i === 3 ? "small" : "body",
      "color/text/primary",
    );
  }
  await text(right, "必要证据", 20, 500, 100, "label", "color/text/primary");
  await text(
    right,
    "☑ 裂缝宽度测量\n☑ 临时防雨处置照片\n☑ 处置前后同角度对比\n☑ 整改说明与提交人",
    20,
    534,
    286,
    "body",
    "color/text/secondary",
  );
  const warn = await box(right, "Human Confirmation Required", 20, 656, 300, 72);
  fill(warn, "color/status/warning-surface");
  radius(warn, 4);
  await text(
    warn,
    "创建任务属于人工决定。AI 只提供字段建议，不会自动下发。",
    12,
    14,
    274,
    "small",
    "color/status/warning-foreground",
  );
  await button(right, "确认风险并创建整改任务", 20, 756, 300, 52);
  await flush();
  return root;
}

async function taskEvidenceReview() {
  const { root, main } = await desktopShell(
    ROOT_FIVE,
    4480,
    4,
    "整改任务 · 证据复核",
    "任务 WX-RECT-20260925-003  ·  责任人 王建国  ·  截止 2026年9月28日 18:00",
    "待复核",
    "warning",
  );
  const compare = await box(main, "Before And After Evidence", 34, 132, 760, 566);
  fill(compare, "color/surface/panel");
  stroke(compare, "color/border/default", 1);
  radius(compare, 4);
  await sectionHeading(
    compare,
    "整改前后证据对比",
    "同一位置、同一视角优先；原始文件保留",
    22,
    18,
    520,
  );
  await evidencePhoto(compare, "Before Evidence", 22, 82, 346, 310, -220, -160);
  await evidencePhoto(compare, "After Evidence", 392, 82, 346, 310, -430, -220);
  await labelChip(compare, "整改前", 32, 94, 84, "high");
  await labelChip(compare, "整改后", 402, 94, 84, "success");
  await text(
    compare,
    "2026-09-25 10:28  ·  刘强",
    22,
    410,
    290,
    "small",
    "color/text/secondary",
  );
  await text(
    compare,
    "2026-09-27 16:42  ·  王建国",
    392,
    410,
    300,
    "small",
    "color/text/secondary",
  );
  await divider(compare, "Compare Divider", 22, 446, 716, 1);
  await text(compare, "整改说明", 22, 468, 100, "label", "color/text/primary");
  await text(
    compare,
    "已完成裂缝宽度测量并记录，清理墙脚积水，增设临时防雨遮护；未实施结构修复。",
    22,
    498,
    704,
    "body",
    "color/text/secondary",
  );

  const ai = await box(main, "Evidence Completeness", 814, 132, 380, 566);
  fill(ai, "color/surface/panel");
  stroke(ai, "color/border/default", 1);
  radius(ai, 4);
  await sectionHeading(
    ai,
    "证据完整性检查",
    "AI 只检查材料，不自动关闭任务",
    20,
    18,
    330,
  );
  const score = await box(ai, "Completeness Score", 20, 82, 340, 76);
  fill(score, "color/status/success-surface");
  radius(score, 4);
  await text(
    score,
    "材料完整度",
    16,
    12,
    120,
    "small",
    "color/status/success-foreground",
  );
  await text(score, "4 / 4", 16, 34, 110, "metric", "color/status/success-foreground");
  await labelChip(score, "待人工复核", 202, 24, 120, "warning");
  const checks = [
    ["裂缝宽度测量", "已提供 · 2.6 mm"],
    ["临时防雨照片", "已提供 · 2 张"],
    ["前后同角度对比", "已匹配"],
    ["整改说明与提交人", "已签名"],
  ];
  for (let i = 0; i < checks.length; i += 1) {
    const y = 184 + i * 62;
    const dot = await ellipse(ai, `Check ${i + 1}`, 20, y + 4, 18, 18);
    fill(dot, "color/status/success");
    await text(ai, "✓", 24, y + 4, 12, "small", "color/text/inverse");
    await text(ai, checks[i][0], 50, y, 180, "label", "color/text/primary");
    await text(ai, checks[i][1], 50, y + 24, 240, "small", "color/text/secondary");
  }
  const closeNote = await box(ai, "Closure Guardrail", 20, 446, 340, 84);
  fill(closeNote, "color/status/warning-surface");
  stroke(closeNote, "color/status/warning-border", 1);
  radius(closeNote, 4);
  await text(
    closeNote,
    "关闭前仍需复核人员确认：证据真实、措施与要求一致、无遗漏风险。",
    12,
    14,
    314,
    "small",
    "color/status/warning-foreground",
  );

  const history = await box(main, "Task Timeline", 34, 720, 760, 266);
  fill(history, "color/surface/panel");
  stroke(history, "color/border/default", 1);
  radius(history, 4);
  await sectionHeading(
    history,
    "任务流转记录",
    "每次提交、退回与复核均保留理由",
    22,
    18,
    520,
  );
  const timeline = [
    ["9月25日 11:06", "李文博创建任务", "要求补测并采取临时防雨措施"],
    ["9月27日 16:42", "王建国提交整改", "上传 5 项证据并填写说明"],
    ["9月27日 16:43", "AI 完整性检查", "4/4 项材料齐全，等待人工复核"],
  ];
  for (let i = 0; i < timeline.length; i += 1) {
    const y = 84 + i * 54;
    const dot = await ellipse(history, `Timeline ${i + 1}`, 24, y + 4, 12, 12);
    fill(dot, i === 2 ? "color/status/warning" : "color/action/primary");
    if (i < 2) await divider(history, `Timeline Stem ${i + 1}`, 30, y + 16, 1, 42);
    await text(history, timeline[i][0], 52, y, 128, "small", "color/text/secondary");
    await text(history, timeline[i][1], 190, y, 180, "label", "color/text/primary");
    await text(history, timeline[i][2], 372, y, 350, "small", "color/text/secondary");
  }
  const actions = await box(main, "Review Actions", 814, 720, 380, 266);
  fill(actions, "color/surface/panel");
  stroke(actions, "color/border/default", 1);
  radius(actions, 4);
  await sectionHeading(
    actions,
    "复核结论",
    "驳回必须填写原因；通过后任务关闭",
    20,
    18,
    330,
  );
  await outlineButton(actions, "驳回并说明原因", 20, 112, 154, 50);
  await button(actions, "复核通过并关闭任务", 186, 112, 174, 50);
  await text(
    actions,
    "仅复核人员或管理员可执行关闭操作",
    20,
    186,
    320,
    "small",
    "color/text/secondary",
  );
  await flush();
  return root;
}

async function archiveReport() {
  const { root, main } = await desktopShell(
    ROOT_SIX,
    5600,
    3,
    "归档与报告中心",
    "巡查 WX-20260925-001  ·  示范木构院落 A-01  ·  归档人 李文博",
    "已闭环",
    "success",
  );
  const metrics = [
    ["发现项", "2", "均已确认"],
    ["整改任务", "2", "均已关闭"],
    ["证据文件", "11", "原件可追溯"],
    ["规则引用", "2", "版本已锁定"],
  ];
  for (let i = 0; i < metrics.length; i += 1) {
    const card = await box(
      main,
      `Metric / ${metrics[i][0]}`,
      34 + i * 234,
      132,
      214,
      100,
    );
    fill(card, "color/surface/panel");
    stroke(card, "color/border/default", 1);
    radius(card, 4);
    await text(card, metrics[i][0], 16, 14, 120, "small", "color/text/secondary");
    await text(card, metrics[i][1], 16, 38, 80, "metric", "color/text/primary");
    await text(card, metrics[i][2], 92, 46, 110, "small", "color/text/secondary");
  }
  const exportCard = await box(main, "Export Action", 970, 132, 224, 100);
  fill(exportCard, "color/action/primary");
  radius(exportCard, 4);
  await text(
    exportCard,
    "生成巡查归档报告",
    20,
    20,
    184,
    "label",
    "color/text/inverse",
  );
  await text(
    exportCard,
    "PDF / 打印版 / 审计清单  ›",
    20,
    54,
    184,
    "small",
    "color/text/inverse",
  );

  const preview = await box(main, "Report Preview", 34, 256, 780, 730);
  fill(preview, "color/surface/panel");
  stroke(preview, "color/border/default", 1);
  radius(preview, 4);
  await text(
    preview,
    "文物建筑巡查与整改闭环报告",
    34,
    28,
    560,
    "h1",
    "color/text/primary",
  );
  await text(
    preview,
    "报告编号 WX-RPT-20260925-001  ·  生成前预览",
    34,
    66,
    480,
    "small",
    "color/text/secondary",
  );
  await divider(preview, "Report Rule", 34, 100, 712, 1);
  await text(preview, "一、点位与巡查信息", 34, 124, 260, "h2", "color/text/primary");
  await text(
    preview,
    "示范木构院落 A-01｜执行人 刘强｜2026年9月25日｜天气 小雨后转阴",
    34,
    162,
    690,
    "body",
    "color/text/secondary",
  );
  await text(preview, "二、发现项与风险结论", 34, 210, 280, "h2", "color/text/primary");
  const tableHead = await box(preview, "Findings Header", 34, 250, 712, 36);
  fill(tableHead, "color/surface/subtle");
  await text(tableHead, "发现项", 12, 8, 250, "small", "color/text/secondary");
  await text(tableHead, "风险", 328, 8, 100, "small", "color/text/secondary");
  await text(tableHead, "结论", 482, 8, 180, "small", "color/text/secondary");
  const reportRows = [
    ["墙体裂缝线索", "高风险", "已整改并复核关闭"],
    ["潮湿盐析线索", "中风险", "已处置并复核关闭"],
  ];
  for (let i = 0; i < reportRows.length; i += 1) {
    const y = 286 + i * 46;
    await divider(preview, `Report Row ${i + 1}`, 34, y + 45, 712, 1);
    await text(
      preview,
      reportRows[i][0],
      46,
      y + 12,
      260,
      "body",
      "color/text/primary",
    );
    await labelChip(
      preview,
      reportRows[i][1],
      360,
      y + 9,
      84,
      i === 0 ? "high" : "medium",
    );
    await text(
      preview,
      reportRows[i][2],
      516,
      y + 12,
      190,
      "small",
      "color/text/secondary",
    );
  }
  await text(preview, "三、整改与证据摘要", 34, 406, 280, "h2", "color/text/primary");
  await text(
    preview,
    "完成裂缝宽度测量、临时防雨处置与墙脚排水清理。共形成 11 份证据文件，均保留提交人、时间与来源。",
    34,
    446,
    690,
    "body",
    "color/text/secondary",
  );
  await evidencePhoto(preview, "Report Evidence", 34, 504, 218, 150, -220, -160);
  await evidencePhoto(preview, "Report Evidence 2", 268, 504, 218, 150, -430, -220);
  await evidencePhoto(preview, "Report Evidence 3", 502, 504, 218, 150, -650, -190);
  await text(
    preview,
    "报告仅汇总已由人工确认的事实与决定；不替代专业结构鉴定。",
    34,
    682,
    700,
    "small",
    "color/text/secondary",
  );

  const audit = await box(main, "Sources And Audit", 834, 256, 360, 730);
  fill(audit, "color/surface/panel");
  stroke(audit, "color/border/default", 1);
  radius(audit, 4);
  await sectionHeading(audit, "来源与审计链", "报告内容可回到原始记录", 20, 18, 320);
  await text(audit, "规则来源", 20, 86, 100, "label", "color/text/primary");
  await text(
    audit,
    "PROJECT-RULES-V1\nDEMO-STRUCT-01 · 结构异常线索记录\nDEMO-WATER-01 · 排水与渗漏巡查",
    20,
    118,
    320,
    "small",
    "color/action/primary",
  );
  await divider(audit, "Audit Divider 1", 20, 196, 320, 1);
  await text(audit, "闭环审计", 20, 218, 100, "label", "color/text/primary");
  const auditRows = [
    ["巡查提交", "刘强 · 09-25 10:32"],
    ["风险复核", "李文博 · 09-25 11:06"],
    ["整改提交", "王建国 · 09-27 16:42"],
    ["复查关闭", "李文博 · 09-27 17:18"],
  ];
  for (let i = 0; i < auditRows.length; i += 1) {
    const y = 260 + i * 62;
    const dot = await ellipse(audit, `Audit Dot ${i + 1}`, 20, y + 4, 14, 14);
    fill(dot, "color/action/primary");
    if (i < auditRows.length - 1)
      await divider(audit, `Audit Stem ${i + 1}`, 27, y + 18, 1, 48);
    await text(audit, auditRows[i][0], 48, y, 110, "label", "color/text/primary");
    await text(
      audit,
      auditRows[i][1],
      48,
      y + 24,
      240,
      "small",
      "color/text/secondary",
    );
  }
  const done = await box(audit, "Archive Guardrail", 20, 530, 320, 82);
  fill(done, "color/status/success-surface");
  stroke(done, "color/status/success-border", 1);
  radius(done, 4);
  await text(
    done,
    "所有已确认风险均有对应整改任务，且已由复核人员关闭。可进入归档。",
    12,
    14,
    294,
    "small",
    "color/status/success-foreground",
  );
  await outlineButton(audit, "查看完整审计日志", 20, 640, 320, 48);
  await flush();
  return root;
}

async function mobileShell(name, x, title, subtitle, stepText) {
  await removeNamedRoot(MOBILE_PAGE_ID, name);
  const root = await box(MOBILE_PAGE_ID, name, x, 0, 375, 812);
  fill(root, "color/surface/page");
  stroke(root, "color/border/default", 1);
  const header = await box(root, "Mobile Header", 0, 0, 375, 118);
  fill(header, "color/surface/navigation");
  await text(header, "‹", 20, 18, 24, "h1", "color/text/inverse");
  await text(header, title, 52, 20, 250, "h2", "color/text/inverse");
  await text(header, subtitle, 20, 60, 320, "small", "color/surface/subtle");
  await text(header, stepText, 292, 60, 64, "small", "color/text/inverse");
  return root;
}

async function mobileCapture() {
  const root = await mobileShell(
    MOBILE_ONE,
    0,
    "现场巡查采集",
    "示范木构院落 A-01 · 北侧山墙",
    "步骤 2 / 4",
  );
  await text(root, "现场照片", 18, 138, 120, "label", "color/text/primary");
  await evidencePhoto(root, "Mobile Evidence", 18, 172, 339, 214, -240, -168);
  const camera = await box(root, "Camera Action", 280, 326, 58, 42);
  fill(camera, "color/action/primary");
  radius(camera, 21);
  await text(camera, "＋ 照片", 10, 10, 42, "small", "color/text/inverse");
  await text(root, "观察记录", 18, 408, 120, "label", "color/text/primary");
  const note = await box(root, "Observation Input", 18, 442, 339, 108);
  fill(note, "color/surface/panel");
  stroke(note, "color/border/default", 1);
  radius(note, 4);
  await text(
    note,
    "北侧山墙墙脚出现纵向裂缝线索，局部伴随潮湿痕迹。",
    12,
    12,
    315,
    "body",
    "color/text/primary",
  );
  await text(note, "0 / 500", 278, 78, 48, "small", "color/text/secondary");
  await text(root, "现场条件", 18, 576, 120, "label", "color/text/primary");
  await labelChip(root, "小雨后", 18, 610, 86, "info");
  await labelChip(root, "墙脚潮湿", 114, 610, 102, "warning");
  await labelChip(root, "待测量", 226, 610, 88, "warning");
  const privacy = await box(root, "Privacy Note", 18, 660, 339, 54);
  fill(privacy, "color/status/info-surface");
  radius(privacy, 4);
  await text(
    privacy,
    "提交前将移除照片中不必要的精确定位信息",
    12,
    16,
    315,
    "small",
    "color/status/info-foreground",
  );
  const footer = await box(root, "Sticky Actions", 0, 738, 375, 74);
  fill(footer, "color/surface/panel");
  await divider(footer, "Footer Divider", 0, 0, 375, 1);
  await outlineButton(footer, "保存草稿", 18, 14, 116, 46);
  await button(footer, "下一步：确认提交", 146, 14, 211, 46);
  await flush();
  return root;
}

async function mobileSubmit() {
  const root = await mobileShell(
    MOBILE_TWO,
    455,
    "巡查提交确认",
    "示范木构院落 A-01 · WX-20260925-001",
    "步骤 4 / 4",
  );
  const summary = await box(root, "Submission Summary", 18, 138, 339, 112);
  fill(summary, "color/surface/panel");
  stroke(summary, "color/border/default", 1);
  radius(summary, 4);
  await text(summary, "本次巡查", 14, 14, 100, "label", "color/text/primary");
  await text(
    summary,
    "照片 4 张   ·   观察记录 1 条   ·   现场条件 3 项",
    14,
    44,
    310,
    "body",
    "color/text/secondary",
  );
  await text(
    summary,
    "提交人 刘强   ·   2026年9月25日 10:32",
    14,
    76,
    310,
    "small",
    "color/text/secondary",
  );
  await text(root, "AI 初判预览", 18, 276, 130, "label", "color/text/primary");
  const draft = await box(root, "AI Draft Preview", 18, 310, 339, 172);
  fill(draft, "color/risk/high-surface");
  stroke(draft, "color/risk/high-border", 1);
  radius(draft, 4);
  await text(
    draft,
    "墙体裂缝线索 / 潮湿盐析线索",
    14,
    16,
    300,
    "h2",
    "color/risk/high-foreground",
  );
  await labelChip(draft, "高风险草案", 14, 56, 116, "high");
  await text(
    draft,
    "AI 仅生成草案，提交后由复核人员确认。缺少裂缝宽度测量。",
    14,
    96,
    310,
    "small",
    "color/text/secondary",
  );
  await text(draft, "置信度 92%", 14, 138, 120, "small", "color/text/primary");
  await text(root, "引用依据", 18, 510, 100, "label", "color/text/primary");
  await text(
    root,
    "PROJECT-RULES-V1 · DEMO-STRUCT-01\nPROJECT-RULES-V1 · DEMO-WATER-01",
    18,
    542,
    330,
    "small",
    "color/action/primary",
  );
  const confirm = await box(root, "Human Confirmation", 18, 612, 339, 72);
  fill(confirm, "color/surface/panel");
  stroke(confirm, "color/border/default", 1);
  radius(confirm, 4);
  const checkbox = await box(confirm, "Checkbox", 14, 18, 20, 20);
  fill(checkbox, "color/action/primary");
  radius(checkbox, 3);
  await text(checkbox, "✓", 4, 1, 14, "small", "color/text/inverse");
  await text(
    confirm,
    "我已核对原始照片与观察记录，确认提交巡查。",
    46,
    14,
    274,
    "small",
    "color/text/primary",
  );
  const footer = await box(root, "Sticky Actions", 0, 738, 375, 74);
  fill(footer, "color/surface/panel");
  await divider(footer, "Footer Divider", 0, 0, 375, 1);
  await outlineButton(footer, "返回修改", 18, 14, 116, 46);
  await button(footer, "提交巡查", 146, 14, 211, 46);
  await flush();
  return root;
}

try {
  await call("navigate_to_page", { pageId: PAGE_ID });
  const riskMapId = await riskMap();
  const overviewId = await overview();
  const inspectionWorkbenchId = await inspectionWorkbench();
  const riskReviewId = await riskReview();
  const taskEvidenceReviewId = await taskEvidenceReview();
  const archiveReportId = await archiveReport();
  await call("navigate_to_page", { pageId: MOBILE_PAGE_ID });
  const mobileCaptureId = await mobileCapture();
  const mobileSubmitId = await mobileSubmit();
  console.log(
    JSON.stringify({
      ok: true,
      riskMapId,
      overviewId,
      inspectionWorkbenchId,
      riskReviewId,
      taskEvidenceReviewId,
      archiveReportId,
      mobileCaptureId,
      mobileSubmitId,
    }),
  );
} finally {
  await client.close();
}
