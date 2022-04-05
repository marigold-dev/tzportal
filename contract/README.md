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


# FA1.2 Contract

ligo compile contract ./test/fa12.jsligo --entry-point fa12Main --output-file ./test/fa12.tz

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

