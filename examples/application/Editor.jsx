import { useEffect, useRef } from "react";
import { mountEditor } from "./mount.js";

export function Editor({ options, onReady }) {
  const container = useRef(null);
  useEffect(() => mountEditor(container.current, options, onReady), [options, onReady]);
  return <div ref={container} />;
}
