import { BigMapAbstraction, Context, Contract, MichelCodecPacker, MichelCodecParser, TezosToolkit, WalletContract } from "@taquito/taquito";
import {unpackDataBytes,unpackData} from "@taquito/michel-codec";
import BigNumber from 'bignumber.js';
import { BigMapKey } from "@dipdup/tzkt-api";
import { MichelsonV1Expression, PackDataParams, PackDataResponse } from "@taquito/rpc";
import { Schema } from "@taquito/michelson-encoder";


export enum AddressType { l1_ADDRESS = "l1_ADDRESS" , l2_ADDRESS = "l2_ADDRESS" };

export class RollupCounter {
  next: number;

  constructor(next: number){
    this.next=next;
  }
}

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
}

export class RollupDEKU {
  root_hash : DEKUHeader;
  vault : DEKUVault;

  constructor( root_hash : DEKUHeader,
    vault : DEKUVault){
      this.root_hash = root_hash;
      this.vault = vault;
  }
}

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
}

export class DEKUVault {
  known_handles_hash : any;
  used_handles : any;
  vault : BigMapAbstraction;
  XTZTicket : TezosTicket | undefined;
  CTEZTicket : TezosTicket | undefined;

  constructor(known_handles_hash : any,
    used_handles : any,
    vault: BigMapAbstraction,
    XTZTicket : TezosTicket | undefined,
    CTEZTicket : TezosTicket | undefined){
      this.known_handles_hash = known_handles_hash;
      this.used_handles = used_handles;
      this.vault = vault;
      this.XTZTicket=XTZTicket;
      this.CTEZTicket=CTEZTicket;
  }
}

export class TOKEN_TYPE {
  public static readonly XTZ = new TOKEN_TYPE("Unit");
  public static FA12 = new TOKEN_TYPE("FA12", "ticketer address");
  
  constructor(public readonly name: string, public readonly address?: string) {
  }
}

export class ROLLUP_TYPE {
  public static readonly TORU = new ROLLUP_TYPE("TORU",process.env["REACT_APP_ROLLUP_CONTRACT_TORU"]!);
  public static readonly DEKU = new ROLLUP_TYPE("DEKU",process.env["REACT_APP_ROLLUP_CONTRACT_DEKU"]!);
  private constructor(public readonly name: string, public readonly address: string) {}
}


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
  }
  
  export abstract class TezosUtils{
    
    static async fetchRollupTORU(rpc : string,rollupAddress : string ) : Promise<RollupTORU|undefined> {
      let response = await fetch(rpc+"chains/main/blocks/head/context/tx_rollup/"+rollupAddress+"/state");
      return new Promise( (resolve,reject) => { 
      if(response.ok) resolve(response.json());
      else reject("Cannot find the rollup information of "+rollupAddress);
    });
    }

    static async fetchRollupDEKU(Tezos : TezosToolkit, rollupAddress : string) : Promise<RollupDEKU|undefined> {
      let dekucontract : Contract = await Tezos.contract.at(rollupAddress);
      let rollup : RollupDEKU = await dekucontract.storage();
      
      //FIXME taquito PACK / UNPACK function to test and compare
      const p = new MichelCodecPacker();

      //'(or (unit %XTZ) (address %FA12))'

      let XTZbytes: PackDataParams = {
        data:  {prim : "Left", args: [ {prim : "Unit"}]},
        type: {prim: "Or",
               args: [
                {prim : "Unit", annots : ['%XTZ']},
                {prim : "Address", annots : ['%FA12']}
              ]}
      };


      let addrBytes : PackDataResponse = await p.packData({
        data: {string :  process.env["REACT_APP_CTEZ_CONTRACT"]!},
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

      let XTZTicket = await rollup.vault.vault.get<TezosTicket>([process.env["REACT_APP_CONTRACT"],(await p.packData(XTZbytes)).packed]) ; //XTZ() => "050505030b" 
      let CTEZTicket = await rollup.vault.vault.get<TezosTicket>([process.env["REACT_APP_CONTRACT"],(await p.packData(FA12bytes)).packed]) ; //FA12 CTEZ with address KT1WnDswMHZefo2fym6Q9c8hnL3sEuzFb2Dt => "0505080a0000001601f37d4eddfff4e08fb1f19895ac9c83bc12d2b36800"

      return new Promise( (resolve,reject) => {
        resolve(new RollupDEKU(
        new DEKUHeader(rollup.root_hash.current_block_hash,rollup.root_hash.current_block_height,rollup.root_hash.current_handles_hash,rollup.root_hash.current_state_hash,rollup.root_hash.current_validators),
        new DEKUVault(rollup.vault.known_handles_hash,rollup.vault.used_handles,rollup.vault.vault,XTZTicket,CTEZTicket))); });
    }
    
  }