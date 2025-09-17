import * as fc from "https://esm.sh/fast-check@3.1.1";

Deno.test("Property test: Pay to address with random amounts", async () => {

  const { Lucid, Emulator, Blockfrost } = await import("https://deno.land/x/lucid/mod.ts");
  
  const seedPhrase = "illness tomato organ credit hybrid path slight bomb allow media credit virtual uncle blast type very certain join feed repeat elbow place aim oblige";
  
  const tempLucid = await Lucid.new(
    new Blockfrost(
        "https://cardano-preprod.blockfrost.io/api/v0", 
        "preprodat1IV1yY86Gf1ikmWeEZs5IWFpzI3jvS"),
        "Preprod"
  );
  tempLucid.selectWalletFromSeed(seedPhrase);
  const walletAddress = await tempLucid.wallet.address();

  await fc.assert(
    fc.asyncProperty(fc.bigInt(1000000n, 10000000n), async (amount) => {
      const ACCOUNT_0 = {
        address: walletAddress,
        assets: { lovelace: 3000000000n },
        seedPhrase: seedPhrase
      };
      
      const emulator = new Emulator([ACCOUNT_0]);
      const lucid = await Lucid.new(emulator, "Preprod");
      lucid.selectWalletFromSeed(ACCOUNT_0.seedPhrase);

      const recipient = "addr_test1qqhey3pqmmfr45d33f3nj0enwsmswhqkhtm3pkm2nzatqyvxj3cwzvwg9fn3mx4h2vc6tt84ch55kdcp04eeeqgdnd0s6wrjxx";

      const tx = await lucid.newTx()
        .payToAddress(recipient, { lovelace: amount })
        .complete();
      const signedTx = await tx.sign().complete();
      const txHash = await emulator.submitTx(signedTx.toString());
      console.log("Transaction hash:", txHash);
      return true; 

    }),
    {numRuns: 50}
  );
});