import {
    Blockfrost,
    Data,
    Lucid,
    SpendingValidator,
    TxHash,
    fromHex,
    toHex,
    Address,
    Emulator,
    Constr,
    UTxO
} from "https://deno.land/x/lucid@0.10.11/mod.ts";
import * as fc from "https://esm.sh/fast-check@3.1.1";

function generateAccount(assets: any) {
    return {
        address: "addr_test1qp32dhvj6nmhn8qjce8vsv3s0x70rrth7udxy32a7lm5yl7vchlp2ahqwyyfpv4l7fszcc" +
                "rngx2vcmmu5x3d3t3cy2uqpd7ewx",
        assets,
        seedPhrase: "illness tomato organ credit hybrid path slight bomb allow media credit virtual u" +
                "ncle blast type very certain join feed repeat elbow place aim oblige"
    };
}

function utf8ToHex(str: string): string {
    return Array.from(new TextEncoder().encode(str))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}

const ACCOUNT_0 = generateAccount({lovelace: 3000000000n});
const emulator = new Emulator([ACCOUNT_0]);
const lucid = await Lucid.new(emulator, "Preview");

const script: SpendingValidator = {
    type: "PlutusV2",
    script: '58f1010000323232323232323222232325333008323232533300b002100114a06644646600200200644a66602200229404c8c94ccc040cdc78010028a511330040040013014002375c60240026eb0c038c03cc03cc03cc03cc03cc03cc03cc03cc020c008c020014dd71801180400399b8f375c6002600e00a91010c48656c6c6f20776f726c6421002300d00114984d958c94ccc020cdc3a400000226464a66601a601e0042930b1bae300d00130060041630060033253330073370e900000089919299980618070010a4c2c6eb8c030004c01401058c01400c8c014dd5000918019baa0015734aae7555cf2ab9f5742ae881'
};

lucid.selectWalletFromSeed("illness tomato organ credit hybrid path slight bomb allow media credit virtual u" +
        "ncle blast type very certain join feed repeat elbow place aim oblige");

const publicKeyHash = lucid
    .utils
    .getAddressDetails(await lucid.wallet.address())
    .paymentCredential
    ?.hash;

const DatumSchema = Data.Object({
    owner: Data.Bytes(),
});

type DatumType = Data.Static<typeof DatumSchema>;

async function lockAssets({datum}: {datum: string}): Promise<TxHash> {
    const contractAddress: Address = lucid
        .utils
        .validatorToAddress(script);
    console.log(`Contract Address: ${contractAddress}`);
    const tx = await lucid
        .newTx()
        .payToContract(contractAddress, {
            inline: datum
        }, {lovelace: 1000000n})
        .complete();
    const signedTx = await tx
        .sign()
        .complete();
    return signedTx.submit();
}

async function unlockAssets(
    utxos: UTxO[],
    { validator, redeemer }: { validator: SpendingValidator; redeemer: string }
): Promise<TxHash> {
    const tx = await lucid
        .newTx()
        .collectFrom(utxos, redeemer)
        .addSigner(await lucid.wallet.address())
        .attachSpendingValidator(validator)
        .complete();
    const signedTx = await tx
        .sign()
        .complete();
    return signedTx.submit();
}

async function main() {
    // PHASE 1: LOCK ASSETS
    console.log("=== PHASE 1: LOCKING ASSETS ===");
    const datum = Data.to({
        owner: publicKeyHash ?? '00000000000000000000000000000000000000000000000000000000'
    }, DatumSchema);
    
    const lockTxHash = await lockAssets({datum});
    console.log(`Lock tx hash: ${lockTxHash}`);
    console.log(`Datum: ${datum}`);
    
    // Wait for lock transaction to be confirmed
    await emulator.awaitTx(lockTxHash);
    console.log("Lock transaction confirmed!");
    
    // PHASE 2: UNLOCK ASSETS
    console.log("\n=== PHASE 2: UNLOCKING ASSETS ===");
    
    // Get contract address from Plutus script
    const scriptAddress = lucid.utils.validatorToAddress(script);
    console.log('Script address:', scriptAddress);

    // Fetch all UTxOs at the contract address
    const scriptUTxOs = await lucid.utxosAt(scriptAddress);
    console.log('Script UTxOs found:', scriptUTxOs.length);
    
    if (scriptUTxOs.length > 0) {
        console.log('First Script UTxO:', scriptUTxOs[0]);
    }

    // Filter UTxOs where the datum's owner matches the wallet's public key hash
    const utxos = scriptUTxOs.filter((utxo) => {
        try {
            const temp = Data.from(utxo.datum ?? '', DatumSchema);
            console.log('Parsed datum owner:', temp.owner);
            console.log('Public key hash:', publicKeyHash);
            if (temp.owner === publicKeyHash) {
                return true;
            }
            return false;
        } catch (e) {
            console.log('Error parsing datum:', e);
            return false;
        }
    });

    console.log('Filtered UTxOs:', utxos.length);

    if (utxos.length === 0) {
        console.log('No UTxOs found to unlock.');
        return;
    }

    // Create redeemer with "Hello world!" in hex format
    const redeemer = Data.to(new Constr(0, [utf8ToHex("Hello world!")]));
    console.log('Redeemer:', redeemer);
    
    // Unlock assets from filtered UTxOs using the validator and redeemer
    const unlockTxHash = await unlockAssets(utxos, { validator: script, redeemer });
    
    // Wait for unlock transaction confirmation
    await emulator.awaitTx(unlockTxHash);
    console.log(`Unlock tx hash: ${unlockTxHash}`);
    
    console.log("\n=== LOCK & UNLOCK COMPLETED SUCCESSFULLY ===");
}
main();