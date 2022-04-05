import { BigMapAbstraction } from "@taquito/taquito";
import BigNumber from 'bignumber.js';

export class FA12Contract {

admin: string;
allowances: BigMapAbstraction ;
metadata: BigMapAbstraction ;
token_metadata: BigMapAbstraction ;
tokens: BigMapAbstraction ;
total_supply: BigNumber ;

constructor(admin: string,
    allowances: BigMapAbstraction,
    metadata: BigMapAbstraction,
    token_metadata: BigMapAbstraction,
    tokens: BigMapAbstraction,
    total_supply: BigNumber){
        this.admin=admin;
        this.allowances=allowances;
        this.metadata=metadata;
        this.token_metadata=token_metadata;
        this.tokens=tokens;
        this.total_supply=total_supply;
}

}