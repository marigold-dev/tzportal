//order of fields is very important
export abstract class ContractParameters{
    type:string;
    amountToTransfer: string; //represent a nat, so mutez
    rollupAddress: string;
    l2Address: string;
    
    /**
     * 
     * @param type 
     * @param amountToTransfer in mutez
     * @param l2Address 
     * @param rollupAddress 
     */
    protected constructor(
        type:string,
        amountToTransfer: string,
        l2Address: string,
        rollupAddress: string){
            this.type=type;
            this.amountToTransfer=amountToTransfer;
            this.l2Address=l2Address;
            this.rollupAddress=rollupAddress;
        }
    }
    
    export class ContractXTZParameters extends ContractParameters {
        
        /**
         * 
         * @param amountToTransfer in mutez
         * @param l2Address 
         * @param rollupAddress 
         */
        constructor(amountToTransfer: string,
            l2Address: string,
            rollupAddress: string){
                super("xTZ_OP",amountToTransfer,l2Address,rollupAddress);
            }
        }
        
        export class ContractFA12Parameters extends ContractParameters {
            fa12Address: string;

            /**
             * 
             * @param amountToTransfer in mutez
             * @param fa12Address 
             * @param l2Address 
             * @param rollupAddress 
             */
            constructor(
                amountToTransfer: string,
                fa12Address: string,
                l2Address: string,
                rollupAddress: string,
                ){
                    super("fA12_OP",amountToTransfer,l2Address,rollupAddress);
                    this.fa12Address=fa12Address;
                }
            }