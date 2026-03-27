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
          alignItems: "center",
          justifyContent: "center",
          background: "#080808",
        }}
      >
        <img
          src={logoBase64}
          alt=""
          width={550}
          height={550}
          style={{
            borderRadius: "50%",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
