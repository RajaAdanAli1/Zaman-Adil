import { start } from "./server/src/index.js";
import { publicError } from "./server/src/redact.js";

start().catch((error) => {
  console.error(publicError(error));
  process.exit(1);
});
