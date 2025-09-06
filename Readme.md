 Testing Off-Chain Code with Lucid
- Lucid Emulator
- Writing unit tests with deno
- Writing property tests with fast-check

How to run it ?

```bash
npm i
npm i deno
```
```bash
cd fast-check
deno test fast-check.ts --allow-all
```
Its show below: 
```bash
PS D:\lucid\fast-check> deno test fast-check.ts --allow-all
Check file:///D:/lucid/fast-check/fast-check.ts
running 1 test from ./fast-check.ts
Property test: Pay to address with random amounts ...
------- output -------
Transaction hash: 5ab3b70db271bd21b6fbde54ede0f1225978e6f33f527a92c98798c9ffc1a10b
Transaction hash: dce5dd9162c8e2b629f5700ab12e3b655cfd61ce3da19ee927b71f03200486ff
Transaction hash: 4090619adb21d506dfe9f984aede193cbb6514bbb4dfaa2c55ed69e1eccfbd8f
Transaction hash: ce0739afa7874e00f5418ad6f1186d50cf694d2e4b789a216c132b7d4a3df8a4
Transaction hash: 774d7576eac55afec963b2fbb521c7c2b904a081ab92e285744c0c8cfe94bee2
----- output end -----
Property test: Pay to address with random amounts ... ok (1s)

ok | 1 passed | 0 failed (1s)

PS D:\lucid\fast-check> 
```