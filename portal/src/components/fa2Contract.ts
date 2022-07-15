import { BigMapAbstraction } from "@taquito/taquito";
import BigNumber from 'bignumber.js';

export class FA2Contract {
    ledger : BigMapAbstraction; // big_map<[address,nat],nat>
    token_metadata: BigMapAbstraction ; // big_map <nat, {token_id:nat,token_info:map<string,bytes>}>
    operators : BigMapAbstraction;  //big_map<[address, address], set<nat>>;
    token_ids : BigNumber[];
    
    constructor(ledger : BigMapAbstraction,
        token_metadata: BigMapAbstraction,
        operators : BigMapAbstraction,
        token_ids : BigNumber[]){
            this.ledger = ledger;
            this.token_metadata= token_metadata;
            this.operators = operators;
            this.token_ids = token_ids;
        }
        
    }