import { sign } from "crypto";
import { Network } from "inspector/promises";

async function main(){
    const { Lucid, Blockfrost, networkToId, Emulator } = await import("lucid-cardano");
    const w_24_phrase = ["illness", "tomato", "organ", "credit", "hybrid", "path", "slight", "bomb", "allow", "media", "credit", "virtual", "uncle", "blast", "type", "very", "certain", "join", "feed", "repeat", "elbow", "place", "aim", "oblige"].join(" ");
    const lucid = await Lucid.new(
        new Blockfrost(
            "https://cardano-preprod.blockfrost.io/api/v0",
            "preprodat1IV1yY86Gf1ikmWeEZs5IWFpzI3jvS"
        ),
         "Preprod"
    );
    const Bob = 'addr_test1qqhey3pqmmfr45d33f3nj0enwsmswhqkhtm3pkm2nzatqyvxj3cwzvwg9fn3mx4h2vc6tt84ch55kdcp04eeeqgdnd0s6wrjxx';
    const wallet = lucid.selectWalletFromSeed(w_24_phrase);
    const emulator = new Emulator([{
        address: "addr_test...",
        assets: { lovelace: 3000000000n },
}]);
  
}
main();