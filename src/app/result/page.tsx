"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { ComponentProps, FC, useEffect, useState } from "react";

export interface Detection {
  class_id: number;
  class_label: string;
  confidence: number;
  detection_id: string;
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface ColRowData {
  count: number;
  misaligned: number;
  skipped: Detection[];
}

export interface ColorData {
  contrast_ratio: number;
  dominant_colors: [[number, number, number], number][];
  percentages: [[number, number, number], number][];
}

export interface ParsedResult {
  col: ColRowData;
  row: ColRowData;
  color: ColorData;
  image: string;
  skipped_detections: Detection[];
}

const isInBetween = (val: number, on: number, offset: number = 3) => {
  return val <= on + offset && val >= on - offset;
};

export default function page() {
  const [response, setResponse] = useState<ParsedResult | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const result = localStorage.getItem("result");
      if (result) {
        try {
          const parsedResult: ParsedResult = JSON.parse(result);
          console.log(parsedResult);
          setResponse(parsedResult);
        } catch (e) {
          console.error("Failed to parse localStorage result", e);
        }
      }
    }
  }, []);

  if (!response) {
    return <div>Loading...</div>;
  }

  if (!response.image) {
    return <div>No image found in the response</div>;
  }

  const color = {
    primary: {
      color: `rgb(${response.color.dominant_colors[0][0][0]},${response.color.dominant_colors[0][0][1]},${response.color.dominant_colors[0][0][2]})`,
      percent: response.color.percentages[0][1],
      isPass: isInBetween(response.color.percentages[0][1], 60),
    },
    secondary: {
      color: `rgb(${response.color.dominant_colors[1][0][0]},${response.color.dominant_colors[1][0][1]},${response.color.dominant_colors[1][0][2]})`,
      percent: response.color.percentages[1][1],
      isPass: isInBetween(response.color.percentages[1][1], 30),
    },
    accent: {
      color: `rgb(${response.color.dominant_colors[2][0][0]},${response.color.dominant_colors[2][0][1]},${response.color.dominant_colors[2][0][2]})`,
      percent: response.color.percentages[2][1],
      isPass: isInBetween(response.color.percentages[2][1], 10),
    },
    totalScore:
      (((isInBetween(response.color.percentages[0][1], 60) ? 1 : 0) +
        (isInBetween(response.color.percentages[1][1], 30) ? 1 : 0) +
        (isInBetween(response.color.percentages[2][1], 10) ? 1 : 0) +
        (response.color.contrast_ratio > 3 ? 1 : 0)) /
        4) *
      100,
  };

  const alignment = {
    row: {
      count: response.row.count,
      misaligned: response.row.misaligned,
      skipped: response.row.skipped,
      alignment: 100 - response.row.misaligned,
      isPass: 100 - response.row.misaligned >= 50,
    },
    col: {
      count: response.col.count,
      misaligned: response.col.misaligned,
      skipped: response.col.skipped,
      alignment: 100 - response.col.misaligned,
      isPass: 100 - response.col.misaligned >= 50,
    },
  };

  const alignmentScore =
    (((alignment.row.isPass ? 1 : 0) + (alignment.col.isPass ? 1 : 0)) / 2) *
    100;

  const balanceScore = ((color.totalScore + alignmentScore) / 200) * 100;

  return (
    <>
      <div className="max-h-dvh grid grid-rows-2 grid-cols-4 p-4 py-8 gap-4 bg-slate-50">
        {/* SECTION - Display image */}
        <GridContainer className="col-span-2">
          <Image
            src={response.image}
            alt="Uploaded Image"
            width={5000}
            height={5000}
            className="object-cover w-full h-full"
          />
        </GridContainer>
        {/* !SECTION */}

        {/* SECTION - Overall score */}
        <GridContainer className="col-span-2">
          <div className="flex flex-col items-center gap-2 h-full">
            <p className="text-sm">Overall score</p>

            <div className="flex flex-col items-center justify-center h-full relative">
              {/* ◉ Ring container */}
              <div
                className="relative inline-flex items-center justify-center rounded-full"
                style={{
                  width: "19rem",
                  height: "19rem",
                  background: `conic-gradient(${
                    balanceScore > 50 ? "#34C759" : "#FF3B30"
                  } ${balanceScore}%, #E2E8F0 ${
                    balanceScore
                  }% 100%)`,
                }}
              >
                {/* ◉ “Hole” so it’s a ring */}
                <div className="absolute inset-[0.5rem] bg-white rounded-full flex items-center justify-center">
                  <span className="text-6xl font-semibold">
                    {balanceScore.toFixed(0)}%
                  </span>
                </div>
                <div className="absolute bottom-8 inset-x-0 text-center">
                  / 100
                </div>
              </div>
            </div>
          </div>
        </GridContainer>
        {/* !SECTION */}

        {/* SECTION - Dominant color */}
        <GridContainer className="flex flex-col gap-4">
          <p className="text-xl text-center">Color usage</p>
          <div className="grid grid-cols-3 gap-2 h-full">
            <div className="flex flex-col gap-2">
              <div
                className="w-full aspect-square rounded"
                style={{ backgroundColor: color.primary.color }}
              />
              <p className="text-[#64748B] text-xs text-center">
                Primary color
              </p>
              <div className="h-full flex-col flex justify-center items-center gap-8">
                <p className="text-4xl font-semibold">
                  {color.primary.percent}%
                </p>
                <p
                  className="text-xl font-semibold"
                  style={{
                    color: color.primary.isPass ? "#34C759" : "#FF3B30",
                  }}
                >
                  {color.primary.isPass ? "Pass" : "Fail"}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div
                className="w-full aspect-square rounded"
                style={{
                  backgroundColor: color.secondary.color,
                }}
              />
              <p className="text-[#64748B] text-xs text-center">
                Secondary color
              </p>
              <div className="h-full flex-col flex justify-center items-center gap-8">
                <p className="text-4xl font-semibold">
                  {color.secondary.percent}%
                </p>
                <p
                  className="text-xl font-semibold"
                  style={{
                    color: color.primary.isPass ? "#34C759" : "#FF3B30",
                  }}
                >
                  {color.secondary.isPass ? "Pass" : "Fail"}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div
                className="w-full aspect-square rounded"
                style={{
                  backgroundColor: color.accent.color,
                }}
              />
              <p className="text-[#64748B] text-xs text-center">Accent color</p>
              <div className="h-full flex-col flex justify-center items-center gap-8">
                <p className="text-4xl font-semibold">
                  {color.accent.percent}%
                </p>
                <p
                  className="text-xl font-semibold"
                  style={{
                    color: color.accent.isPass ? "#34C759" : "#FF3B30",
                  }}
                >
                  {color.accent.isPass ? "Pass" : "Fail"}
                </p>
              </div>
            </div>
          </div>
        </GridContainer>
        {/* !SECTION */}

        {/* SECTION - Color contrast */}
        <GridContainer className="flex flex-col gap-4  justify-between">
          <p className="text-xl text-center">Color contrast ratio</p>
          <p className="text-7xl font-semibold text-center">{`${response.color.contrast_ratio} : 1`}</p>
          <p
            className="text-xl font-semibold text-center"
            style={{
              color: response.color.contrast_ratio > 3 ? "#34C759" : "#FF3B30",
            }}
          >
            {response.color.contrast_ratio > 3 ? "Pass" : "Fail"}
          </p>
        </GridContainer>
        {/* !SECTION */}

        {/* SECTION - Alignment */}
        <GridContainer className="flex flex-col gap-4">
          <p className="text-xl text-center">Alignment</p>
          <div className="grid grid-cols-1 grid-rows-2 gap-2 h-full">
            <div className="flex flex-col gap-2">
              <p className="text-sm">Horizontal</p>
              <div className="relative w-full h-3 bg-[#E2E8F0]">
                <span
                  className="absolute h-full"
                  style={{
                    width: `${alignment.row.alignment}%`,
                    backgroundColor: alignment.row.isPass
                      ? "#34C759"
                      : "#FF3B30",
                  }}
                />
              </div>
              <p className="text-4xl font-semibold text-end">{`${alignment.row.alignment.toFixed(
                0
              )}%`}</p>
              <p
                className="font-semibold text-end"
                style={{
                  color: alignment.row.isPass ? "#34C759" : "#FF3B30",
                }}
              >
                {alignment.row.isPass ? "Pass" : "Misalignment"}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm">Vertical</p>
              <div className="relative w-full h-3 bg-[#E2E8F0]">
                <span
                  className="absolute h-full"
                  style={{
                    width: `${alignment.col.alignment}%`,
                    backgroundColor: alignment.col.isPass
                      ? "#34C759"
                      : "#FF3B30",
                  }}
                />
              </div>
              <p className="text-4xl font-semibold text-end">{`${alignment.col.alignment.toFixed(
                0
              )}%`}</p>
              <p
                className="font-semibold text-end"
                style={{
                  color: alignment.col.isPass ? "#34C759" : "#FF3B30",
                }}
              >
                {alignment.col.isPass ? "Pass" : "Misalignment"}
              </p>
            </div>
          </div>
        </GridContainer>
        {/* !SECTION */}

        {/* SECTION - Balance */}
        <GridContainer className="flex flex-col gap-4">
          <p className="text-xl text-center">Balance</p>
          <div className="grid grid-cols-1 grid-rows-2 gap-2 h-full">
            <div className="flex flex-col gap-2">
              <p className="text-sm mb-4">Color usage</p>
              <p className="text-4xl font-semibold text-center">{`${color.totalScore.toFixed(
                0
              )}%`}</p>
              <p
                className="font-semibold text-center"
                style={{
                  color: color.totalScore >= 50 ? "#34C759" : "#FF3B30",
                }}
              >
                {color.totalScore >= 50 ? "Pass" : "Fail"}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm mb-4">Alignment</p>
              <p className="text-4xl font-semibold text-center">{`${alignmentScore.toFixed(
                0
              )}%`}</p>
              <p
                className="font-semibold text-center"
                style={{
                  color: alignmentScore >= 50 ? "#34C759" : "#FF3B30",
                }}
              >
                {alignmentScore >= 50 ? "Pass" : "Misalignment"}
              </p>
            </div>
          </div>
        </GridContainer>
        {/* !SECTION */}
      </div>
    </>
  );
}

const GridContainer: FC<ComponentProps<"div">> = ({ className, ...props }) => {
  return (
    <div
      className={cn("p-4 border rounded-lg bg-white", className)}
      {...props}
    />
  );
};
