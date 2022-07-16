import { MichelsonMap, OpKind, TezosToolkit, WalletContract, WalletOperationBatch, WalletParamsWithKind } from "@taquito/taquito";
import { InMemorySigner } from "@taquito/signer";
import { config } from "dotenv";
import { ContractFAStorage, ContractStorage } from "../portal/src/components/TicketerContractUtils";
import { getTokenBytes, LAYER2Type, TOKEN_TYPE } from "../portal/src/components/TezosUtils";

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


const handlePendingDeposit = async (from : string,tokenTypeBytes : string,  contractFAStorage: ContractFAStorage,contractStorage : ContractStorage, contract : WalletContract ) : Promise<WalletParamsWithKind[]> => {
  


  return new Promise( async (resolve, reject) => 
  {
    let tokenBytes = await getTokenBytes();
    let ticketTokenType : string = tokenBytes.get(TOKEN_TYPE.XTZ) == tokenTypeBytes? TOKEN_TYPE.XTZ : tokenBytes.get(TOKEN_TYPE.CTEZ) == tokenTypeBytes ?  TOKEN_TYPE.CTEZ : tokenBytes.get(TOKEN_TYPE.KUSD) == tokenTypeBytes ?  TOKEN_TYPE.KUSD : tokenBytes.get(TOKEN_TYPE.UUSD) == tokenTypeBytes ?  TOKEN_TYPE.UUSD : TOKEN_TYPE.EURL ;


    const operations : WalletParamsWithKind[]= [];
    
    try{
      
      
      console.log("from",from);
      

         //1.a for FA1.2
         if(ticketTokenType === TOKEN_TYPE.CTEZ || ticketTokenType === TOKEN_TYPE.KUSD){
          let fa12Contract : WalletContract = await Tezos.wallet.at(contractFAStorage.faAddress);
          operations.push({
              kind: OpKind.TRANSACTION,
              ...fa12Contract.methods.transfer(from,contractStorage?.treasuryAddress,contractFAStorage.amountToTransfer.toNumber()).toTransferParams()
          });
      }
          //1.B for FA2
          if(ticketTokenType === TOKEN_TYPE.UUSD || ticketTokenType === TOKEN_TYPE.EURL){
              let fa2Contract : WalletContract = await Tezos.wallet.at(contractFAStorage.faAddress);
              operations.push({
                  kind: OpKind.TRANSACTION,
                  ...fa2Contract.methods.transfer([
                      {
                          "from_" : from,
                          "tx" : [
                              {
                                  to_ : contractStorage?.treasuryAddress,
                                  token_id : 0,
                                  quantity : contractFAStorage.amountToTransfer.toNumber()
                              }
                          ]
                      }
                      ,
                  ]).toTransferParams()
              });
          }
        
      }catch (error : any) {
        console.table(`Error: ${JSON.stringify(error, null, 2)}`);
        reject(`Error: ${JSON.stringify(error, null, 2)}`);
      } 
      
      try{
        
        //2. Treasury call pending deposit to create tickets and send it
        let l2Type : LAYER2Type = contractFAStorage.l2Type.l2_TORU && contractFAStorage.l2Type.l2_TORU !== "" ?  
        LAYER2Type.L2_TORU: contractFAStorage.l2Type.l2_DEKU && contractFAStorage.l2Type.l2_DEKU !== "" ? LAYER2Type.L2_DEKU :LAYER2Type.L2_CHUSAI ;
        const param = l2Type == LAYER2Type.L2_TORU?
        {
          "address": from,
          "amountToTransfer": contractFAStorage.amountToTransfer.toNumber(),
          "rollupAddress": contractFAStorage.rollupAddress,
          "l2Type": l2Type,
          "l2_TORU": contractFAStorage.l2Type.l2_TORU,
          "faAddress": contractFAStorage.faAddress
        }: l2Type == LAYER2Type.L2_DEKU?
        {
          "address": from,
          "amountToTransfer": contractFAStorage.amountToTransfer.toNumber(),
          "rollupAddress": contractFAStorage.rollupAddress,
          "l2Type": l2Type,
          "l2_DEKU": contractFAStorage.l2Type.l2_DEKU,
          "faAddress": contractFAStorage.faAddress
        }:
        {
          "address": from,
          "amountToTransfer": contractFAStorage.amountToTransfer.toNumber(),
          "rollupAddress": contractFAStorage.rollupAddress,
          "l2Type": l2Type,
          "l2_CHUSAI": contractFAStorage.l2Type.l2_CHUSAI,
          "faAddress": contractFAStorage.faAddress
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
  
  const handlePendingWithdraw = async (to : string,tokenTypeBytes : string,  contractFAStorage: ContractFAStorage,contractStorage : ContractStorage, contract : WalletContract) : Promise<WalletParamsWithKind[]> => {
    
    return new Promise( async (resolve, reject) => 
    {

      let tokenBytes = await getTokenBytes();
      let ticketTokenType : string = tokenBytes.get(TOKEN_TYPE.XTZ) == tokenTypeBytes? TOKEN_TYPE.XTZ : tokenBytes.get(TOKEN_TYPE.CTEZ) == tokenTypeBytes ?  TOKEN_TYPE.CTEZ : tokenBytes.get(TOKEN_TYPE.KUSD) == tokenTypeBytes ?  TOKEN_TYPE.KUSD : tokenBytes.get(TOKEN_TYPE.UUSD) == tokenTypeBytes ?  TOKEN_TYPE.UUSD : TOKEN_TYPE.EURL ;
  
  
      
      const operations : WalletParamsWithKind[]= [];
      
      try{
        
        //1. Treasury call pending withdraw to destroy tickets
        
        let l2Type : LAYER2Type = contractFAStorage.l2Type.l2_TORU && contractFAStorage.l2Type.l2_TORU !== "" ?  
        LAYER2Type.L2_TORU: contractFAStorage.l2Type.l2_DEKU && contractFAStorage.l2Type.l2_DEKU !== "" ? LAYER2Type.L2_DEKU :LAYER2Type.L2_CHUSAI ;
        
        const param = l2Type == LAYER2Type.L2_TORU?
        {
          "address": to,
          "amountToTransfer": contractFAStorage.amountToTransfer.toNumber(),
          "rollupAddress": contractFAStorage.rollupAddress,
          "l2Type": l2Type,
          "l2_TORU": contractFAStorage.l2Type.l2_TORU,
          "faAddress": contractFAStorage.faAddress
        }: l2Type == LAYER2Type.L2_DEKU?
        {
          "address": to,
          "amountToTransfer": contractFAStorage.amountToTransfer.toNumber(),
          "rollupAddress": contractFAStorage.rollupAddress,
          "l2Type": l2Type,
          "l2_DEKU": contractFAStorage.l2Type.l2_DEKU,
          "faAddress": contractFAStorage.faAddress
        }:
        {
          "address": to,
          "amountToTransfer": contractFAStorage.amountToTransfer.toNumber(),
          "rollupAddress": contractFAStorage.rollupAddress,
          "l2Type": l2Type,
          "l2_CHUSAI": contractFAStorage.l2Type.l2_CHUSAI,
          "faAddress": contractFAStorage.faAddress
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

        //2.a for FA1.2
        if(ticketTokenType === TOKEN_TYPE.CTEZ || ticketTokenType === TOKEN_TYPE.KUSD){
          let fa12Contract : WalletContract = await Tezos.wallet.at(contractFAStorage.faAddress);
      
      console.log("contractFAStorage.faAddress",contractFAStorage.faAddress);
      
      operations.push({
          kind: OpKind.TRANSACTION,
          ...fa12Contract.methods.transfer(contractStorage?.treasuryAddress,to,contractFAStorage.amountToTransfer.toNumber()).toTransferParams()
      });


  }

      //2.b for FA2
      if(ticketTokenType === TOKEN_TYPE.UUSD || ticketTokenType === TOKEN_TYPE.EURL){
      let fa2Contract : WalletContract = await Tezos.wallet.at(contractFAStorage.faAddress);
      
      console.log("contractFAStorage.faAddress",contractFAStorage.faAddress);

      operations.push({
          kind: OpKind.TRANSACTION,
          ...fa2Contract.methods.transfer([
              {
                  "from_" : contractStorage?.treasuryAddress,
                  "tx" : [
                      {
                          to_ : to,
                          token_id : 0,
                          quantity : contractFAStorage.amountToTransfer.toNumber()
                      }
                  ]
              }
              ,
          ]).toTransferParams()
      });

  }
        
        
        console.log("Treasury gave back  "+contractFAStorage.amountToTransfer.toNumber()+" tokens to "+to+ " on ticket type "+tokenTypeBytes);        
        
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
    
    if (store.faPendingDeposits.size > 0) {
      
      console.log(`Found ${store.faPendingDeposits.size} pending deposit to execute`);
      
      
      for(let faPendingDeposit of store.faPendingDeposits.entries()) {
        let [key , deposit] = faPendingDeposit;
        let ops = await handlePendingDeposit(key[0],key[1],deposit,store,c);
        operations.push(... ops);
        console.log(`1 pending deposit batched`);
      };
      
      
    }  
    
    if (store.faPendingWithdrawals.size > 0) {
      
      console.log(`Found ${store.faPendingWithdrawals.size} pending withdrawal to execute`);
      
      for(let faPendingWithdrawal of store.faPendingWithdrawals.entries()) {
        let [key , withdraw] = faPendingWithdrawal;
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