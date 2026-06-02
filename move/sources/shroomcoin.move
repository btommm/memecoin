module shroomcoin::shroom {
    use sui::coin::{Self, TreasuryCap};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::option;

    public struct SHROOM has drop {}

    fun init(witness: SHROOM, ctx: &mut TxContext) {
        let (treasury_cap, metadata) = coin::create_currency<SHROOM>(
            witness,
            6,
            b"SHROOM",
            b"SHROOM Coin",
            b"The dankest mushroom on SUI. 1 trillion supply. Zero tax. Pure spores.",
            option::none(),
            ctx
        );
        transfer::public_freeze_object(metadata);
        transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
    }

    public entry fun mint(
        treasury_cap: &mut TreasuryCap<SHROOM>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        coin::mint_and_transfer(treasury_cap, amount, recipient, ctx);
    }

    public entry fun burn(
        treasury_cap: &mut TreasuryCap<SHROOM>,
        coin: coin::Coin<SHROOM>
    ) {
        coin::burn(treasury_cap, coin);
    }
}
