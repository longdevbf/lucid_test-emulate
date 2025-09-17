import {
    Data,
    Lucid,
    SpendingValidator,
    TxHash,
    fromHex,
    toHex,
    Redeemer,
    UTxO,
    Emulator,
    Address
} from "https://deno.land/x/lucid@0.10.11/mod.ts";
import * as fc from "https://esm.sh/fast-check@3.1.1";

// Function to generate account for emulator
function generateAccount(assets: any) {
    return {
        address: "addr_test1qp32dhvj6nmhn8qjce8vsv3s0x70rrth7udxy32a7lm5yl7vchlp2ahqwyyfpv4l7fszccrngx2vcmmu5x3d3t3cy2uqpd7ewx",
        assets,
        seedPhrase: "illness tomato organ credit hybrid path slight bomb allow media credit virtual uncle blast type very certain join feed repeat elbow place aim oblige"
    };
}

// Generate beneficiary account
function generateBeneficiaryAccount(assets: any) {
    return {
        address: "addr_test1qqqt0pru382hy9vjlsxv3ye02z50sfvt8xunscg5pgden77z73dpdfng2ctw2ekqplqgrljelz7h4dneac27nn3qx3rqqpavzj",
        assets,
        seedPhrase: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art"
    };
}

// Initialize emulator with multiple accounts
const OWNER_ACCOUNT = generateAccount({ lovelace: 5000000000n });
const BENEFICIARY_ACCOUNT = generateBeneficiaryAccount({ lovelace: 5000000000n });
const emulator = new Emulator([OWNER_ACCOUNT, BENEFICIARY_ACCOUNT]);

// Initialize Lucid with Emulator
const lucid = await Lucid.new(emulator, "Preview");
async function readValidator(): Promise<SpendingValidator> {
    const validator = JSON.parse(await Deno.readTextFile("plutus.json")).validators[0];
    return {
        type: "PlutusV2",
        script: toHex(cbor.encode(fromHex(validator.compiledCode))),
    };
}
// Vesting smart contract (placeholder - you'll add the real script later)
const vestingValidator: SpendingValidator = {
    type: "PlutusV2",
    script: "5901460100003232323232323232222325333007323232533300a3370e900100089919299980619800980118050039bae3005300a00914a22a666018660026004601400e6eb8c040c044c044c0280244cc88c8c94ccc040cdc3a4004002266e2400cdd6980a18070010a50300e0013004300c3004300c00230103011301130113011301130113011300a3002300a007375a60046014012294088c8c8cc004004008894ccc04c00452809919299980919b8f00200614a2266008008002602c0046eb8c050004dd61808980918091809180918091809180918091805801118078008a503008001300130060032300c300d00114984d958c94ccc01ccdc3a40000022646464646464a66602060240042930b1bae30100013010002375c601c002601c0046eb4c030004c01401058c01400c8c014dd5000918019baa0015734aae7555cf2ab9f5742ae881" // You'll replace this with actual script
};

// Define Datum structure for vesting
const VestingDatum = Data.Object({
    lock_until: Data.Integer(), // POSIX time
    owner: Data.Bytes(), // owner's verification key hash
    beneficiary: Data.Bytes(), // beneficiary's verification key hash
});

type VestingDatum = Data.Static<typeof VestingDatum>;

// Lock function - locks ADA into vesting contract
async function lockVesting(
    lovelace: bigint, 
    { into, datum }: { into: SpendingValidator, datum: string }
): Promise<TxHash> {
    const contractAddress = lucid.utils.validatorToAddress(into);
    console.log(`Vesting Contract Address: ${contractAddress}`);

    const tx = await lucid
        .newTx()
        .payToContract(contractAddress, { inline: datum }, { lovelace })
        .complete();

    const signedTx = await tx.sign().complete();
    return signedTx.submit();
}

// Unlock function - unlocks ADA from vesting contract
async function unlockVesting(
    utxos: UTxO[], 
    currentTime: number, 
    { from, using }: { from: SpendingValidator, using: Redeemer }
): Promise<TxHash> {
    const laterTime = new Date(currentTime + 1 * 60 * 1000).getTime(); // TTL: 2 hours
    
    const tx = await lucid
        .newTx()
        .collectFrom(utxos, using)
        .addSigner(await lucid.wallet.address()) // beneficiary address
        .validFrom(currentTime)
        .validTo(laterTime)
        .attachSpendingValidator(from)
        .complete();

    const signedTx = await tx.sign().complete();
    return signedTx.submit();
}

// Main function to demonstrate vesting workflow
async function main() {
    console.log("=== VESTING CONTRACT DEMO ===\n");

    // PHASE 1: OWNER LOCKS FUNDS
    console.log("PHASE 1: Owner locks funds into vesting contract");
    
    // Select owner wallet
    lucid.selectWalletFromSeed(OWNER_ACCOUNT.seedPhrase);
    
    const ownerPublicKeyHash = lucid.utils.getAddressDetails(await lucid.wallet.address()).paymentCredential?.hash;
    const beneficiaryPublicKeyHash = lucid.utils.getAddressDetails(BENEFICIARY_ACCOUNT.address).paymentCredential?.hash;
    
    console.log(`Owner PKH: ${ownerPublicKeyHash}`);
    console.log(`Beneficiary PKH: ${beneficiaryPublicKeyHash}`);

    // Set lock time to PAST time để unlock ngay lập tức
    const lockUntil = Math.floor(Date.now() / 1000) - 3600; // 1 giờ trước (đã hết hạn)
    console.log(`Funds locked until: ${new Date(lockUntil * 1000).toISOString()}`);

    // Create vesting datum
    const vestingDatum = Data.to({
        lock_until: BigInt(lockUntil),
        owner: ownerPublicKeyHash ?? '00000000000000000000000000000000000000000000000000000000',
        beneficiary: beneficiaryPublicKeyHash ?? '00000000000000000000000000000000000000000000000000000000',
    }, VestingDatum);

    // Lock 10 ADA into vesting contract
    const lockAmount = 10000000n; // 10 ADA
    const lockTxHash = await lockVesting(lockAmount, { 
        into: vestingValidator, 
        datum: vestingDatum 
    });

    console.log(`Lock Transaction Hash: ${lockTxHash}`);
    console.log(`Locked ${Number(lockAmount) / 1000000} ADA into vesting contract\n`);

    // Wait for lock transaction confirmation
    await emulator.awaitTx(lockTxHash);
    console.log("Lock transaction confirmed!\n");

    // PHASE 2: IMMEDIATE UNLOCK (no waiting needed)
    console.log("PHASE 2: Ready to unlock immediately (lock time already passed)");
    
    // Set current time to now
    const currentTime = Date.now(); // Current time
    console.log(`Current time: ${new Date(currentTime).toISOString()}\n`);

    // PHASE 3: BENEFICIARY UNLOCKS FUNDS
    console.log("PHASE 3: Beneficiary unlocks funds");
    
    // Switch to beneficiary wallet
    lucid.selectWalletFromSeed(BENEFICIARY_ACCOUNT.seedPhrase);
    
    // Get contract address and UTxOs
    const contractAddress = lucid.utils.validatorToAddress(vestingValidator);
    const scriptUTxOs = await lucid.utxosAt(contractAddress);
    
    console.log(`Found ${scriptUTxOs.length} UTxOs at contract address`);

    // Filter UTxOs that can be unlocked by beneficiary
    const unlockableUtxos = scriptUTxOs.filter((utxo) => {
        try {
            const datum = Data.from(utxo.datum ?? '', VestingDatum);
            console.log(`Checking UTxO - Lock until: ${datum.lock_until}, Current: ${BigInt(Math.floor(currentTime / 1000))}`);
            
            return datum.beneficiary === beneficiaryPublicKeyHash &&
                   datum.lock_until <= BigInt(Math.floor(currentTime / 1000));
        } catch (e) {
            console.log('Error parsing datum:', e);
            return false;
        }
    });

    if (unlockableUtxos.length === 0) {
        console.log("No unlockable UTxOs found. Need to wait longer or check beneficiary address.");
        return;
    }

    console.log(`Found ${unlockableUtxos.length} unlockable UTxOs`);

    // Create empty redeemer for unlock
    const redeemer = Data.void();
    
    // Unlock the funds
    const unlockTxHash = await unlockVesting(unlockableUtxos, Math.floor(currentTime), {
        from: vestingValidator,
        using: redeemer
    });

    console.log(`Unlock Transaction Hash: ${unlockTxHash}`);
    
    // Wait for unlock transaction confirmation
    await emulator.awaitTx(unlockTxHash);
    console.log("Unlock transaction confirmed!");
    
    console.log("\n=== VESTING DEMO COMPLETED SUCCESSFULLY ===");
}

main().catch(console.error);
