const { spawn, execSync } = require("child_process");
const path = require("path");

const killPort = (port) => {
  try {
    if (process.platform === "win32") {
      const result = execSync(`netstat -ano | findstr :${port}`).toString();
      const lines = result.trim().split("\n");

      lines.forEach((line) => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        execSync(`taskkill /PID ${pid} /F`);
      });
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9`);
    }
  } catch {}
};

const run = (cmd, args, cwd) => {
  const p = spawn(cmd, args, {
    cwd: path.resolve(cwd),
    stdio: "inherit",
    shell: true,
  });

  p.on("error", () => {});
  return p;
};

killPort(4000);
killPort(5000);
killPort(8081);
killPort(8082);

run("npx", ["expo", "start"], "frontend");