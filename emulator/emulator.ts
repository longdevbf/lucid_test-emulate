import { types } from "util";
import { Addresses, Assets } from "../lucid/mod";

interface Wallet {
        seedPhrase: string;
        address: string;
        assets: Assets;
    }
async function main(){
    const { Lucid, Blockfrost, networkToId, Emulator} = await import("lucid-cardano");
    const w_24_phrase = ["illness", "tomato", "organ", "credit", "hybrid", "path", "slight", "bomb", "allow", "media", "credit", "virtual", "uncle", "blast", "type", "very", "certain", "join", "feed", "repeat", "elbow", "place", "aim", "oblige"].join(" ");
    const ac1 = 'addr_test1qp32dhvj6nmhn8qjce8vsv3s0x70rrth7udxy32a7lm5yl7vchlp2ahqwyyfpv4l7fszccrngx2vcmmu5x3d3t3cy2uqpd7ewx'
    const recipient = "addr_test1qrupyvhe20s0hxcusrzlwp868c985dl8ukyr44gfvpqg4ek3vp92wfpentxz4f853t70plkp3vvkzggjxknd93v59uysvc54h7";
    const wallet: Wallet = {
        seedPhrase: w_24_phrase,
        address: ac1,
        assets: { lovelace: 300000000000n }
    }
    const emulator = new Emulator([wallet]);
    
    const lucid = await Lucid.new(emulator);
    lucid.selectWalletFromSeed(wallet.seedPhrase);
    const tx = await lucid.newTx()
        .payToAddress(recipient, { lovelace: 1000000n })
        .complete();
    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();
    console.log(txHash);
}
main();