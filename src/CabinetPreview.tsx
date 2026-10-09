import { useEffect, useState } from "react";
import { styled } from "@linaria/react";
import { CABINET_WIDTH, CABINET_HEIGHT, PREVIEW_QUERY } from "./display";

const Preview = styled.main`
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: #080d11;
  iframe {
    display: block;
    border: 0;
    transform-origin: center;
  }
`;

export function CabinetPreview() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const resize = () =>
      setScale(Math.min(2, window.innerWidth / CABINET_WIDTH,
        window.innerHeight / CABINET_HEIGHT));
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  const url = new URL(window.location.href);
  url.searchParams.set(PREVIEW_QUERY, "1");
  return (
    <Preview aria-label="336 by 262 cabinet preview">
      <iframe
        title="Street Philosophy Fighter cabinet preview"
        src={url.href}
        width={CABINET_WIDTH}
        height={CABINET_HEIGHT}
        style={{ transform: `scale(${scale})` }}
      />
    </Preview>
  );
}
