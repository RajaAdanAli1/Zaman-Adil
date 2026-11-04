import { spawn } from "node:child_process";

const children = [
  spawn("npm", ["run", "dev", "-w", "zamanadil-server"], { stdio: "inherit", shell: true }),
  spawn("npm", ["run", "dev", "-w", "zamanadil-client"], { stdio: "inherit", shell: true }),
];

function stop() {
  for (const child of children) child.kill();
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
children.forEach((child) => child.on("exit", (code) => {
  if (code && code !== 0) {
    stop();
    process.exit(code);
  }
}));
