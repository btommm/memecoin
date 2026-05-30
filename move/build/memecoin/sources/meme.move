module memecoin::meme {
    use sui::coin::{Self, TreasuryCap, CoinMetadata};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::option;

    // One-time witness — must match module name in all caps
    public struct MEME has drop {}

    fun init(witness: MEME, ctx: &mut TxContext) {
        let (treasury_cap, metadata) = coin::create_currency<MEME>(
            witness,
            6,                          // decimals (6 keeps supply within u64)
            b"MEME",                    // ticker
            b"MEMECOIN",               // name
            b"The dankest coin on SUI", // description
            option::none(),             // icon URL — add later
            ctx
        );

        // Freeze metadata so it can't be changed after deploy
        transfer::public_freeze_object(metadata);

        // Send treasury cap to deployer — whoever holds this can mint
        transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
    }

    /// Mint tokens. Only callable by whoever holds TreasuryCap.
    public entry fun mint(
        treasury_cap: &mut TreasuryCap<MEME>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        coin::mint_and_transfer(treasury_cap, amount, recipient, ctx);
    }

    /// Burn tokens (optional — lets holders destroy their coins).
    public entry fun burn(
        treasury_cap: &mut TreasuryCap<MEME>,
        coin: coin::Coin<MEME>
    ) {
        coin::burn(treasury_cap, coin);
    }
}
