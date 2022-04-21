# Contract

## Compile contract (to check any error, and prepare the michelson outputfile to deploy later) 

```bash
ligo compile contract ./src/contract.jsligo --output-file contract.tz
```

## Deploy

```bash
tezos-client originate contract tzportal transferring 0 from myFirstKey running contract.tz --burn-cap 1
```

## Run tests 

```bash
ligo run test ./test/unit_contract.jsligo
```

## Interact

```bash
ligo compile parameter ./src/contract.jsligo 'Deposit(FA12_OP({amountToTransfer : 1 as nat,fa12Address : "KT1WnDswMHZefo2fym6Q9c8hnL3sEuzFb2Dt" as address,l2Address : "tz1h5GajcQWq4ybaWuwSiYrR5PvmUxndm8T8" as address,rollupAddress : "KT1UwCd8rNCATj2mwC5UgEo4uqPRVqfjRPa6" as address}))' --output-file contractParameter.tz --entry-point main

tezos-client transfer 0 from myFirstKey to tzportalIthaca --arg '(Left (Left (Pair 1 "KT1UwCd8rNCATj2mwC5UgEo4uqPRVqfjRPa6" "tz1h5GajcQWq4ybaWuwSiYrR5PvmUxndm8T8" "KT1WnDswMHZefo2fym6Q9c8hnL3sEuzFb2Dt")))' --burn-cap 1
```

# FA1.2 Contract

ligo compile contract ./test/fa12.mligo --entry-point main --output-file ./test/fa12.tz

ligo compile parameter ./test/fa12.mligo 'Approve({spender = ("KT19mzgsjrR2Er4rm4vuDqAcMfBF5DBMs2uq" : address) ; value = 10000n})' --output-file fa12Parameter.tz --entry-point main

tezos-client originate contract fa12 transferring 0 from faucet running ./test/fa12.tz --burn-cap 1

tezos-client transfer 0 from myFirstKey to fa12Ithaca --arg '(Left (Left (Left (Pair "KT19mzgsjrR2Er4rm4vuDqAcMfBF5DBMs2uq" 10000))))' --burn-cap 1

ligo run dry-run ./test/fa12.jsligo 'Transfer({from:"tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk" as address,to_:"tz1MoBsVL9i7eQ8ExptgRrSZDFbFZx2c8ski" as address,value:42 as nat})' '{tokens : Big_map.literal(list([ ["tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk" as address,4200 as nat] ])) as big_map<address,nat>,allowances : Big_map.empty as big_map<[address,address],nat> ,total_amount : 4200 as nat}'  --entry-point fa12Main --sender tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk --source tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk

# Mock rollup Contract


## compile

```
ligo compile contract ./test/mock_rollup.jsligo --entry-point rollupMain --output-file ./test/mock_rollup.tz
```



## deploy

```
tezos-client originate contract mock_rollup transferring 0 from myFirstKey running ./test/mock_rollup.tz  --init "{}"  --burn-cap 1
```

# Mondaynet

docker run -it -v $(pwd)/contract:/home/tezos/contract --entrypoint=/bin/sh tezos/tezos:master_03ae1d6e_20220415153900

tezos-client --endpoint https://rpc.mondaynet-2022-04-18.teztnets.xyz config update

cd contract

tezos-client originate contract tzportal transferring 0 from faucet running contract.tz --burn-cap 4

tezos-client originate tx rollup from faucet --burn-cap 100 
>BLpQoYX67VrmVtMLLLf7DybwXdMfP6vQK58eiJtQaDxXip8k7Pi
>tz1d3AECjwyuCh4N1X2Tkeekg8MePmkezb4n
>txr1gUvdTePzgEmg9SsA31pbGyU73fVCqZmUA

tezos-client originate contract fa12 transferring 0 from faucet running ./test/fa12.tz --burn-cap 4

