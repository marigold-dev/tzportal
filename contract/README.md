# Contract

## Compile contract (to check any error, and prepare the michelson outputfile to deploy later)

```bash
ligo compile contract ./src/contract.jsligo --output-file contract.tz --protocol nairobi

ligo compile storage ./src/contract.jsligo '{treasuryAddress : "tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk" as address,faPendingDeposits : Map.empty as faPendingMapType, faPendingWithdrawals : Map.empty as faPendingMapType}' --output-file contractStorage.tz --protocol nairobi
```

## Deploy

```bash
tezos-client originate contract tzportalNairobi transferring 0 from myFirstKey running contract.tz --init "$(cat contractStorage.tz)" --burn-cap 1 --force
```

- Jakarta : KT1WknoW9XN6ZpvsnMmsuPZ6tvTkF4FqYCQ6
- Ghostnet : KT1QvZPUoXwz5zQL6zDpFyyPp5iChbHfnXC1
- Nairobinet : KT1E8QEK4tkm1P3FRrm66hzX8zpDshBth5Lu

## Run tests

```bash
ligo run test ./test/unit_contract.jsligo
```

## Interact

```bash
ligo compile parameter ./src/contract.jsligo 'Deposit(XTZ_OP({amountToTransfer : 42000000 as nat,l2Address : L1_ADDRESS("tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk" as address) ,rollupAddress : "KT1TLVFbGtkX6bS9tUKmRGPqGtf1K6SGgqXK" as address}))' --output-file contractParameter.tz  --protocol nairobi

(or FA1.2
ligo compile parameter ./src/contract.jsligo 'Deposit(FA12_OP({amountToTransfer : 1 as nat,fa12Address : "KT1WnDswMHZefo2fym6Q9c8hnL3sEuzFb2Dt" as address,l2Address : "tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk" as address,rollupAddress : "txr1Q4iYZti8wfKXJi9CyagSnAHCogzX877kD" as address}))' --output-file contractParameter.tz  --protocol nairobi
)


tezos-client transfer 42 from myFirstKey to KT1Ci5heqWbRmxM98769W7jqVxCZ9zZUQ31o --arg '(Left (Right (Pair 42000000 "KT1TLVFbGtkX6bS9tUKmRGPqGtf1K6SGgqXK" (Left "tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk"))))' --burn-cap 1
```

# FA1.2 Contract

## Ctez

ligo compile contract ./test/fa12.mligo --entry-point main --output-file ./test/fa12.tz --protocol nairobi

ligo compile storage ./test/fa12.mligo "$(cat ./test/fa12_ctez_storage.mligo)" --entry-point main --output-file ./test/fa12_ctez_storage.tz --protocol nairobi

tezos-client originate contract fa12CTEZNairobinet transferring 0 from alice running ./test/fa12.tz --init "$(cat ./test/fa12_ctez_storage.tz)" --burn-cap 1 --force

## kusd

ligo compile contract ./test/fa12.mligo --entry-point main --output-file ./test/fa12.tz --protocol nairobi

ligo compile storage ./test/fa12.mligo "$(cat ./test/fa12_kusd_storage.mligo)" --entry-point main --output-file ./test/fa12_kusd_storage.tz --protocol nairobi

tezos-client originate contract fa12KUSDNairobinet transferring 0 from alice running ./test/fa12.tz --init "$(cat ./test/fa12_kusd_storage.tz)" --burn-cap 1 --force

# FA2 Contract

### uUSD

ligo compile contract ./test/fa2.jsligo --output-file ./test/fa2.tz --protocol nairobi

ligo compile storage ./test/fa2.jsligo "$(cat ./test/fa2_uUSD_storage.jsligo)" --output-file ./test/fa2_uUSD_storage.tz --protocol nairobi

```
ligo compile parameter ./test/fa2.jsligo 'Transfer(list([{ from_ : "tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk" as address, txs : list([ { to_ : "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb" as address, token_id : (0 as nat), amount : (10000000000 as nat) } ]) as list</* @layout comb */ { to_: address, token_id: nat, amount: nat }> }]))' --output-file ./test/fa2Parameter.tz --protocol nairobi
```

octez-client originate contract fa2uUSDNairobinet transferring 0 from alice running ./test/fa2.tz --init "$(cat ./test/fa2_uUSD_storage.tz)" --burn-cap 1 --force

octez-client transfer 0 from myFirstKey to fa2uUSDNairobinet --arg "$(cat ./test/fa2Parameter.tz)" --burn-cap 1

## EURL

ligo compile contract ./test/fa2.jsligo --output-file ./test/fa2.tz --protocol nairobi

ligo compile storage ./test/fa2.jsligo "$(cat ./test/fa2_EURL_storage.jsligo)" --output-file ./test/fa2_EURL_storage.tz --protocol nairobi

```
ligo compile parameter ./test/fa2.jsligo 'Transfer(list([{ from_ : "tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk" as address, txs : list([ { to_ : "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb" as address, token_id : (0 as nat), amount : (10000000000 as nat) } ]) as list</* @layout comb */ { to_: address, token_id: nat, amount: nat }> }]))' --output-file ./test/fa2Parameter.tz --protocol nairobi
```

octez-client originate contract fa2EURLNairobinet transferring 0 from alice running ./test/fa2.tz --init "$(cat ./test/fa2_EURL_storage.tz)" --burn-cap 1 --force

octez-client transfer 0 from myFirstKey to fa2EURLNairobinet --arg "$(cat ./test/fa2Parameter.tz)" --burn-cap 1

## USDt

ligo compile contract ./test/fa2.jsligo --output-file ./test/fa2.tz --protocol nairobi

ligo compile storage ./test/fa2.jsligo "$(cat ./test/fa2_USDt_storage.jsligo)" --output-file ./test/fa2_USDt_storage.tz --protocol nairobi

```
ligo compile parameter ./test/fa2.jsligo 'Transfer(list([{ from_ : "tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk" as address, txs : list([ { to_ : "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb" as address, token_id : (0 as nat), amount : (10000000000 as nat) } ]) as list</* @layout comb */ { to_: address, token_id: nat, amount: nat }> }]))' --output-file ./test/fa2Parameter.tz --protocol nairobi
```

octez-client originate contract fa2USDtNairobinet transferring 0 from alice running ./test/fa2.tz --init "$(cat ./test/fa2_USDt_storage.tz)" --burn-cap 1 --force

octez-client transfer 0 from myFirstKey to fa2USDtNairobinet --arg "$(cat ./test/fa2Parameter.tz)" --burn-cap 1

# Mocked rollup Contract

## compile

```
ligo compile contract ./test/mock_deku_rollup.jsligo --output-file ./test/mock_deku_rollup.tz --protocol nairobi
```

## deploy

```
tezos-client originate contract mock_rollup transferring 0 from myFirstKey running ./test/mock_rollup.tz  --init "{}"  --burn-cap 1
```

# REAL Rollup

Originate

```bash
tezos-client originate tx rollup from myFirstKey --burn-cap 100
```

> BMLz4JnaDS7yUNtF51EWrspUEKAzWsikcrkbpTtmuJ8rzQcQdQt
> tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk
> txr1Q4iYZti8wfKXJi9CyagSnAHCogzX877kD

Submit operations

```bash
tezos-client submit tx rollup batch 0x626c6f62 to txr1Q4iYZti8wfKXJi9CyagSnAHCogzX877kD from tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk
```

Watch the inbox

```bash
tezos-client rpc get /chains/main/blocks/head/context/tx_rollup/txr1Q4iYZti8wfKXJi9CyagSnAHCogzX877kD/inbox/0
```

# CFMM

We deploy a modified version of the ctez CFMM that swap 1 XTZ against 1 CTEZ with a 1:1 peg.
Goal is to avoid to deploy the full Ctez ecosystem and/or depends on ctez team deployments on testnets. It means no ovens or liquidity pools.

## Build and deploy cfmm

```bash
FA12_CTEZ_ADDRESS=`tezos-client show known contract fa12CTEZGhostnet`
ligo compile contract ./test/cfmm_tez_ctez.mligo --output-file ./test/cfmm.tz
sed s/FA12_CTEZ/${FA12_CTEZ_ADDRESS}/ < ./test/cfmm_initial_storage.mligo | sed s/CTEZ_ADDRESS/${FA12_CTEZ_ADDRESS}/ > ./test/cfmm_storage.mligo

ligo compile storage ./test/cfmm_tez_ctez.mligo "$(<./test/cfmm_storage.mligo)" --output-file ./test/cfmm_storage.tz
tezos-client originate contract cfmm transferring 0.000001 from myFirstKey running 'file:./test/cfmm.tz' --init "$(<./test/cfmm_storage.tz)" --burn-cap 10 --force
CFMM_ADDRESS=`tezos-client show known contract cfmm`
```
