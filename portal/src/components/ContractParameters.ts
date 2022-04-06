export abstract class ContractParameters{
}

//field order is different and important for taquito
export class ContractXTZParameters extends ContractParameters {
    type:string;
    amountToTransfer: string; //represent a nat
    l2Address: string;
    rollupAddress: string;
    constructor(amountToTransfer: string,
        l2Address: string,
        rollupAddress: string){
            super();
            this.type="xTZ_OP";
            this.amountToTransfer=amountToTransfer;
            this.l2Address=l2Address;
            this.rollupAddress=rollupAddress;
        }
}

//field order is different and important for taquito
export class ContractFA12Parameters extends ContractParameters {
    type:string;
    amountToTransfer: string; //represent a nat
    fa12Address: string;
    l2Address: string;
    rollupAddress: string;
    constructor(
        amountToTransfer: string,
        fa12Address: string,
        l2Address: string,
        rollupAddress: string,
        ){
            super();
            this.type="fA12_OP";
            this.amountToTransfer=amountToTransfer;
            this.l2Address=l2Address;
            this.rollupAddress=rollupAddress;
            this.fa12Address=fa12Address;
        }
}