import { useEffect, useState } from "react";
import { dirFor } from "../../../shared/reading.js";
import { useReading } from "../reading";
import { translateText } from "../translate";

export function useLiveText(text, source = "en") {
  const { lang } = useReading();
  const sourceText = String(text ?? "");
  const [state, setState] = useState({ text: sourceText, pending: false, failed: false });

  useEffect(() => {
    if (!sourceText.trim() || lang === source) {
      setState({ text: sourceText, pending: false, failed: false });
      return undefined;
    }
    let cancel = false;
    setState({ text: sourceText, pending: true, failed: false });
    translateText(sourceText, lang, source).then((result) => {
      if (!cancel) setState({ text: result.text, pending: false, failed: result.failed });
    });
    return () => {
      cancel = true;
    };
  }, [sourceText, source, lang]);

  return state;
}

export function LiveText({ text, source = "en", as: Tag = "span", className = "", ...rest }) {
  const reading = useReading();
  const live = useLiveText(text, source);
  const shown = !String(text ?? "").trim() || live.pending || live.failed || reading.lang === source ? source : reading.lang;
  const classNames = ["live-copy", className].filter(Boolean).join(" ");
  return (
    <Tag {...rest} className={classNames} lang={shown} dir={dirFor(shown)}>
      {live.text}
    </Tag>
  );
}
