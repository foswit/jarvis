import { execFile } from 'node:child_process';

// Запускает программу БЕЗ оболочки (shell): аргументы передаются списком, поэтому
// «; rm -rf ~» внутри текста не превратится в вторую команду.
export function run(cmd, args, cwd, { timeoutMs = 120000 } = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd, timeout: timeoutMs, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(new Error(`${cmd} ${args[0] ?? ''}: ${(stderr || err.message).trim().slice(0, 500)}`));
      else resolve(String(stdout));
    });
  });
}
