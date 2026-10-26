import { useReading } from "../reading";

export function ReadingBar() {
  const reading = useReading();
  const { t } = reading;
  const status = reading.translating
    ? t.translating
    : reading.failed
      ? t.translateFailed
      : "";

  if (!status) return null;

  return (
    <p className="reading-note" role="status" lang={reading.lang} dir={reading.dir}>{status}</p>
  );
}
