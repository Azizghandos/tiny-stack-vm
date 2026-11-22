// Tiny stack VM for make.fun tiny-stack-vm-01. Node 22, no dependencies.
// Runs /input/<id>/program.bin on /input/<id>/input.bin, writes
// /output/<id>/stdout.bin and /output/<id>/exit.txt for every instance.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
function run(p, q) {
  const n = p.length, s = new Int32Array(256);
  let sp = 0;
  const c = new Int32Array(64);
  let cp = 0;
  const m = new Int32Array(256), o = new Uint8Array(65536);
  let ol = 0, ip = 0, pc = 0, st = 0;
  const end = (x) => [o.subarray(0, ol), x];
  for (;;) {
    if (st === 1e6) return end(10);
    if (pc < 0 || pc >= n) return end(9);
    const op = p[pc];
    let im = 0, nd = 0, gv = 0;
    if (op === 1) { im = 1; gv = 1; }
    else if (op === 2) { im = 4; gv = 1; }
    else if (op === 3 || op === 0x17 || op === 0x1b) { nd = 1; gv = op === 3 ? 0 : 1; }
    else if (op === 4) { nd = 1; gv = 2; }
    else if (op === 5) { nd = 2; gv = 2; }
    else if (op === 6) { nd = 2; gv = 3; }
    else if (op === 7) { nd = 3; gv = 3; }
    else if (op >= 0x10 && op <= 0x16 || op >= 0x18 && op <= 0x1e || op >= 0x20 && op <= 0x22) { nd = 2; gv = 1; }
    else if (op === 0x30 || op === 0x33) im = 2;
    else if (op === 0x31 || op === 0x32) { im = 2; nd = 1; }
    else if (op === 0x40) { nd = 1; gv = 1; }
    else if (op === 0x41) nd = 2;
    else if (op === 0x50 || op === 0x51 || op === 0x53) nd = 1;
    else if (op === 0x52) gv = 1;
    else if (op !== 0 && op !== 0x34) return end(5);
    if (pc + im >= n) return end(9);
    st++;
    const nx = pc + 1 + im;
    if (sp < nd) return end(2);
    if (sp - nd + gv > 256) return end(3);
    pc = nx;
    if (op === 0) return end(0);
    if (op === 1) s[sp++] = (p[nx - 1] << 24) >> 24;
    else if (op === 2) s[sp++] = p[nx - 4] | p[nx - 3] << 8 | p[nx - 2] << 16 | p[nx - 1] << 24;
    else if (op === 3) sp--;
    else if (op === 4) { s[sp] = s[sp - 1]; sp++; }
    else if (op === 5) { const t = s[sp - 1]; s[sp - 1] = s[sp - 2]; s[sp - 2] = t; }
    else if (op === 6) { s[sp] = s[sp - 2]; sp++; }
    else if (op === 7) { const a = s[sp - 3]; s[sp - 3] = s[sp - 2]; s[sp - 2] = s[sp - 1]; s[sp - 1] = a; }
    else if (op === 0x17) s[sp - 1] = -s[sp - 1] | 0;
    else if (op === 0x1b) s[sp - 1] = ~s[sp - 1];
    else if (op >= 0x10 && op <= 0x22 && op !== 0x17 && op !== 0x1b) {
      const b = s[sp - 1], a = s[sp - 2];
      let r = 0;
      if (op === 0x10) r = a + b | 0;
      else if (op === 0x11) r = a - b | 0;
      else if (op === 0x12) r = Math.imul(a, b);
      else if (op === 0x13) { if (!b) return end(4); r = a === -2147483648 && b === -1 ? a : a / b | 0; }
      else if (op === 0x14) { if (!b) return end(4); r = b === -1 ? 0 : a % b | 0; }
      else if (op === 0x15) { if (!b) return end(4); r = Math.floor((a >>> 0) / (b >>> 0)) | 0; }
      else if (op === 0x16) { if (!b) return end(4); r = (a >>> 0) % (b >>> 0) | 0; }
      else if (op === 0x18) r = a & b;
      else if (op === 0x19) r = a | b;
      else if (op === 0x1a) r = a ^ b;
      else if (op === 0x1c) r = a << (b & 31);
      else if (op === 0x1d) r = a >> (b & 31);
      else if (op === 0x1e) r = a >>> (b & 31) | 0;
      else if (op === 0x20) r = a === b ? 1 : 0;
      else if (op === 0x21) r = a < b ? 1 : 0;
      else r = (a >>> 0) < (b >>> 0) ? 1 : 0;
      sp -= 2; s[sp++] = r;
    }
    else if (op >= 0x30 && op <= 0x32) {
      const rel = (p[nx - 2] | p[nx - 1] << 8) << 16 >> 16;
      let take = true;
      if (op !== 0x30) { const v = s[--sp]; take = op === 0x31 ? v === 0 : v !== 0; }
      if (take) pc = nx + rel;
    }
    else if (op === 0x33) {
      if (cp === 64) return end(7);
      c[cp++] = nx; pc = p[nx - 2] | p[nx - 1] << 8;
    }
    else if (op === 0x34) { if (!cp) return end(8); pc = c[--cp]; }
    else if (op === 0x40) { const a = s[sp - 1]; if (a < 0 || a > 255) return end(6); s[sp - 1] = m[a]; }
    else if (op === 0x41) { const a = s[sp - 1], v = s[sp - 2]; if (a < 0 || a > 255) return end(6); sp -= 2; m[a] = v; }
    else if (op === 0x50) {
      const t = String(s[sp - 1]);
      if (ol + t.length > 65536) return end(11);
      sp--;
      for (let i = 0; i < t.length; i++) o[ol++] = t.charCodeAt(i);
    }
    else if (op === 0x51) { if (ol + 1 > 65536) return end(11); o[ol++] = s[--sp] & 255; }
    else if (op === 0x52) s[sp++] = ip < q.length ? q[ip++] : -1;
    else if (op === 0x53) return end(s[--sp] & 255);
  }
}
for (const id of readdirSync(I).sort()) {
  const d = join(I, id);
  const [o, x] = run(readFileSync(join(d, 'program.bin')), readFileSync(join(d, 'input.bin')));
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), o);
  writeFileSync(join(O, id, 'exit.txt'), x + '\n');
}
