# Contract

## Compile contract (to check any error, and prepare the michelson outputfile to deploy later) 

```bash
ligo compile contract ./src/contract.jsligo --output-file contract.tz --protocol jakarta

ligo compile storage ./src/contract.jsligo '{treasuryAddress : "tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk" as address,fa12PendingDeposits : Map.empty as fa12PendingMapType, fa12PendingWithdrawals : Map.empty as fa12PendingMapType}' --output-file contractStorage.tz --protocol jakarta
```

## Deploy

```bash
tezos-client originate contract tzportalIthaca transferring 0 from myFirstKey running contract.tz --init "$(cat contractStorage.tz)" --burn-cap 1 --force
```
> - Ithaca : KT1Kk2QwSaF8SU89DqWBFG6qtB73yeWLFT9d
> - Jakarta : KT1CLTN23c3DEwUKWeUfw7QQS3dqc36eYZT3

## Run tests 

```bash
ligo run test ./test/unit_contract.jsligo
```

## Interact

```bash
ligo compile parameter ./src/contract.jsligo 'Deposit(XTZ_OP({amountToTransfer : 42000000 as nat,l2Address : L1_ADDRESS("tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk" as address) ,rollupAddress : "KT1TLVFbGtkX6bS9tUKmRGPqGtf1K6SGgqXK" as address}))' --output-file contractParameter.tz 

(or FA1.2
ligo compile parameter ./src/contract.jsligo 'Deposit(FA12_OP({amountToTransfer : 1 as nat,fa12Address : "KT1WnDswMHZefo2fym6Q9c8hnL3sEuzFb2Dt" as address,l2Address : "tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk" as address,rollupAddress : "txr1Q4iYZti8wfKXJi9CyagSnAHCogzX877kD" as address}))' --output-file contractParameter.tz 
)


tezos-client transfer 42 from myFirstKey to KT1Ci5heqWbRmxM98769W7jqVxCZ9zZUQ31o --arg '(Left (Right (Pair 42000000 "KT1TLVFbGtkX6bS9tUKmRGPqGtf1K6SGgqXK" (Left "tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk"))))' --burn-cap 1
```

# FA1.2 Contract

ligo compile contract ./test/fa12.mligo --entry-point main --output-file ./test/fa12.tz

ligo compile storage ./test/fa12.mligo "$(cat ./test/fa12_storage.mligo)" --entry-point main  --output-file ./test/fa12_storage.tz

ligo compile parameter ./test/fa12.mligo 'Approve({spender = ("KT1LZANqpM24Adb5Rp7GLXdd4g9sV4v8yDnw" : address) ; value = 10000n})' --output-file fa12Parameter.tz --entry-point main

tezos-client originate contract fa12Jakarta transferring 0 from faucetJakarta running ./test/fa12.tz --init "$(cat ./test/fa12_storage.tz)"   --burn-cap 1

tezos-client transfer 0 from myFirstKey to fa12Jakarta --arg '(Left (Left (Left (Pair "KT1LZANqpM24Adb5Rp7GLXdd4g9sV4v8yDnw" 10000))))' --burn-cap 1

ligo run dry-run ./test/fa12.jsligo 'Transfer({from:"tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk" as address,to_:"tz1MoBsVL9i7eQ8ExptgRrSZDFbFZx2c8ski" as address,value:42 as nat})' '{tokens : Big_map.literal(list([ ["tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk" as address,4200 as nat] ])) as big_map<address,nat>,allowances : Big_map.empty as big_map<[address,address],nat> ,total_amount : 4200 as nat}'  --entry-point fa12Main --sender tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk --source tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk

# Mocked rollup Contract


## compile

```
ligo compile contract ./test/mock_deku_rollup.jsligo --entry-point main --output-file ./test/mock_deku_rollup.tz
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
>BMLz4JnaDS7yUNtF51EWrspUEKAzWsikcrkbpTtmuJ8rzQcQdQt
>tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk
>txr1Q4iYZti8wfKXJi9CyagSnAHCogzX877kD

Submit operations

```bash
tezos-client submit tx rollup batch 0x626c6f62 to txr1Q4iYZti8wfKXJi9CyagSnAHCogzX877kD from tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk
```

Watch the inbox

```bash
tezos-client rpc get /chains/main/blocks/head/context/tx_rollup/txr1Q4iYZti8wfKXJi9CyagSnAHCogzX877kD/inbox/0
```

