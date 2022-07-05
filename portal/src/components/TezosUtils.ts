import { BigMapAbstraction, Contract, MichelCodecPacker, TezosToolkit } from "@taquito/taquito";
import BigNumber from 'bignumber.js';
import {  PackDataParams, PackDataResponse } from "@taquito/rpc";



export enum LAYER2Type { L2_DEKU = "l2_DEKU" , L2_TORU = "l2_TORU" , L2_CHUSAI = "l2_CHUSAI"};

export class LAYER2TypeClass {
  l2_DEKU : string = "";
  l2_TORU : string = "";
  l2_CHUSAI : string = "";
};

export class RollupCounter {
  next: number;
  
  constructor(next: number){
    this.next=next;
  }
};

export class RollupTORU {
  last_removed_commitment_hashes: any;
  finalized_commitments: RollupCounter;
  unfinalized_commitments: RollupCounter;
  uncommitted_inboxes: RollupCounter;
  commitment_newest_hash: string;
  tezos_head_level: string;
  burn_per_byte: string; 
  allocated_storage: string;
  occupied_storage: string;
  inbox_ema: string;
  commitments_watermark: any;
  
  constructor(last_removed_commitment_hashes: any,
    finalized_commitments: RollupCounter,
    unfinalized_commitments: RollupCounter,
    uncommitted_inboxes: RollupCounter,
    commitment_newest_hash: string,
    tezos_head_level: string,
    burn_per_byte: string,
    allocated_storage: string,
    occupied_storage: string,
    inbox_ema: string,
    commitments_watermark: any){
      this.last_removed_commitment_hashes= last_removed_commitment_hashes;
      this.finalized_commitments=finalized_commitments;
      this.unfinalized_commitments=unfinalized_commitments;
      this.uncommitted_inboxes=uncommitted_inboxes;
      this.commitment_newest_hash=commitment_newest_hash;
      this.tezos_head_level=tezos_head_level;
      this.burn_per_byte=burn_per_byte; 
      this.allocated_storage=allocated_storage;
      this.occupied_storage=occupied_storage;
      this.inbox_ema=inbox_ema;
      this.commitments_watermark=commitments_watermark;
      
    }
  };
  
  export class RollupDEKU {
    root_hash : DEKUHeader;
    vault : DEKUVault;
    
    constructor( root_hash : DEKUHeader,
      vault : DEKUVault){
        this.root_hash = root_hash;
        this.vault = vault;
      }
    };
    
    export class DEKUHeader {
      current_block_hash : string;
      current_block_height : BigNumber;
      current_handles_hash : string;
      current_state_hash : string;
      current_validators : Array<string>;
      
      constructor( current_block_hash : string,
        current_block_height : BigNumber,
        current_handles_hash : string,
        current_state_hash : string,
        current_validators : Array<string>,){
          this.current_block_hash=current_block_hash;
          this.current_block_height=current_block_height;
          this.current_handles_hash=current_handles_hash;
          this.current_state_hash=current_state_hash;
          this.current_validators=current_validators;
        }
      };
      
      export class DEKUVault {
        known_handles_hash : any;
        used_handles : any;
        vault : BigMapAbstraction;
        ticketMap : Map<string,TezosTicket>;
        
        constructor(known_handles_hash : any,
          used_handles : any,
          vault: BigMapAbstraction,
          ticketMap : Map<string,TezosTicket>){
            this.known_handles_hash = known_handles_hash;
            this.used_handles = used_handles;
            this.vault = vault;
            this.ticketMap = ticketMap;
          }
        };
        
        
        export class RollupCHUSAI {
          fixed_ticket_key : CHUSAITicketKey;
          messages : BigMapAbstraction;
          rollup_level : BigNumber;
          ticket : TezosTicket;
          
          constructor(fixed_ticket_key : CHUSAITicketKey,
            messages : BigMapAbstraction,
            rollup_level : BigNumber,
            ticket : TezosTicket){
              this.fixed_ticket_key = fixed_ticket_key;
              this.rollup_level = rollup_level;
              this.messages = messages;
              this.ticket = ticket;
            }
          };
          
          export class CHUSAITicketKey{
            mint_address! : string;
            payload! : string //bytes
          };
          
          export enum TOKEN_TYPE {XTZ = "XTZ",CTEZ = "CTEZ",KUSD = "KUSD"};
          
          
          
          
          export async function getBytes(tokenType : TOKEN_TYPE, contractAddress? : string) : Promise<string> {
            if(tokenType === TOKEN_TYPE.XTZ) return getXTZBytes();
            else return getFA12Bytes(contractAddress!);
          };  
          
          export async function getXTZBytes() : Promise<string> {
            const p = new MichelCodecPacker();
            let XTZbytes: PackDataParams = {
              data:  {prim : "Left", args: [ {prim : "Unit"}]},
              type: {prim: "Or",
              args: [
                {prim : "Unit", annots : ['%XTZ']},
                {prim : "Address", annots : ['%FA12']}
              ]}
            };
            return (await p.packData(XTZbytes)).packed ;
          }
          
          
          export async function getFA12Bytes(contractAddress : string) : Promise<string> {
            const p = new MichelCodecPacker();
            let addrBytes : PackDataResponse = await p.packData({
              data: {string : contractAddress},// process.env["REACT_APP_CTEZ_CONTRACT"]!},
              type : {prim: "address"}
            });
            
            //why to remove first 12 chars ? no idea but it is like this ...
            //console.log("addrBytes",addrBytes.packed.substring(12));
            
            let FA12bytes : PackDataParams = {
              data:  {prim : "Right", args: [ {bytes : addrBytes.packed.substring(12)}]}, //'01f37d4eddfff4e08fb1f19895ac9c83bc12d2b36800'}]},  
              type: {prim: "Or",
              args: [
                {prim : "Unit", annots : ['%XTZ']},
                {prim : "address", annots : ['%FA12']}
              ]}
            };
            return (await p.packData(FA12bytes)).packed ;
          }
          
          
          
          export class ROLLUP_TYPE {
            public static readonly TORU = new ROLLUP_TYPE("TORU",process.env["REACT_APP_ROLLUP_CONTRACT_TORU"]!);
            public static readonly DEKU = new ROLLUP_TYPE("DEKU",process.env["REACT_APP_ROLLUP_CONTRACT_DEKU"]!);
            public static readonly CHUSAI = new ROLLUP_TYPE("CHUSAI",process.env["REACT_APP_ROLLUP_CONTRACT_CHUSAI"]!);
            private constructor(public readonly name: string, public readonly address: string) {}
          };
          
          
          export class TezosTicket {
            ticketer: TOKEN_TYPE;
            value: string;
            amount: BigNumber ;
            
            constructor(ticketer: TOKEN_TYPE,
              value: string,
              amount: BigNumber){
                this.ticketer =ticketer ;
                this.value =value ;
                this.amount =amount ;
              }
            };
            
            export abstract class TezosUtils{
              
              static async fetchRollupTORU(rpc : string,rollupAddress : string ) : Promise<RollupTORU|undefined> {
                let response = await fetch(rpc+"chains/main/blocks/head/context/tx_rollup/"+rollupAddress+"/state");              
                let rollup : RollupTORU = await response.json();
                
                return new Promise( (resolve,reject) => { 
                  if(response.ok) resolve(new RollupTORU(rollup.last_removed_commitment_hashes,rollup.finalized_commitments,rollup.unfinalized_commitments,rollup.uncommitted_inboxes,rollup.commitment_newest_hash,rollup.tezos_head_level,rollup.burn_per_byte,rollup.allocated_storage,rollup.occupied_storage,rollup.inbox_ema,rollup.commitments_watermark));
                  else reject("Cannot find the rollup information of "+rollupAddress);
                });
              }
              
              static async fetchRollupDEKU(Tezos : TezosToolkit, rollupAddress : string) : Promise<RollupDEKU|undefined> {
                let dekucontract : Contract = await Tezos.contract.at(rollupAddress);
                let rollup : RollupDEKU = await dekucontract.storage();
                
                
                let XTZTicket = await rollup.vault.vault.get<TezosTicket>([process.env["REACT_APP_CONTRACT"],await getBytes(TOKEN_TYPE.XTZ)]) ; //XTZ() => "050505030b" 
                let CTEZTicket = await rollup.vault.vault.get<TezosTicket>([process.env["REACT_APP_CONTRACT"],await getBytes(TOKEN_TYPE.CTEZ,process.env["REACT_APP_CTEZ_CONTRACT"]!) ]) ; //FA12 CTEZ with address KT1WnDswMHZefo2fym6Q9c8hnL3sEuzFb2Dt => "0505080a0000001601f37d4eddfff4e08fb1f19895ac9c83bc12d2b36800"
                let kUSDTicket = await rollup.vault.vault.get<TezosTicket>([process.env["REACT_APP_CONTRACT"],await getBytes(TOKEN_TYPE.KUSD,process.env["REACT_APP_KUSD_CONTRACT"]!) ]) ; //FA12 KUSD with address ??? => "???"
                const ticketMap = new Map<TOKEN_TYPE,TezosTicket>();
                if(XTZTicket)ticketMap.set(TOKEN_TYPE.XTZ,XTZTicket);
                if(CTEZTicket)ticketMap.set(TOKEN_TYPE.CTEZ,CTEZTicket);
                if(kUSDTicket)ticketMap.set(TOKEN_TYPE.KUSD,kUSDTicket);
                
                return new Promise( (resolve,reject) => {
                  resolve(new RollupDEKU(
                    new DEKUHeader(rollup.root_hash.current_block_hash,rollup.root_hash.current_block_height,rollup.root_hash.current_handles_hash,rollup.root_hash.current_state_hash,rollup.root_hash.current_validators),
                    new DEKUVault(rollup.vault.known_handles_hash,rollup.vault.used_handles,rollup.vault.vault,ticketMap))); });
                  }
                  
                  
                  static async fetchRollupCHUSAI(Tezos : TezosToolkit, rollupAddress : string) : Promise<RollupCHUSAI|undefined> {
                    let contract : Contract = await Tezos.contract.at(rollupAddress);
                    let rollup : RollupCHUSAI = await contract.storage();
                    console.log("rollup",rollup);
                    return new Promise( (resolve,reject) => {
                      resolve(new RollupCHUSAI(rollup.fixed_ticket_key,rollup.messages,rollup.rollup_level,rollup.ticket)); });
                    }
                    
                    
                  };
                  
                  
                  