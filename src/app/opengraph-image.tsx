import { ImageResponse } from "next/og";

export const alt =
  "United States — World Wide Recruitment | Global Executive Search & Headhunting";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#080808",
        }}
      >
        <span
          style={{
            fontSize: 160,
            fontWeight: 900,
            color: "#D4AF37",
            letterSpacing: "-0.02em",
          }}
        >
          USWWR
        </span>
      </div>
    ),
    { ...size }
  );
}
