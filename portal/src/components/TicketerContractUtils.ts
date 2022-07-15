import { MichelsonMap } from "@taquito/taquito";
import { LAYER2Type, LAYER2TypeClass } from "./TezosUtils";
import BigNumber from 'bignumber.js';


export class ContractFAStorage {
    type:string; //
    amountToTransfer: BigNumber; //represent a nat, so mutez
    rollupAddress: string;
    l2Type: LAYER2TypeClass; // layer 1 or 2 address
    faAddress: string;
    
    /**
     * 
     * @param type 
     * @param amountToTransfer in mutez
     * @param l2Address 
     * @param rollupAddress 
     */
    protected constructor(
        type:string,
        amountToTransfer: BigNumber,
        l2Type: LAYER2TypeClass,
        rollupAddress: string,
        faAddress: string){
            this.type=type;
            this.amountToTransfer=amountToTransfer;
            this.l2Type=l2Type;
            this.rollupAddress=rollupAddress;
            this.faAddress=faAddress;
        }
}

export class ContractStorage{
    faPendingDeposits!: MichelsonMap<[string,string],ContractFAStorage>;
    faPendingWithdrawals!: MichelsonMap<[string,string],ContractFAStorage>;
    treasuryAddress! : string;
}

//order of fields is very important
export abstract class ContractParameters{
    type:string;
    amountToTransfer: BigNumber; //represent a nat, so mutez
    rollupAddress: string;
    l2Type: LAYER2Type; // "l2_DEKU" or "l2_TORU" or "l2_CHUSAI"
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
        amountToTransfer: BigNumber,
        l2Type: LAYER2Type,
        l2Address: string,
        rollupAddress: string){
            this.type=type;
            this.amountToTransfer=amountToTransfer;
            this.l2Type=l2Type;
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
        constructor(amountToTransfer: BigNumber,l2Type : LAYER2Type,
            l2Address: any,
            rollupAddress: string){
                super("xTZ_OP",amountToTransfer,l2Type,l2Address,rollupAddress);
            }
        }
        
        export class ContractFAParameters extends ContractParameters {
            faAddress: string;

            /**
             * 
             * @param amountToTransfer in mutez
             * @param faAddress 
             * @param l2Address 
             * @param rollupAddress 
             */
            constructor(
                amountToTransfer: BigNumber,
                faAddress: string,
                l2Type: LAYER2Type,
                l2Address: string,
                rollupAddress: string,
                ){
                    super("fA_OP",amountToTransfer,l2Type,l2Address,rollupAddress);
                    this.faAddress=faAddress;
                }
            }