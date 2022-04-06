import { TicketToken } from "@taquito/michelson-encoder/dist/types/tokens/ticket"
import { WalletContract } from "@taquito/taquito";
import {unpackData} from "@taquito/michel-codec";

export class TOKEN_TYPE {
  public static readonly XTZ = new TOKEN_TYPE("Unit");
  public static FA12 = new TOKEN_TYPE("FA12", "ticketer address");
  
  constructor(public readonly name: string, public readonly address?: string) {
  }
}

export interface MichelsonV1ExpressionBase {
  int?: string;
  string?: string;
  bytes?: string;
}
export interface MichelsonV1ExpressionExtended {
  prim: string;
  args?: MichelsonV1Expression[];
  annots?: string[];
}
export declare type MichelsonV1Expression = MichelsonV1ExpressionBase | MichelsonV1ExpressionExtended | MichelsonV1Expression[];


export interface MichelsonV1ExpressionExtended {
  prim: string;
  args?: MichelsonV1Expression[];
  annots?: string[];
}

export class TezosTicket {
  ticketer: TOKEN_TYPE;
  value: string;
  amount: number ;
  
  constructor(ticketer: TOKEN_TYPE,
    value: string,
    amount: number){
      this.ticketer =ticketer ;
      this.value =value ;
      this.amount =amount ;
    }
  }
  
  export declare type MichelsonData = IntLiteral | StringLiteral | BytesLiteral | any;
/**
 * An AST node representing Michelson string literal.
 */
 export interface StringLiteral extends Node {
  string: string;
}
/**
* An AST node representing Michelson int literal.
*/
export interface IntLiteral<T extends string = string> extends Node {
  int: T;
}
/**
* An AST node representing Michelson bytes literal.
*/
export interface BytesLiteral extends Node {
  bytes: string;
}
  
  export abstract class TezosUtils{
    
    static convertTicketMapStorageToTicketMap( walletContract : WalletContract) : Map<string,TezosTicket>{
      let ticketMap = new Map<string,TezosTicket>();
      Array.from(walletContract.script.storage as MichelsonV1ExpressionExtended[]).forEach(item => {
        let key :string = (item.args![0] as MichelsonV1ExpressionBase).string! ;
        let valueMichelsonV1ExpressionExtended : MichelsonV1ExpressionExtended = (item.args![1] as MichelsonV1ExpressionExtended);
        let bytesArray : number[] = ((valueMichelsonV1ExpressionExtended.args![1] as MichelsonV1ExpressionBase).bytes!)
        .match(/.{1,2}/g)!
        .map(byte => parseInt("0x"+byte) );
        let value : MichelsonData = unpackData(bytesArray);
        let tokenTypeStr = (valueMichelsonV1ExpressionExtended.args![0] as MichelsonV1ExpressionBase).string!;
        let tokentype : TOKEN_TYPE = tokenTypeStr == TOKEN_TYPE.XTZ.name ? TOKEN_TYPE.XTZ : new TOKEN_TYPE(TOKEN_TYPE.FA12.name,tokenTypeStr);
        let tezosTicket : TezosTicket = new TezosTicket(tokentype ,  (value.args![0] as MichelsonV1ExpressionExtended).prim , Number.parseInt((valueMichelsonV1ExpressionExtended.args![2] as MichelsonV1ExpressionBase).int!))  ;
        ticketMap.set(key, tezosTicket);
      });
      return ticketMap;
    }
    
  }