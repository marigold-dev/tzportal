import { AccountInfo } from "@airgap/beacon-types";
import { AddShoppingCartOutlined, ChangeCircle, SwapVert, SwapVerticalCircle, SwapVerticalCircleOutlined, SwapVertOutlined, SwapVertRounded, UnfoldMoreOutlined } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Avatar, Backdrop, Badge, Box, CircularProgress, Divider, Grid, Stack, Tooltip, Typography, useMediaQuery } from "@mui/material";
import Button from "@mui/material/Button";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { OperationContentsAndResultTransaction, OperationResultTransaction } from "@taquito/rpc";
import { BigMapAbstraction, compose, OpKind, TezosToolkit, WalletContract, WalletOperationBatch, WalletParamsWithKind } from "@taquito/taquito";
import { tzip12 } from "@taquito/tzip12";
import { tzip16 } from "@taquito/tzip16";
import BigNumber from 'bignumber.js';
import { useSnackbar } from "notistack";
import { Dispatch, MouseEvent, SetStateAction, useEffect, useRef, useState } from "react";
import { PAGES } from "../App";
import DEKUClient from "./DEKUClient";
import { FA12Contract } from "./fa12Contract";
import { FA2Contract } from "./fa2Contract";
import RollupBox, { RollupBoxComponentType } from "./RollupBox";
import { LAYER2Type, RollupCHUSAI, RollupDEKU, RollupTORU, ROLLUP_TYPE, TOKEN_TYPE } from "./TezosUtils";
import { ContractFAParameters, ContractFAStorage, ContractParameters, ContractStorage, ContractXTZParameters } from "./TicketerContractUtils";
import { TransactionInvalidBeaconError } from "./TransactionInvalidBeaconError";
import UserWallet, { UserWalletComponentType } from "./UserWallet";



type DepositWithdrawV2Props = {
    Tezos: TezosToolkit;
    wallet: BeaconWallet;
    TezosL2: TezosToolkit;
    userAddress:string;
    userL2Address:string;
    rollupType : ROLLUP_TYPE;
    setRollupType : Dispatch<SetStateAction<ROLLUP_TYPE>>;
    rollup : RollupTORU | RollupDEKU | RollupCHUSAI | undefined;
    setRollup : Dispatch<SetStateAction<RollupTORU | RollupDEKU | RollupCHUSAI | undefined>>;
    activeAccount : AccountInfo|undefined;
    setActiveAccount : Dispatch<SetStateAction<AccountInfo|undefined>>;
    accounts : AccountInfo[];
    tokenBytes : Map<TOKEN_TYPE,string>;
    setPageIndex : Dispatch<SetStateAction<string>>;
};

const DepositWithdrawV2 = ({
    Tezos,
    wallet,
    TezosL2,
    userAddress,
    userL2Address,
    rollupType,
    setRollupType,
    rollup,
    setRollup,
    activeAccount,
    setActiveAccount,
    accounts,
    tokenBytes, 
    setPageIndex
}: DepositWithdrawV2Props): JSX.Element => {
    
    const dekuClient = new DEKUClient(process.env["REACT_APP_DEKU_NODE"]!,process.env["REACT_APP_CONTRACT"]!,TezosL2);
    
    const [userBalance, setUserBalance] = useState<Map<TOKEN_TYPE,BigNumber>>(new Map());
    const [userTicketBalance, setUserTicketBalance] = useState<Map<TOKEN_TYPE,BigNumber>>(new Map());
    
    
    const [quantity, setQuantity]  = useState<BigNumber>(new BigNumber(0)); 
    
    let oldTicketBalance = useRef<BigNumber>();
    let oldBalance = useRef<BigNumber>();
    const [tokenType, setTokenType]  = useState<string>(TOKEN_TYPE.XTZ);
    const tokenTypeRef = useRef(tokenType); //TRICK : to track current value on async timeout functions
    tokenTypeRef.current = tokenType;
    useEffect(() => { 
        oldBalance.current = userBalance.get(TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE])!;
        oldTicketBalance.current = userTicketBalance.get(TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE])!;
    }, [tokenType]); //required to refresh to current when changing token type
    
    const [contractStorage, setContractStorage] = useState<ContractStorage>();
    const [contract, setContract] =  useState<WalletContract>();
    
    //TEZOS OPERATIONS
    const [tezosLoading, setTezosLoading]  = useState(false);
    
    // MESSAGES
    const { enqueueSnackbar } = useSnackbar();
    
    const rollupBoxRef = useRef<RollupBoxComponentType>();
    const userWalletRef = useRef<UserWalletComponentType>();
    
    const isDirectionDeposit = () => { 
        return activeAccount && activeAccount?.address === userAddress && activeAccount.accountIdentifier!==LAYER2Type.L2_DEKU
    }
    
    const switchActiveAccount = async()=> {
        const l1Account : AccountInfo | undefined = accounts.find((a)=> {return a.address == userAddress && a.accountIdentifier!==LAYER2Type.L2_DEKU}); 
        const l2Account : AccountInfo | undefined = accounts.find((a)=> {return a.address == userL2Address && a.accountIdentifier===LAYER2Type.L2_DEKU}); 
        if(activeAccount?.address === l1Account?.address && activeAccount?.accountIdentifier!==LAYER2Type.L2_DEKU){
            setActiveAccount( l2Account );
            setPageIndex(""+PAGES.WITHDRAW);
        }else{
            setActiveAccount(  l1Account);
            setPageIndex(""+PAGES.DEPOSIT);
        }
        
    }
    
    const refreshBalance = async() => {
        
        //Note : tokenTypeRef.current is this ref instead of tokenType to get last current value to track
        
        let newCurrentBalance  : BigNumber = new BigNumber(0) ;
        
        //XTZ
        const XTZbalance = await Tezos.tz.getBalance(userAddress);
        
        //FA1.2 LOOP
        
        //kUSD
        let kUSDContract = await Tezos.wallet.at(process.env["REACT_APP_KUSD_CONTRACT"]!,compose(tzip12, tzip16));
        const kUSDtokenMap : BigMapAbstraction = (await kUSDContract.storage() as FA12Contract).tokens;
        let kUSDBalance : BigNumber|undefined = await kUSDtokenMap.get<BigNumber>(userAddress);
        
        
        //CTEZ
        let ctezContract = await Tezos.wallet.at(process.env["REACT_APP_CTEZ_CONTRACT"]!,compose(tzip12, tzip16));
        const ctezContractStorage : FA12Contract = (await ctezContract.storage() as FA12Contract)
        const cteztokenMap : BigMapAbstraction = ctezContractStorage.tokens;
        let ctezBalance : BigNumber|undefined = await cteztokenMap.get<BigNumber>(userAddress);
        
        //UUSD
        let uusdContract = await Tezos.wallet.at(process.env["REACT_APP_UUSD_CONTRACT"]!,tzip12);
        const uusdContractStorage : FA2Contract = (await uusdContract.storage() as FA2Contract)
        const uusdtokenMap : BigMapAbstraction = uusdContractStorage.ledger;
        let uusdBalance : BigNumber|undefined = await uusdtokenMap.get<BigNumber>([userAddress,0]);
        
        //EURL
        let eurlContract = await Tezos.wallet.at(process.env["REACT_APP_EURL_CONTRACT"]!,tzip12);
        const eurlContractStorage : FA2Contract = (await eurlContract.storage() as FA2Contract)
        const eurltokenMap : BigMapAbstraction = eurlContractStorage.ledger;
        let eurlBalance : BigNumber|undefined = await eurltokenMap.get<BigNumber>([userAddress,0]);
        
        let balance = new Map<TOKEN_TYPE,BigNumber>();
        balance.set(TOKEN_TYPE.XTZ,XTZbalance.dividedBy(Math.pow(10,6))); //convert mutez to tez
        if(kUSDBalance !== undefined) balance.set(TOKEN_TYPE.KUSD,kUSDBalance.dividedBy(Math.pow(10,(await kUSDContract.tzip12().getTokenMetadata(0)).decimals)));//convert from lowest kUSD decimal
        else balance.set(TOKEN_TYPE.KUSD,new BigNumber(0)); 
        if(ctezBalance !== undefined) balance.set(TOKEN_TYPE.CTEZ,ctezBalance.dividedBy(Math.pow(10,(await ctezContract.tzip12().getTokenMetadata(0)).decimals)));//convert from muctez
        else balance.set(TOKEN_TYPE.CTEZ,new BigNumber(0)); 
        if(uusdBalance !== undefined) balance.set(TOKEN_TYPE.UUSD,uusdBalance.dividedBy(Math.pow(10,(await uusdContract.tzip12().getTokenMetadata(0)).decimals)));//convert from lowest UUSD decimal
        else balance.set(TOKEN_TYPE.UUSD,new BigNumber(0)); 
        if(eurlBalance !== undefined) balance.set(TOKEN_TYPE.EURL,eurlBalance.dividedBy(Math.pow(10,(await eurlContract.tzip12().getTokenMetadata(0)).decimals)));//convert from lowest EURL decimal
        else balance.set(TOKEN_TYPE.EURL,new BigNumber(0)); 
        
        switch(tokenTypeRef.current){
            case TOKEN_TYPE.XTZ : newCurrentBalance=balance.get(TOKEN_TYPE.XTZ)!;break;
            case TOKEN_TYPE.KUSD : newCurrentBalance=balance.get(TOKEN_TYPE.KUSD)!;break;
            case TOKEN_TYPE.CTEZ : newCurrentBalance=balance.get(TOKEN_TYPE.CTEZ)!;break;
            case TOKEN_TYPE.UUSD : newCurrentBalance=balance.get(TOKEN_TYPE.UUSD)!;break;
            case TOKEN_TYPE.EURL : newCurrentBalance=balance.get(TOKEN_TYPE.EURL)!;break;
        }
        
        setUserBalance(balance);
        console.log("All balances initialized",balance);
        
        userWalletRef?.current?.setShouldBounce(false);        
        
        if(!oldBalance.current){ //first time, we just record the value
            oldBalance.current = newCurrentBalance;
        }
        if(!newCurrentBalance.isEqualTo(oldBalance.current!)){
            setTimeout(() => {
                userWalletRef?.current?.setChangeTicketColor(newCurrentBalance.isGreaterThan(oldBalance.current!)?"green":"red");
                userWalletRef?.current?.setShouldBounce(true)
                setTimeout(() => {
                    userWalletRef?.current?.setChangeTicketColor("");
                    oldBalance.current = newCurrentBalance; //keep old value before it vanishes
                }, 1000);
            }, 500);
        }
    }
    
    const refreshTicketBalance = async() => {
        
        //Note : tokenTypeRef.current is this ref instead of tokenType to get last current value to track
        
        let newCurrentBalance  : BigNumber = new BigNumber(0) ;
        
        //XTZ
        const XTZbalance = await dekuClient.getBalance(userL2Address,tokenBytes.get(TOKEN_TYPE.XTZ)!);
        
        //kUSD
        let kUSDContract = await Tezos.wallet.at(process.env["REACT_APP_KUSD_CONTRACT"]!,compose(tzip12, tzip16));
        let kUSDBalance = await dekuClient.getBalance(userL2Address,tokenBytes.get(TOKEN_TYPE.KUSD)!);
        
        //CTEZ
        let ctezContract = await Tezos.wallet.at(process.env["REACT_APP_CTEZ_CONTRACT"]!,compose(tzip12, tzip16));
        let ctezBalance =await dekuClient.getBalance(userL2Address,tokenBytes.get(TOKEN_TYPE.CTEZ)!);
        
        //UUSD
        let uusdContract = await Tezos.wallet.at(process.env["REACT_APP_UUSD_CONTRACT"]!,tzip12);
        let uusdBalance =await dekuClient.getBalance(userL2Address,tokenBytes.get(TOKEN_TYPE.UUSD)!);
        
        //EURL
        let eurlContract = await Tezos.wallet.at(process.env["REACT_APP_EURL_CONTRACT"]!,tzip12);
        let eurlBalance =await dekuClient.getBalance(userL2Address,tokenBytes.get(TOKEN_TYPE.EURL)!);
        
        let balance = new Map<TOKEN_TYPE,BigNumber>();
        balance.set(TOKEN_TYPE.XTZ,XTZbalance.dividedBy(Math.pow(10,6))); //convert mutez to tez
        balance.set(TOKEN_TYPE.KUSD,kUSDBalance.dividedBy(Math.pow(10,(await kUSDContract.tzip12().getTokenMetadata(0)).decimals)));//convert from lowest kUSD decimal
        balance.set(TOKEN_TYPE.CTEZ,ctezBalance.dividedBy(Math.pow(10,(await ctezContract.tzip12().getTokenMetadata(0)).decimals)));//convert from muctez
        balance.set(TOKEN_TYPE.UUSD,uusdBalance.dividedBy(Math.pow(10,(await uusdContract.tzip12().getTokenMetadata(0)).decimals)));//convert from lowest UUSD decimal
        balance.set(TOKEN_TYPE.EURL,eurlBalance.dividedBy(Math.pow(10,(await eurlContract.tzip12().getTokenMetadata(0)).decimals)));//convert from lowest EURL decimal
        
        switch(tokenTypeRef.current){
            case TOKEN_TYPE.XTZ : newCurrentBalance=balance.get(TOKEN_TYPE.XTZ)!;break;
            case TOKEN_TYPE.KUSD : newCurrentBalance=balance.get(TOKEN_TYPE.KUSD)!;break;
            case TOKEN_TYPE.CTEZ : newCurrentBalance=balance.get(TOKEN_TYPE.CTEZ)!;break;
            case TOKEN_TYPE.UUSD : newCurrentBalance=balance.get(TOKEN_TYPE.UUSD)!;break;
            case TOKEN_TYPE.EURL : newCurrentBalance=balance.get(TOKEN_TYPE.EURL)!;break;
        }
        
        setUserTicketBalance(balance);
        console.log("All ticket balances initialized",balance);
        
        rollupBoxRef?.current?.setShouldBounce(false);
        
        if(!oldTicketBalance.current){ //first time, we just record the value
            oldTicketBalance.current = newCurrentBalance;
        }
        else if(!newCurrentBalance.isEqualTo(oldTicketBalance.current)){
            setTimeout(() => {
                rollupBoxRef?.current?.setChangeTicketColor(newCurrentBalance.isGreaterThan(oldTicketBalance.current!)?"green":"red");
                rollupBoxRef?.current?.setShouldBounce(true)
                setTimeout(() => {
                    rollupBoxRef?.current?.setChangeTicketColor("");
                    oldTicketBalance.current = newCurrentBalance; //keep old value before it vanishes
                }, 1000);
            }, 500);
        }
        
        
        
    }
    
    
    
    const refreshContract = async() => {
        const c = await Tezos.wallet.at(process.env["REACT_APP_CONTRACT"]!);
        const store : ContractStorage = {...(await c?.storage())}; //copy fields
        setContract(c);        
        setContractStorage(store);
        console.log(store)
    }
    
    useEffect(() => { (async () => {
        refreshContract();
        refreshBalance();
        refreshTicketBalance();
        setInterval(refreshBalance, 15*1000); //refresh async L1 balances 
        setInterval(refreshTicketBalance, 15*1000); //refresh async L2 balances 
    })();
}, []);


const isDepositButtonDisabled = () : boolean | undefined => {
    let isDisabled = true;
    switch(tokenType){
        case TOKEN_TYPE.XTZ : isDisabled= (quantity.isZero() || (userBalance.get(TOKEN_TYPE.XTZ) !== undefined && (  userBalance.get(TOKEN_TYPE.XTZ)!.isLessThan(quantity) ) ));break;
        case TOKEN_TYPE.CTEZ : isDisabled= (quantity.isZero() || (userBalance.get(TOKEN_TYPE.CTEZ) !== undefined && ( userBalance.get(TOKEN_TYPE.CTEZ)!.isLessThan(quantity) )));break;
        case TOKEN_TYPE.KUSD : isDisabled= (quantity.isZero() || (userBalance.get(TOKEN_TYPE.KUSD) !== undefined && ( userBalance.get(TOKEN_TYPE.KUSD)!.isLessThan(quantity) )));break;
        case TOKEN_TYPE.UUSD : isDisabled= (quantity.isZero() || (userBalance.get(TOKEN_TYPE.UUSD) !== undefined && ( userBalance.get(TOKEN_TYPE.UUSD)!.isLessThan(quantity) )));break;
        case TOKEN_TYPE.EURL : isDisabled= (quantity.isZero() || (userBalance.get(TOKEN_TYPE.EURL) !== undefined && ( userBalance.get(TOKEN_TYPE.EURL)!.isLessThan(quantity) )));break;
    }
    return isDisabled;
}

const handlePendingDeposit = async (event : MouseEvent<HTMLButtonElement>,from : string,contractFAStorage : ContractFAStorage, ticketTokenType : string ) => {
    event.preventDefault();
    
    const operations : WalletParamsWithKind[]= [];
    
    try{
        setTezosLoading(true);
        
        console.log("from",from);
        console.log("contractFAStorage",contractFAStorage);
        
        
        
        //1. Treasury takes tokens
        
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
        
        enqueueSnackbar("Treasury has batched collaterization "+contractFAStorage.amountToTransfer.toNumber()+" tokens from "+from, {variant: "success", autoHideDuration:10000});        
        setTezosLoading(false);
    }catch (error : any) {
        console.table(`Error: ${JSON.stringify(error, null, 2)}`);
        let tibe : TransactionInvalidBeaconError = new TransactionInvalidBeaconError(error);
        enqueueSnackbar(tibe.data_message, { variant:"error" , autoHideDuration:10000});
        setTezosLoading(false);
        return;
    } 
    
    try{
        setTezosLoading(true);
        
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
        
        const batch : WalletOperationBatch = await Tezos.wallet.batch(operations);
        const batchOp = await batch.send();
        const br = await batchOp.confirmation(1);
        
        await refreshContract();
        enqueueSnackbar("Pending deposit from "+from+" has been successfully processed", {variant: "success", autoHideDuration:10000});
        
    }catch (error : any) {
        console.table(`Error: ${JSON.stringify(error, null, 2)}`);
        let tibe : TransactionInvalidBeaconError = new TransactionInvalidBeaconError(error);
        enqueueSnackbar(tibe.data_message, { variant:"error" , autoHideDuration:10000});
        return;
    }finally{
        setTezosLoading(false);
    } 
    
    
    setTezosLoading(false);
}

const handlePendingWithdraw = async (event : MouseEvent<HTMLButtonElement>,to : string,contractFAStorage : ContractFAStorage, ticketTokenType :string) => {
    event.preventDefault();
    
    const operations : WalletParamsWithKind[]= [];
    
    try{
        setTezosLoading(true);
        
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
        
        enqueueSnackbar("Pending withdraw for "+to+" has been successfully batched", {variant: "success", autoHideDuration:10000});
        
    }catch (error : any) {
        console.table(`Error: ${JSON.stringify(error, null, 2)}`);
        let tibe : TransactionInvalidBeaconError = new TransactionInvalidBeaconError(error);
        enqueueSnackbar(tibe.data_message, { variant:"error" , autoHideDuration:10000});
        return;
    }
    
    
    try{
        setTezosLoading(true);
        
        //2. Treasury give back tokens

        //2.a for FA1.2
        if(ticketTokenType === TOKEN_TYPE.CTEZ || ticketTokenType === TOKEN_TYPE.KUSD){
            let fa12Contract : WalletContract = await Tezos.wallet.at(contractFAStorage.faAddress);
        
        console.log("contractFAStorage.faAddress",contractFAStorage.faAddress);
        
        operations.push({
            kind: OpKind.TRANSACTION,
            ...fa12Contract.methods.transfer(contractStorage?.treasuryAddress,to,contractFAStorage.amountToTransfer.toNumber()).toTransferParams()
        });

        enqueueSnackbar("Treasury enqueing  "+contractFAStorage.amountToTransfer.toNumber()+" FA1.2 tokens for "+to, {variant: "success", autoHideDuration:10000});        

    }

        //2.b for FA2
        console.log("ticketTokenType",ticketTokenType)
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
        enqueueSnackbar("Treasury enqueing  "+contractFAStorage.amountToTransfer.toNumber()+" FA2 tokens for "+to, {variant: "success", autoHideDuration:10000});        

    }

        const batch : WalletOperationBatch = await Tezos.wallet.batch(operations);
        const batchOp = await batch.send();
        const br = await batchOp.confirmation(1);
        
        enqueueSnackbar("Treasury gave back  "+contractFAStorage.amountToTransfer.toNumber()+" tokens to "+to, {variant: "success", autoHideDuration:10000});        
        setTezosLoading(false);
    }catch (error : any) {
        console.table(`Error: ${JSON.stringify(error, null, 2)}`);
        let tibe : TransactionInvalidBeaconError = new TransactionInvalidBeaconError(error);
        enqueueSnackbar(tibe.data_message, { variant:"error" , autoHideDuration:10000});
        setTezosLoading(false);
        return;
    }finally{
        setTezosLoading(false);
    }  
    
    
    setTezosLoading(false);
}

const handleDeposit = async (event : MouseEvent) => {
    
    event.preventDefault();
    setTezosLoading(true);
    
    let c : WalletContract = await Tezos.wallet.at(process.env["REACT_APP_CONTRACT"]!);   
    
    const operations : WalletParamsWithKind[]= [];
    
    try {
        
        if( (tokenType !== TOKEN_TYPE.XTZ) && (rollupType === ROLLUP_TYPE.CHUSAI)){
            alert("CHUSAI is not yet ready for other token than native XTZ");
            return;
        }
        
        let decimals = Math.pow(10,6);
        
        //in case of FA1.2, an allowance should be granted with minimum tokens
        if(tokenType === TOKEN_TYPE.CTEZ || tokenType === TOKEN_TYPE.KUSD){
            let faContract = await Tezos.wallet.at( tokenType === TOKEN_TYPE.CTEZ?process.env["REACT_APP_CTEZ_CONTRACT"]! : process.env["REACT_APP_KUSD_CONTRACT"]!  , compose(tzip12,tzip16));
            let faContractStorage : FA12Contract = await faContract.storage() as FA12Contract;
            let allowance : BigNumber|undefined = await faContractStorage.allowances.get<BigNumber>({
                owner: userAddress,
                spender: contractStorage?.treasuryAddress
            });
            decimals = Math.pow(10,(await faContract.tzip12().getTokenMetadata(0)).decimals);
            
            if(allowance === undefined || allowance.isLessThan(quantity.multipliedBy(decimals))) {
                enqueueSnackbar("Allowance ("+allowance+") is not enough for requested collateral of "+(quantity.multipliedBy(decimals))+", please allow an allowance first", {variant: "warning", autoHideDuration:10000});        
                
                if(allowance === undefined || allowance.toNumber() == 0){
                    
                    operations.push({
                        kind: OpKind.TRANSACTION,
                        ...faContract.methods.approve(contractStorage?.treasuryAddress,quantity.multipliedBy(decimals)).toTransferParams(),
                    })
                    
                    enqueueSnackbar("Your allowance of "+quantity+" "+ tokenType +" has been batched for Treasury (wait 1 or 2 blocks for Treasury to take your collateral)", {variant: "success", autoHideDuration:10000});        
                }else{//need to reset allowance to zero, then reset allowance back to avoid HACK
                    enqueueSnackbar("As allowance is not null, we need to reset allowance to zero, then reset allowance back to quantity to avoid HACK", {variant: "warning", autoHideDuration:10000});        
                    
                    operations.push({
                        kind: OpKind.TRANSACTION,
                        ...faContract.methods.approve(contractStorage?.treasuryAddress,0).toTransferParams(),
                    })
                    
                    operations.push({
                        kind: OpKind.TRANSACTION,
                        ...faContract.methods.approve(contractStorage?.treasuryAddress,quantity.multipliedBy(decimals)).toTransferParams(),
                    })
                    
                    enqueueSnackbar("Your allowance of "+quantity+" "+ tokenType +" has been batched for Treasury (wait 1 or 2 blocks for Treasury to take your collateral)", {variant: "success", autoHideDuration:10000});        
                }
                
            }else{
                console.log("FA1.2 allowance is fine (actual : "+(allowance.dividedBy(decimals).toNumber())+", requested : "+quantity+")")
            }
        }
        
        //in case of FA2, adding Treasury as operator is mandatory
        if(tokenType === TOKEN_TYPE.EURL || tokenType === TOKEN_TYPE.UUSD){
            let fa2Contract = await Tezos.wallet.at( tokenType === TOKEN_TYPE.UUSD?process.env["REACT_APP_UUSD_CONTRACT"]! : process.env["REACT_APP_EURL_CONTRACT"]! , tzip12  );
            
            decimals = Math.pow(10,(await fa2Contract.tzip12().getTokenMetadata(0)).decimals);
            
            console.log("parameter signature",fa2Contract.parameterSchema.ExtractSignatures());
            
            operations.push({
                kind: OpKind.TRANSACTION,
                ...fa2Contract.methods.update_operators([
                    {add_operator:
                        {
                            owner : userAddress,
                            operator : contractStorage?.treasuryAddress,
                            token_id : 0
                        }}]).toTransferParams(),
                    });
                    
                    enqueueSnackbar("Treasury "+contractStorage?.treasuryAddress+" has been added to operator list", {variant: "success", autoHideDuration:10000});        
                    
                }
                
                let param : ContractParameters = 
                tokenType === TOKEN_TYPE.XTZ ? new ContractXTZParameters( quantity.multipliedBy(decimals),rollupType === ROLLUP_TYPE.DEKU ? LAYER2Type.L2_DEKU : rollupType === ROLLUP_TYPE.TORU ? LAYER2Type.L2_TORU : LAYER2Type.L2_CHUSAI ,userL2Address,rollupType.address) 
                : new ContractFAParameters(
                    quantity.multipliedBy(decimals),  
                    process.env["REACT_APP_"+tokenType+"_CONTRACT"]!,
                    rollupType === ROLLUP_TYPE.DEKU ? LAYER2Type.L2_DEKU : rollupType === ROLLUP_TYPE.TORU ? LAYER2Type.L2_TORU : LAYER2Type.L2_CHUSAI,
                    userL2Address,
                    rollupType.address);
                    
                    /* console.log("param",param);
                    let inspect = c.methods.deposit(...Object.values(param)).toTransferParams();
                    console.log("inspect",inspect);    
                    console.log("parameter signature",c.parameterSchema.ExtractSignatures());
                    */
                    
                    
                    operations.push({
                        kind: OpKind.TRANSACTION,
                        ...c.methods.deposit(...Object.values(param)).toTransferParams(),
                        amount: tokenType === TOKEN_TYPE.XTZ?quantity.toNumber():0,
                    });
                    
                    
                    console.log("await Tezos.wallet.batch");
                    
                    const batch : WalletOperationBatch = await Tezos.wallet.batch(operations);
                    
                    console.log("AFTER Tezos.wallet.batch");
                    
                    
                    const batchOp = await batch.send();
                    
                    
                    console.log("AFTER await batch.send()");
                    
                    
                    const br = await batchOp.confirmation(1);
                    enqueueSnackbar(tokenType === TOKEN_TYPE.XTZ?"Your deposit has been accepted (wait 1 or 2 blocks until your L2 balance get refreshed)":"Your deposit is in pending, waiting for Treasury to get your tokens in collateral and continue process", {variant: "success", autoHideDuration:10000});
                    
                    if(rollupType === ROLLUP_TYPE.TORU){//need to fecth the ticket hash to give it to the user 
                        
                        //seacrh for the ticket hash
                        let ticketHash = "";
                        for(const opLine of br.block.operations){
                            for (const op of opLine){
                                for (const content of op.contents){
                                    switch (content.kind) {
                                        // @ts-ignore
                                        case OpKind.TRANSACTION: {
                                            if("metadata" in content){
                                                const iorArray = (content as OperationContentsAndResultTransaction).metadata.internal_operation_results;
                                                if(iorArray && iorArray.length > 0 ){
                                                    for( const ior of iorArray){
                                                        ticketHash = (ior.result as OperationResultTransaction).ticket_hash!;
                                                        break;
                                                    }
                                                } 
                                                else continue;
                                                
                                            } else continue;
                                        }
                                        default : continue;
                                    }
                                }
                            }
                        }
                        
                        enqueueSnackbar("Store your ticket hash somewhere, you will need it later : "+ticketHash, {variant: "success", autoHideDuration:10000});
                    }
                    
                    await refreshContract();
                } catch (error : any) {
                    console.table(`Error: ${JSON.stringify(error, null, 2)}`);
                    let tibe : TransactionInvalidBeaconError = new TransactionInvalidBeaconError(error);
                    enqueueSnackbar(tibe.data_message, { variant:"error" , autoHideDuration:10000});
                    
                } finally {
                    setTezosLoading(false);
                }
                
                setTezosLoading(false);
            };
            
            
            // ************************************* WITHDRAW *********************************
            
            const [handleId , setHandleId] = useState<number>(0);
            const [proof, setProof]  = useState<string>(""); 
            const [proofList, setProofList] = useState<Array<[string,string]>>([]);
            const [inputProof1,setInputProof1] = useState<string>("");
            const [inputProof2,setInputProof2] = useState<string>("");
            
            
            
            const handleL2Withdraw = async (event : MouseEvent<HTMLButtonElement>) => {
                
                event.preventDefault();
                setTezosLoading(true);
                
                try {
                    const opHash = await dekuClient.withdraw(userL2Address,quantity.toNumber(),tokenBytes.get(TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE])!);
                    enqueueSnackbar("The proof will be available in 10s. Keep this code ( "+opHash+" ) to do a Claim on L1 with user "+userL2Address, {variant: "success", autoHideDuration:10000});
                } catch (error : any) {
                    console.table(`Error: ${JSON.stringify(error, null, 2)}`);
                    let tibe : TransactionInvalidBeaconError = new TransactionInvalidBeaconError(error);
                    enqueueSnackbar(tibe.data_message, { variant:"error" , autoHideDuration:10000});
                    
                } finally {
                    setTezosLoading(false);
                }
                
                setTezosLoading(false);
            };
            
            
            
            const isDesktop = useMediaQuery('(min-width:600px)');
            
            return (
                
                
                
                
                <Box display="flex"
                justifyContent="center"
                alignItems="center" 
                color="primary.main" 
                alignContent={"space-between"} 
                textAlign={"center"} 
                borderRadius={5}
                bgcolor="secondary.main"
                width={!isDesktop?"100%":"700px"}
                sx={{ marginTop : "5vh", padding : "2em"}}
                >
                
                
                
                <Backdrop
                sx={{ color: '#fff', zIndex: (theme : any) => theme.zIndex.drawer + 1 }}
                open={tezosLoading}
                >
                <CircularProgress color="inherit" />
                </Backdrop>
                
                <Stack      width="inherit"  >
                
                
                {activeAccount && activeAccount?.address === userAddress && activeAccount.accountIdentifier!==LAYER2Type.L2_DEKU ? 
                    <UserWallet 
                    ref={userWalletRef}
                    isDirectionDeposit={isDirectionDeposit()!}
                    userAddress={userAddress}
                    userBalance={userBalance}
                    activeAccount={activeAccount}
                    quantity={quantity}
                    setQuantity={setQuantity}
                    tokenType={tokenType}
                    setTokenType={setTokenType}
                    />    
                    : 
                    <RollupBox 
                    isDirectionDeposit={isDirectionDeposit()!}
                    ref={rollupBoxRef}
                    Tezos={Tezos}
                    userAddress={userL2Address}
                    setUserAddress={undefined}
                    userBalance={userTicketBalance}
                    tokenBytes={tokenBytes}
                    handlePendingWithdraw={undefined}
                    handlePendingDeposit={handlePendingDeposit}
                    handleL2Transfer={undefined}
                    rollupType={rollupType}
                    rollup={rollup}
                    dekuClient={dekuClient}
                    tokenType={TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE]}
                    quantity={quantity}
                    setQuantity={setQuantity}
                    setTokenType={setTokenType}
                    />
                }
                
                <Grid item xs={12} md={3} >
                
                
                {isDirectionDeposit()?
                    <div style={{height:0}}>
                    <Button sx={{position:"relative",top:"-90px"}} color="warning" variant="contained" disabled={isDepositButtonDisabled()} onClick={(e)=>handleDeposit(e)}>DEPOSIT</Button>
                    </div>
                    :
                    <div style={{height:0}}>
                    <Button disabled={rollupType === ROLLUP_TYPE.CHUSAI || rollupType === ROLLUP_TYPE.TORU } sx={{position:"relative",top:"-90px"}} color="warning" variant="contained"  onClick={(e)=>handleL2Withdraw(e)}>Withdraw</Button>
                    </div>
                }
                
                {contractStorage?.treasuryAddress == userAddress?
                    
                    
                    <Accordion>
                    <AccordionSummary
                    expandIcon={<UnfoldMoreOutlined />}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                    >
                    <Typography>Pending operations</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                    
                    {!isDirectionDeposit() && contractStorage.faPendingWithdrawals?  Array.from(contractStorage.faPendingWithdrawals.entries()).map(( [key,val]: [[string,string],ContractFAStorage]) => 
                        {
                            let tokenType : string = tokenBytes.get(TOKEN_TYPE.XTZ) == key[1]? TOKEN_TYPE.XTZ : tokenBytes.get(TOKEN_TYPE.CTEZ) == key[1] ?  TOKEN_TYPE.CTEZ : tokenBytes.get(TOKEN_TYPE.KUSD) == key[1] ?  TOKEN_TYPE.KUSD : tokenBytes.get(TOKEN_TYPE.UUSD) == key[1] ?  TOKEN_TYPE.UUSD : TOKEN_TYPE.EURL ;
                            
                            return <div key={key[0]+key[1]+val.type}>  
                            <Badge  max={999999999999999999}
                            badgeContent={val.amountToTransfer.toNumber()}         
                            color="primary">
                            <Avatar component="span" src={tokenType+".png"} />
                            <Avatar variant="square" src="ticket.png" />
                            </Badge>
                            <span> for {<span className="address"><span className="address1">{key[0].substring(0,key[0].length/2)}</span><span className="address2">{key[0].substring(key[0].length/2)}</span></span>} </span>
                            <Tooltip title="Redeem collaterized user's tokens from tickets' rollup">
                            <Button onClick={(e)=>handlePendingWithdraw(e,key[0],val,tokenType)} startIcon={<AddShoppingCartOutlined/>}></Button>
                            </Tooltip>
                            </div>
                        }
                        ):""}
                        
                        
                        {isDirectionDeposit() && contractStorage.faPendingDeposits ?Array.from(contractStorage.faPendingDeposits.entries()).map(( [key,val]: [[string,string],ContractFAStorage]) => 
                            {let l2Address : string = val.l2Type.l2_DEKU?val.l2Type.l2_DEKU : val.l2Type.l2_TORU;
                                let tokenType : string = tokenBytes.get(TOKEN_TYPE.XTZ) == key[1]? TOKEN_TYPE.XTZ : tokenBytes.get(TOKEN_TYPE.CTEZ) == key[1] ?  TOKEN_TYPE.CTEZ : tokenBytes.get(TOKEN_TYPE.KUSD) == key[1] ?  TOKEN_TYPE.KUSD : tokenBytes.get(TOKEN_TYPE.UUSD) == key[1] ?  TOKEN_TYPE.UUSD : TOKEN_TYPE.EURL ;
                                
                                return <div key={key[0]+key[1]+val.type}>   
                                
                                <Badge  max={999999999999999999}
                                badgeContent={val.amountToTransfer.toNumber()}         
                                color="primary">
                                <Avatar component="span" src={tokenType+".png"} />
                                <Avatar variant="square" src="ticket.png" />
                                </Badge>
                                <span> for {<span className="address"><span className="address1">{l2Address.substring(0,l2Address.length/2)}</span><span className="address2">{l2Address.substring(l2Address.length/2)}</span></span>} </span>
                                
                                
                                <Tooltip title="Collaterize user's tokens and swap to real tickets for rollup">
                                <Button onClick={(e)=>handlePendingDeposit(e,key[0],val,tokenType)} startIcon={<AddShoppingCartOutlined/>}></Button>
                                </Tooltip>
                                </div>
                            }
                            ):""}
                            
                            
                            
                            </AccordionDetails>
                            </Accordion>
                            
                            
                            
                            
                            
                            
                            
                            :""
                        }
                        
                        
                        
                        </Grid>
                        
                        <Grid item xs={12} md={1} >
                        
                        
                        
                        
                        <Divider
                        orientation= "horizontal" 
                        sx={{display:"block"}}
                        >                        <SwapVert sx={{transform : "scale(3.5)"}} color="primary" onClick={()=>switchActiveAccount()}/> 
                        </Divider>
                        
                        
                        
                        
                        
                        </Grid>
                        
                        {activeAccount && activeAccount?.address === userAddress && activeAccount.accountIdentifier!==LAYER2Type.L2_DEKU? 
                            <RollupBox 
                            ref={rollupBoxRef}
                            Tezos={Tezos}
                            userAddress={userL2Address}
                            setUserAddress={undefined}
                            userBalance={userTicketBalance}
                            tokenBytes={tokenBytes}
                            handlePendingWithdraw={undefined}
                            handlePendingDeposit={handlePendingDeposit}
                            handleL2Transfer={undefined}
                            rollupType={rollupType}
                            rollup={rollup}
                            isDirectionDeposit={isDirectionDeposit()!}
                            dekuClient={dekuClient}
                            tokenType={TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE]}
                            quantity={quantity}
                            setQuantity={setQuantity}
                            setTokenType={setTokenType}
                            />
                            :
                            <UserWallet 
                            isDirectionDeposit={isDirectionDeposit()!}
                            userAddress={userAddress}
                            userBalance={userBalance} 
                            activeAccount={activeAccount!}
                            quantity={quantity}
                            setQuantity={setQuantity}
                            tokenType={tokenType}
                            setTokenType={setTokenType}
                            />    
                        }
                        
                        </Stack>
                        
                        </Box>
                        );
                    };
                    
                    export default DepositWithdrawV2;
                    
                    
                    