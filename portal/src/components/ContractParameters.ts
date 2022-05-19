import { AddressType } from "./TezosUtils";


//order of fields is very important
export abstract class ContractParameters{
    type:string;
    amountToTransfer: string; //represent a nat, so mutez
    rollupAddress: string;
    addressType : AddressType; // "l1_ADDRESS" or "l2_ADDRESS"
    l2Address: string; // layer 1 or 2 address
    
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
        addressType : AddressType,
        l2Address: string,
        rollupAddress: string){
            this.type=type;
            this.amountToTransfer=amountToTransfer;
            this.addressType=addressType;
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
        constructor(amountToTransfer: string,addressType : AddressType,
            l2Address: any,
            rollupAddress: string){
                super("xTZ_OP",amountToTransfer,addressType,l2Address,rollupAddress);
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
                addressType : AddressType,
                l2Address: string,
                rollupAddress: string,
                ){
                    super("fA12_OP",amountToTransfer,addressType,l2Address,rollupAddress);
                    this.fa12Address=fa12Address;
                }
            }