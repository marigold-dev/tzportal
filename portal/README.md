# Run the web app

`yarn run start:ghostnet`

# SCORU

https://tezos.gitlab.io/alpha/smart_rollups.html#deploying-a-rollup-node

Fo Mondaynet (alice needs at minimum 10k XTZ to be staker):

sudo octez-client --endpoint https://rpc.mondaynet-2022-12-19.teztnets.xyz config update
sudo octez-client rpc get /chains/main/blocks/head/protocols
sudo octez-client get balance for alice

docker run -it --name tezos -v $(pwd)/scoru:/home/tezos --entrypoint=/bin/sh tezos/tezos:master_c08dbd3e_20221216223044

// go inside the container now

OCLIENT_DIR=.tezos-client
SOR_ADDR=sr1PJaDKN2LXZamH1XgcPYVZTmUyuCtNvk7R
OPERATOR_ADDR=tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb
ROLLUP_NODE_DIR=rollup_node_config
NETWORK=https://teztnets.xyz/mondaynet-2022-12-19
ONODE_DIR=.tezos-node

//run octez node
octez-node config init --data-dir "${ONODE_DIR}" --network "${NETWORK}"
octez-node run --data-dir "${ONODE_DIR}" --network "${NETWORK}" --rpc-addr 127.0.0.1 > node.log &

//configure alice account
octez-client import secret key alice unencrypted:edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq --force
octez-client --endpoint https://rpc.mondaynet-2022-12-19.teztnets.xyz config update
octez-client get balance for alice

//run rollup node
octez-sc-rollup-node-alpha --base-dir "${OCLIENT_DIR}" init operator config for "${SOR_ADDR}" with operators "${OPERATOR_ADDR}" --data-dir "${ROLLUP_NODE_DIR}"
octez-sc-rollup-node-alpha --base-dir "${OCLIENT_DIR}" run --data-dir "${ROLLUP_NODE_DIR}"

- HOW TO CREATE A L2 ACCOUNT ?
  NO_PIXEL_ADDR=be6e7e820318ba912440d2ac1afb29a8fc85a1b8 : hex

- DEPOSIT (L1 op)

user to ticketer
SC_ROLLUP_HASH=sr1BG5ymxo55f1HMgrwJR2nRqE8pdwoZatWk
NO_PIXEL_ADDR=be6e7e820318ba912440d2ac1afb29a8fc85a1b8
octez-client transfer 0 from alice to KT1CGZg9EftVRdbsxZjMnSmXG4uqjKkzujJX --arg "Pair (Pair \"$SC_ROLLUP_HASH\" \"$NO_PIXEL_ADDR\") (Pair 1275000 \"R\")" --burn-cap 1

ticketer contract : transfer( [address , ticket<string>],fee, smartcontract ) only for now
https://gist.github.com/jobjo/c77c7570e49b87fc192a43d388639be4

- GET BALANCE (L2 op read)
  octez-sc-rollup-client-alpha getValueFor alice

- WITHDRAW

  - external message : bytes ("CODE withdraw X tickets from alice") => level
  - wait cementation period min/hours on testnet
  - anyone can request outbox proof on L1 on this level => proof
  - managed operation : octez-client sc execute outbox proof

- TRANSFER (L2 op write)
  octez-sc-rollup-client-alpha transfer alice to bob

MILESTONES

- 1M TPS demo -> perf
- ticket<bytes> ? January recontact on first week
- getbalance ? January
- transfer ? January
