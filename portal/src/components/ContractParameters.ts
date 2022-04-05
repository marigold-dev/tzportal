export abstract class ContractParameters{
    amountToTransfer: string; //represent a nat
    l2Address: string;
    rollupAddress: string;

    constructor(amountToTransfer: string,
        l2Address: string,
        rollupAddress: string){
            this.amountToTransfer=amountToTransfer;
            this.l2Address=l2Address;
            this.rollupAddress=rollupAddress;
        }
}

export class ContractXTZParameters extends ContractParameters {
    constructor(amountToTransfer: string,
        l2Address: string,
        rollupAddress: string){
            super(amountToTransfer,l2Address,rollupAddress);
        }
}

export class ContractFA12Parameters extends ContractParameters {
    fa12Address: string;
    constructor(amountToTransfer: string,
        l2Address: string,
        rollupAddress: string,
        fa12Address: string){
            super(amountToTransfer,l2Address,rollupAddress);
            this.fa12Address=fa12Address;
        }
}