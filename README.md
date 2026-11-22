# Tiny stack VM

A tiny stack virtual machine for make.fun's `tiny-stack-vm-01` bounty.
`main.ts` (Node 22, no dependencies) runs every `/input/<id>/program.bin`
on its `/input/<id>/input.bin` and writes `/output/<id>/stdout.bin` and
`/output/<id>/exit.txt` (exit code 0-255, traps included).

The ISA: 32-bit wrapping values, a 256-value data stack, a 64-entry call
stack, 256 words of memory, byte-wise input, and traps 2-11. See the kit's
`program/generator/subject/ISA.md` for the full spec.

Run locally on the practice set:

```
mkdir -p out && MAKEFUN_INPUT_DIR=practice/input MAKEFUN_OUTPUT_DIR=out node main.ts
```
