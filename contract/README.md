

Compile contract (to check any error, and prepare the michelson outputfile to deploy later) :

```bash
ligo compile contract ./src/contract.jsligo --output-file contract.tz
```

Run tests 

```bash
ligo run test ./test/unit_contract.jsligo
```
