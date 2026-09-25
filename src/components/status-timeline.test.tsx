// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusTimeline } from "@/components/status-timeline";

describe("StatusTimeline", () => {
  it("renders each status with its text label", () => {
    render(
      <StatusTimeline
        items={[
          {
            title: "巡查记录",
            description: "现场记录已提交",
            status: "已完成",
            tone: "success",
          },
          {
            title: "人工复核",
            description: "等待复核人员确认",
            status: "进行中",
            tone: "warning",
          },
        ]}
      />,
    );

    expect(screen.getByText("巡查记录")).toBeTruthy();
    expect(screen.getByText("人工复核")).toBeTruthy();
    expect(screen.getByText("已完成")).toBeTruthy();
    expect(screen.getByText("进行中")).toBeTruthy();
  });
});
