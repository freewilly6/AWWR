import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt =
  "American — World Wide Recruitment | Global Executive Search & Headhunting";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const logoData = await readFile(join(process.cwd(), "public", "AWWR.png"));
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          background: "#080808",
          position: "relative",
        }}
      >
        {/* Top gold accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background:
              "linear-gradient(90deg, transparent 0%, #c9a84c 50%, transparent 100%)",
          }}
        />

        {/* Bottom gold accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            background:
              "linear-gradient(90deg, transparent 0%, #c9a84c 50%, transparent 100%)",
          }}
        />

        {/* Logo */}
        <img
          src={logoBase64}
          alt=""
          width={400}
          height={400}
          style={{
            borderRadius: "50%",
            marginRight: "48px",
          }}
        />

        {/* Text content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "600px",
          }}
        >
          <div
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: "#ccc8be",
              marginBottom: "12px",
              lineHeight: 1.2,
              display: "flex",
            }}
          >
            American — World Wide Recruitment
          </div>

          {/* Gold divider */}
          <div
            style={{
              width: "80px",
              height: "3px",
              background: "#c9a84c",
              marginBottom: "16px",
            }}
          />

          <div
            style={{
              fontSize: 22,
              color: "rgba(204, 200, 190, 0.6)",
              lineHeight: 1.5,
              display: "flex",
            }}
          >
            Global Executive Search & Headhunting
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            right: "32px",
            fontSize: 16,
            color: "#8a7232",
            letterSpacing: "0.05em",
            display: "flex",
          }}
        >
          www.usa-world-wide-recruitment.com
        </div>
      </div>
    ),
    { ...size }
  );
}
