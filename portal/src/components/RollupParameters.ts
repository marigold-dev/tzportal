
//order of fields is very important
export abstract class RollupParameters{
    protected constructor(){ }
}


export class RollupParametersDEKU extends RollupParameters {
    
    callback : string; //contract endpoint
    data : string ; // bytes
    id : number; //nat
    owner : string ;//address
    ticketer : string; //address
    handles_hash : string ; //bytes proof will be converted to CHAR
    proofList : string[] ; //bytes array
    
    
    constructor(callback : string,
        data : string ,
        id : number,
        owner : string ,
        ticketer : string,
        handles_hash : string,
        proofList : string[]){
            super();
            this.callback =callback;
            this.data = data ; 
            this.id =id;
            this.owner =owner ;
            this.ticketer =ticketer
            this.handles_hash = handles_hash.startsWith("0x")? handles_hash.substring(2) : handles_hash ;  //removes 0x if exists
            this.proofList=proofList;
        }
    }
    
    export class RollupParametersTORU extends RollupParameters {
        //TODO
        constructor(
            ){
                super();
            }
        }