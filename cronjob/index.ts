import { MichelsonMap, OpKind, TezosToolkit, WalletContract, WalletOperationBatch, WalletParamsWithKind } from "@taquito/taquito";
import { InMemorySigner } from "@taquito/signer";
import { config } from "dotenv";
import { ContractFA12Storage, ContractStorage } from "../portal/src/components/TicketerContractUtils";
import { LAYER2Type } from "../portal/src/components/TezosUtils";

// Set's up our environment variables from the file .env
config();

const TEZOS_RPC_URL = process.env.TEZOS_RPC_URL!;
const TEZOS_RPC_ADDRESS = process.env.TEZOS_RPC_ADDRESS!; //tzportal KT1 smart contract
const TEZOS_SECRET_KEY = process.env.TEZOS_SECRET_KEY!;  //it has to be the administrator of TzPortal === Treasury address
const TEZOS_NETWORK = process.env.TEZOS_NETWORK || "mainnet"
const TIME = parseInt(process.env.TIME) || 15000;
const AMMOUNT = parseInt(process.env.AMMOUNT) || 0;
const CONFIRMATION = parseInt(process.env.CONFIRMATION) || 1;

const Tezos = new TezosToolkit(TEZOS_RPC_URL);

Tezos.setProvider({ signer: new InMemorySigner(TEZOS_SECRET_KEY) });


const handlePendingDeposit = async (from : string,tokenTypeBytes : string,  contractFA12Storage: ContractFA12Storage,contractStorage : ContractStorage, contract : WalletContract ) : Promise<WalletParamsWithKind[]> => {
  
  return new Promise( async (resolve, reject) => 
  {
    
    const operations : WalletParamsWithKind[]= [];
    
    try{
      
      
      console.log("from",from);
      
      //1. Treasury takes tokens
      let fa12Contract : WalletContract = await Tezos.wallet.at(contractFA12Storage.fa12Address); 
      console.log("Treasury has batched collaterization "+contractFA12Storage.amountToTransfer.toNumber()+" tokens from "+from );        
      
      operations.push(
        {
          kind: OpKind.TRANSACTION,
          ...fa12Contract.methods.transfer(from,contractStorage.treasuryAddress,contractFA12Storage.amountToTransfer.toNumber()).toTransferParams()
        }
        );
        
      }catch (error : any) {
        console.table(`Error: ${JSON.stringify(error, null, 2)}`);
        reject(`Error: ${JSON.stringify(error, null, 2)}`);
      } 
      
      try{
        
        //2. Treasury call pending deposit to create tickets and send it
        let l2Type : LAYER2Type = contractFA12Storage.l2Type.l2_TORU && contractFA12Storage.l2Type.l2_TORU !== "" ?  
        LAYER2Type.L2_TORU: contractFA12Storage.l2Type.l2_DEKU && contractFA12Storage.l2Type.l2_DEKU !== "" ? LAYER2Type.L2_DEKU :LAYER2Type.L2_CHUSAI ;
        const param = l2Type == LAYER2Type.L2_TORU?
        {
          "address": from,
          "amountToTransfer": contractFA12Storage.amountToTransfer.toNumber(),
          "rollupAddress": contractFA12Storage.rollupAddress,
          "l2Type": l2Type,
          "l2_TORU": contractFA12Storage.l2Type.l2_TORU,
          "fa12Address": contractFA12Storage.fa12Address
        }: l2Type == LAYER2Type.L2_DEKU?
        {
          "address": from,
          "amountToTransfer": contractFA12Storage.amountToTransfer.toNumber(),
          "rollupAddress": contractFA12Storage.rollupAddress,
          "l2Type": l2Type,
          "l2_DEKU": contractFA12Storage.l2Type.l2_DEKU,
          "fa12Address": contractFA12Storage.fa12Address
        }:
        {
          "address": from,
          "amountToTransfer": contractFA12Storage.amountToTransfer.toNumber(),
          "rollupAddress": contractFA12Storage.rollupAddress,
          "l2Type": l2Type,
          "l2_CHUSAI": contractFA12Storage.l2Type.l2_CHUSAI,
          "fa12Address": contractFA12Storage.fa12Address
        }
        
        operations.push({
          kind: OpKind.TRANSACTION,
          ...contract!.methods.pendingDeposit(...Object.values(param)).toTransferParams()
        })
        
        console.log("Pending deposit from "+from+" has been successfully processed on ticket type "+tokenTypeBytes);
        
        resolve(operations);
        
      }catch (error : any) {
        console.table(`Error: ${JSON.stringify(error, null, 2)}`);
        reject(`Error: ${JSON.stringify(error, null, 2)}`);
      }
      
    }
    );
    
  }
  
  const handlePendingWithdraw = async (to : string,tokenTypeBytes : string,  contractFA12Storage: ContractFA12Storage,contractStorage : ContractStorage, contract : WalletContract) : Promise<WalletParamsWithKind[]> => {
    
    return new Promise( async (resolve, reject) => 
    {
      
      const operations : WalletParamsWithKind[]= [];
      
      try{
        
        //1. Treasury call pending withdraw to destroy tickets
        
        let l2Type : LAYER2Type = contractFA12Storage.l2Type.l2_TORU && contractFA12Storage.l2Type.l2_TORU !== "" ?  
        LAYER2Type.L2_TORU: contractFA12Storage.l2Type.l2_DEKU && contractFA12Storage.l2Type.l2_DEKU !== "" ? LAYER2Type.L2_DEKU :LAYER2Type.L2_CHUSAI ;
        
        const param = l2Type == LAYER2Type.L2_TORU?
        {
          "address": to,
          "amountToTransfer": contractFA12Storage.amountToTransfer.toNumber(),
          "rollupAddress": contractFA12Storage.rollupAddress,
          "l2Type": l2Type,
          "l2_TORU": contractFA12Storage.l2Type.l2_TORU,
          "fa12Address": contractFA12Storage.fa12Address
        }: l2Type == LAYER2Type.L2_DEKU?
        {
          "address": to,
          "amountToTransfer": contractFA12Storage.amountToTransfer.toNumber(),
          "rollupAddress": contractFA12Storage.rollupAddress,
          "l2Type": l2Type,
          "l2_DEKU": contractFA12Storage.l2Type.l2_DEKU,
          "fa12Address": contractFA12Storage.fa12Address
        }:
        {
          "address": to,
          "amountToTransfer": contractFA12Storage.amountToTransfer.toNumber(),
          "rollupAddress": contractFA12Storage.rollupAddress,
          "l2Type": l2Type,
          "l2_CHUSAI": contractFA12Storage.l2Type.l2_CHUSAI,
          "fa12Address": contractFA12Storage.fa12Address
        }
        
        //console.log("param",param);
        
        operations.push({
          kind: OpKind.TRANSACTION,
          ...contract!.methods.withdrawPendingDEKU(...Object.values(param)).toTransferParams()
        })
        
        console.log("Pending withdraw for "+to+" has been successfully batched");
        
      }catch (error : any) {
        console.table(`Error: ${JSON.stringify(error, null, 2)}`);
        reject(error);
      }
      
      
      try{
        
        //2. Treasury give back tokens
        let fa12Contract : WalletContract = await Tezos.wallet.at(contractFA12Storage.fa12Address);
        
        console.log("contractFA12Storage.fa12Address",contractFA12Storage.fa12Address);
        
        operations.push({
          kind: OpKind.TRANSACTION,
          ...fa12Contract.methods.transfer(contractStorage?.treasuryAddress,to,contractFA12Storage.amountToTransfer.toNumber()).toTransferParams()
        })
        
        
        console.log("Treasury gave back  "+contractFA12Storage.amountToTransfer.toNumber()+" tokens to "+to+ " on ticket type "+tokenTypeBytes);        
        
        resolve(operations);

      }catch (error : any) {
        console.table(`Error: ${JSON.stringify(error, null, 2)}`);
        reject(error);
      }
    }
    );
    
  }
  
  /**
  * Look at TzPortal storage to find pending deposit or withdrawal.
  * For each pending, prepare a batch transaction to call the same function handlePendingDeposit on portal/src/components/Deposit.tsx or function handlePendingWithdraw on portal/src/components/withdraw.tsx.
  * Today the administrator does it manually, for better UX experience, we prefer to have a batch that does this under the hood.
  */
  const job = async () => {
    
    const c : WalletContract = await Tezos.wallet.at(TEZOS_RPC_ADDRESS);
    const store : ContractStorage = await c?.storage<ContractStorage>(); //copy fields
    
    
    let operations : WalletParamsWithKind[] = [] ;
    
    if (store.fa12PendingDeposits.size > 0) {
      
      console.log(`Found ${store.fa12PendingDeposits.size} pending deposit to execute`);
      
      
      for(let fa12PendingDeposit of store.fa12PendingDeposits.entries()) {
        let [key , deposit] = fa12PendingDeposit;
        let ops = await handlePendingDeposit(key[0],key[1],deposit,store,c);
        operations.push(... ops);
        console.log(`1 pending deposit batched`);
      };
      
      
    }  
    
    if (store.fa12PendingWithdrawals.size > 0) {
      
      console.log(`Found ${store.fa12PendingWithdrawals.size} pending withdrawal to execute`);
      
      for(let fa12PendingWithdrawal of store.fa12PendingWithdrawals.entries()) {
        let [key , withdraw] = fa12PendingWithdrawal;
        let ops = await handlePendingWithdraw(key[0],key[1],withdraw,store,c);
        operations.push(... ops);
        console.log(`1 pending withdraw batched`);
      };
      
    }  
    
    
    if(operations.length > 0){
      
      try {
        const batch : WalletOperationBatch = await Tezos.wallet.batch(operations);
        const batchOp = await batch.send();
        const br = await batchOp.confirmation(CONFIRMATION);
        
        console.log(`Treasury has processed ${operations.length} operations`);
        
      } catch (error) {
        console.log(error);
      }
      return;  
    }
    else {
      console.log(`There is no pending deposits or withdrawals, sleep ${TIME} and check again`);
      return;
    }
    
  }
  
  const cron = () => new Promise(resolve => setTimeout(resolve, TIME));
  
  (async function cronjob() {
    try {
      await job();
    } catch (error) {
      console.error((error as any).message);
    }
    await cron();
    await cronjob();
  })();