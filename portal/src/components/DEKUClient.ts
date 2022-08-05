import { TezosToolkit } from "@taquito/taquito";
import { b58decode, buf2hex, encodeExpr } from "@taquito/utils";
import { rejects } from "assert";

const stringToHex = (payload: string): string => {
    const input = Buffer.from(payload);
    return buf2hex(input);
}

export interface DEKUWallet {
    address: string,
    priv_key: string    
}

export interface DEKUUserOperation {
    hash: string, 
    source: string,
    initial_operation: DEKUInitialOperation
}

export interface DEKUOperation {
    hash: string,
    key  : string,
    signature : string,
    nonce : number,
    block_height : number,
    data : DEKUUserOperation}
    
    export enum DEKUInitialOperationType {
        Transaction= "Transaction" ,
        Contract_invocation =  "Contract_invocation" , 
        Contract_origination = "Contract_origination" ,
        Tezos_withdraw = "Tezos_withdraw"
    };
    
    export type DEKUInitialOperation  = [DEKUInitialOperationType,any];
    
    export type DEKUInitialOperation_Transaction = [DEKUInitialOperationType.Transaction,{
        destination : string;
        amount : number;
        ticket : number;
    }];
    
    /*
    | Contract_invocation  of {
        to_invoke : Contract_address.t;
        argument : Contract_vm.Invocation_payload.t;
        tickets :
        ((Ticket_id.t * Amount.t)
        * (Smart_contracts.Ticket_handle.t * Int64.t option))
        list;
    }
    | Contract_origination of {
        payload : Contract_vm.Origination_payload.t;
        tickets :
        ((Ticket_id.t * Amount.t)
        * (Smart_contracts.Ticket_handle.t * Int64.t option))
        list;
    }
    | Tezos_withdraw       of {
        owner : Tezos.Address.t;
        amount : Amount.t;
        ticket : Ticket_id.t;
    }
    */
    
    export interface DEKUWithdrawProof {
        withdrawal_handles_hash : string;
        withdrawal_handle : {
            hash : string;
            id : number;
            owner : string;
            amount : number;
            ticket : number;
        }
        proof : Array<[string,string]>; 
    }
    
    export default class DEKUClient {
        dekuNodeUrl : string;
        ticketer : string;
        TezosL2 : TezosToolkit;
        
        constructor(dekuNodeUrl : string,ticketer : string,TezosL2 : TezosToolkit){
            this.dekuNodeUrl = dekuNodeUrl;
            this.ticketer = ticketer;
            this.TezosL2 = TezosL2;
        }
        
        
        getBalance = async(userAddress :string, ticketData : string) : Promise<number> => {
            
            const requestOptions = {
                method: 'POST',
                //headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ "ticket": 
                "(Pair \""+this.ticketer+"\" 0x"+ticketData+")",
                "address" : userAddress })
            };
            const response : Response = await fetch(this.dekuNodeUrl+"/ticket-balance", requestOptions);
            const responseJson : {amount : number}= await response.json();
            console.log(responseJson);
            return responseJson.amount;
            
        }    
        
        getWithdrawProof = async(operation_hash :string) : Promise<DEKUWithdrawProof> => {
            
            const requestOptions = {
                method: 'POST',
                body: JSON.stringify({ "operation_hash": operation_hash })
            };
            const response : Response = await fetch(this.dekuNodeUrl+"/withdraw-proof", requestOptions);
            const responseJson : [string,DEKUWithdrawProof]= await response.json();
            console.log(responseJson);
            
            return new Promise((resolve, reject) => {
                if(responseJson[0] !== "Ok")reject(JSON.stringify(responseJson));
                else resolve(responseJson[1]);
            });            
        }    
        
        getBlockLevel = async () : Promise<number> => {
            const response = await fetch(this.dekuNodeUrl + "/block-level",
            {
                method: "POST",
                body: JSON.stringify(null)
            });
            const blockResponse : {level:number}= await response.json();
            return blockResponse.level;
        }
        
        requestNonce = async () : Promise<number> => {
            const response = await fetch(this.dekuNodeUrl + "/request-nonce",
            {
                method: "POST",
                body: JSON.stringify({ "uri": this.dekuNodeUrl })
            });
            const blockResponse : {nonce:number}= await response.json();
            return blockResponse.nonce;
        }
        
        /*
        (* POST /user-operation-gossip *)
        (* Propagate user operation (core_user.t) over gossip network *)
        let handle_receive_user_operation_gossip =
        handle_request
        (module Network.User_operation_gossip)
        (fun request ->
            Flows.received_user_operation request.user_operation;
            Ok ())*/
            
            
            
            userOperation = async (initialOperation : DEKUInitialOperation) : Promise<string> => {
                
                try {
                    const block_height = await this.getBlockLevel();
                    const userAddress = await this.TezosL2.signer.publicKeyHash();
                    const jsonToHash = JSON.stringify([userAddress, initialOperation]);
                    const innerHash = b58decode(encodeExpr( stringToHex(jsonToHash))).slice(4, -2);
                    const data : DEKUUserOperation= {
                        hash: innerHash, //⚠ respect the order of fields in the object for serialization
                        source: userAddress,
                        initial_operation: initialOperation,
                    }
                    
                    let nonce = Math.floor(Math.random() * 2147483647);
                    
                    const fullPayload = JSON.stringify([ 
                        nonce,
                        block_height,
                        data
                    ]);
                    
                    const key = await this.TezosL2.signer.publicKey();
                    const outerHash = b58decode(encodeExpr( stringToHex(fullPayload))).slice(4, -2);
                    const signature = await this.TezosL2.signer.sign(stringToHex(fullPayload)).then((val) => val.prefixSig);
                    const operation : DEKUOperation  = {
                        hash: outerHash,
                        key,
                        signature,
                        nonce,
                        block_height,
                        data
                    }
                    
                    const res : Response = await fetch(this.dekuNodeUrl! + "/user-operation-gossip",
                    {
                        method: "POST",
                        //headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({"user_operation" : operation})
                    });
                    
                    return new Promise((resolve, reject) => {
                        resolve(outerHash);
                    });
                } catch (error) {
                    return new Promise((resolve, reject) => {
                        reject(error);
                    });    
                }
            }
            
            createTransaction = async (receiver : string, amount : number, ticketData : string) : Promise<string> => {
                const initialOperation : DEKUInitialOperation = [DEKUInitialOperationType.Transaction, {
                    destination : receiver,
                    amount : amount,
                    ticket : "(Pair \""+this.ticketer+"\" 0x"+ticketData+")"
                }];
                return this.userOperation(initialOperation);
            }
            
            withdraw = async (tezos_address : string, amount : number, ticketData : string) : Promise<string> => {
                const initialOperation : DEKUInitialOperation = [DEKUInitialOperationType.Tezos_withdraw, {
                    owner : tezos_address,
                    amount : amount,
                    ticket : "(Pair \""+this.ticketer+"\" 0x"+ticketData+")"
                }];
                return this.userOperation(initialOperation);
            }
            
            
            
            
        }