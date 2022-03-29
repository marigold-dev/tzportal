
## Contract

Compile contract (to check any error, and prepare the michelson outputfile to deploy later) :

```bash
ligo compile contract ./src/contract.jsligo --output-file contract.tz
```

## FA1.2

ligo compile contract ./test/fa12.jsligo --entry-point fa12Main

ligo run dry-run ./test/fa12.jsligo 'Transfer({from:"tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk" as address,to_:"tz1MoBsVL9i7eQ8ExptgRrSZDFbFZx2c8ski" as address,value:42 as nat})' '{tokens : Big_map.literal(list([ ["tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk" as address,4200 as nat] ])) as big_map<address,nat>,allowances : Big_map.empty as big_map<[address,address],nat> ,total_amount : 4200 as nat}'  --entry-point fa12Main --sender tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk --source tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk

## Run tests 

```bash
ligo run test ./test/unit_contract.jsligo
```



