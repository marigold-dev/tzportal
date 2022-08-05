import React, { useState, useEffect, MouseEvent, Fragment, useRef, SetStateAction, Dispatch } from "react";
import { BigMapAbstraction, compose, Contract, OpKind, TezosToolkit, WalletContract, WalletOperationBatch, WalletParamsWithKind } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import Button from "@mui/material/Button";
import { Avatar, Backdrop, Badge, Box, Card, CardContent, CardHeader, Chip, CircularProgress, Divider, Grid, IconButton, InputAdornment, InputLabel, ListItem, MenuItem, Paper, Popover, Select, SelectChangeEvent, Stack, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import { AccountBalanceWallet, AccountCircle, AddShoppingCartOutlined, ArrowDropDown, CameraRoll, SwapCallsRounded, SwapHorizontalCircleOutlined, SwapHorizOutlined, SwapHorizRounded } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { TransactionInvalidBeaconError } from "./TransactionInvalidBeaconError";
import {  ContractFAParameters, ContractFAStorage, ContractParameters, ContractStorage, ContractXTZParameters } from "./TicketerContractUtils";
import {  getBytes, getTokenBytes, LAYER2Type, RollupCHUSAI, RollupDEKU, RollupTORU, ROLLUP_TYPE, TezosUtils, TOKEN_TYPE } from "./TezosUtils";
import { FA12Contract } from "./fa12Contract";
import BigNumber from 'bignumber.js';
import {  styled } from "@mui/system";
import { OperationContentsAndResultTransaction , OperationResultTransaction} from "@taquito/rpc";
import UserWallet from "./UserWallet";
import RollupBox, { RollupBoxComponentType } from "./RollupBox";
import { TokenMetadata, tzip12, Tzip12ContractAbstraction } from "@taquito/tzip12";
import { tzip16 } from "@taquito/tzip16";
import { FA2Contract } from "./fa2Contract";
import { AccountInfo, NetworkType} from "@airgap/beacon-types";
import { RollupParameters, RollupParametersDEKU, RollupParametersTORU } from "./RollupParameters";
import DEKUClient, { DEKUWithdrawProof } from "./DEKUClient";



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
    accounts
}: DepositWithdrawV2Props): JSX.Element => {
    
    const [userBalance, setUserBalance] = useState<Map<TOKEN_TYPE,BigNumber>>(new Map());
    
    const [quantity, setQuantity]  = useState<number>(0); //in float TEZ
    const [tokenType, setTokenType]  = useState<string>(TOKEN_TYPE.XTZ);
    
    
    const [contractStorage, setContractStorage] = useState<ContractStorage>();
    const [contract, setContract] =  useState<WalletContract>();
    
    const [tokenBytes,setTokenBytes] = useState<Map<TOKEN_TYPE,string>>(new Map<TOKEN_TYPE,string>());
    
    //TEZOS OPERATIONS
    const [tezosLoading, setTezosLoading]  = useState(false);
    
    // MESSAGES
    const { enqueueSnackbar } = useSnackbar();
    
    
    const myRef = useRef<RollupBoxComponentType>();
    
    
    
    const switchActiveAccount = async()=> {
        const l1Account : AccountInfo | undefined = accounts.find((a)=> {return a.address == userAddress && a.accountIdentifier!==LAYER2Type.L2_DEKU}); 
        const l2Account : AccountInfo | undefined = accounts.find((a)=> {return a.address == userL2Address && a.accountIdentifier===LAYER2Type.L2_DEKU}); 
        setActiveAccount(activeAccount?.address === l1Account?.address ? l2Account : l1Account);
    }
    
    const refreshBalance = async() => {
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
        
        setUserBalance(balance);
        console.log("All balances initialized",balance);
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
        await myRef!.current!.refreshRollup();
        setTokenBytes(await getTokenBytes());
    })();
}, []);


const isDepositButtonDisabled = () : boolean | undefined => {
    let isDisabled = true;
    switch(tokenType){
        case TOKEN_TYPE.XTZ : isDisabled= (quantity === 0 || (userBalance.get(TOKEN_TYPE.XTZ) !== undefined && (  userBalance.get(TOKEN_TYPE.XTZ)!.isLessThan(quantity) ) ));break;
        case TOKEN_TYPE.CTEZ : isDisabled= (quantity === 0 || (userBalance.get(TOKEN_TYPE.CTEZ) !== undefined && ( userBalance.get(TOKEN_TYPE.CTEZ)!.isLessThan(quantity) )));break;
        case TOKEN_TYPE.KUSD : isDisabled= (quantity === 0 || (userBalance.get(TOKEN_TYPE.KUSD) !== undefined && ( userBalance.get(TOKEN_TYPE.KUSD)!.isLessThan(quantity) )));break;
        case TOKEN_TYPE.UUSD : isDisabled= (quantity === 0 || (userBalance.get(TOKEN_TYPE.UUSD) !== undefined && ( userBalance.get(TOKEN_TYPE.UUSD)!.isLessThan(quantity) )));break;
        case TOKEN_TYPE.EURL : isDisabled= (quantity === 0 || (userBalance.get(TOKEN_TYPE.EURL) !== undefined && ( userBalance.get(TOKEN_TYPE.EURL)!.isLessThan(quantity) )));break;
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
        refreshBalance();
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
        await myRef!.current!.refreshRollup();
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



const handleDeposit = async (event : MouseEvent) => {
    
    event.preventDefault();
    setTezosLoading(true);
    
    console.log("Tezos",Tezos);
    console.log("Tezos.wallet",Tezos.wallet);
    
    
    let c : WalletContract = await Tezos.wallet.at(process.env["REACT_APP_CONTRACT"]!);
    
    console.log("C",c);
    
    
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
            
            if(allowance === undefined || allowance.toNumber() < quantity*decimals) {
                enqueueSnackbar("Allowance ("+allowance+") is not enough for requested collateral of "+(quantity*decimals)+", please allow an allowance first", {variant: "warning", autoHideDuration:10000});        
                
                if(allowance === undefined || allowance.toNumber() == 0){
                    
                    operations.push({
                        kind: OpKind.TRANSACTION,
                        ...faContract.methods.approve(contractStorage?.treasuryAddress,quantity*decimals).toTransferParams(),
                    })
                    
                    enqueueSnackbar("Your allowance of "+quantity*decimals+" has been batched for Treasury "+contractStorage?.treasuryAddress, {variant: "success", autoHideDuration:10000});        
                }else{//need to reset allowance to zero, then reset allowance back to avoid HACK
                    enqueueSnackbar("As allowance is not null, we need to reset allowance to zero, then reset allowance back to quantity to avoid HACK", {variant: "warning", autoHideDuration:10000});        
                    
                    operations.push({
                        kind: OpKind.TRANSACTION,
                        ...faContract.methods.approve(contractStorage?.treasuryAddress,0).toTransferParams(),
                    })
                    
                    operations.push({
                        kind: OpKind.TRANSACTION,
                        ...faContract.methods.approve(contractStorage?.treasuryAddress,quantity*decimals).toTransferParams(),
                    })
                    
                    enqueueSnackbar("Your allowance of "+quantity*decimals+" has been batched for Treasury "+contractStorage?.treasuryAddress, {variant: "success", autoHideDuration:10000});        
                }
                
            }else{
                console.log("FA1.2 allowance is fine (actual : "+allowance+", requested : "+quantity*decimals+")")
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
                tokenType === TOKEN_TYPE.XTZ ? new ContractXTZParameters( new BigNumber(quantity*decimals),rollupType === ROLLUP_TYPE.DEKU ? LAYER2Type.L2_DEKU : rollupType === ROLLUP_TYPE.TORU ? LAYER2Type.L2_TORU : LAYER2Type.L2_CHUSAI ,userL2Address,rollupType.address) 
                : new ContractFAParameters(
                    new BigNumber(quantity*decimals),  
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
                        amount: tokenType === TOKEN_TYPE.XTZ?quantity:0,
                    });
                    
                    
                    console.log("await Tezos.wallet.batch");
                    
                    const batch : WalletOperationBatch = await Tezos.wallet.batch(operations);
                    
                    console.log("AFTER Tezos.wallet.batch");
                    
                    
                    const batchOp = await batch.send();
                    
                    
                    console.log("AFTER await batch.send()");
                    
                    
                    const br = await batchOp.confirmation(1);
                    enqueueSnackbar(tokenType === TOKEN_TYPE.XTZ?"Your deposit has been accepted":"Your deposit is in pending, waiting for Treasury to get your tokens in collateral and continue process", {variant: "success", autoHideDuration:10000});
                    
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
                    
                    await myRef!.current!.refreshRollup();
                    await refreshBalance();
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

            const [opHash,setOpHash] = useState<string>("");
            
            const handleL1Withdraw = async (event : MouseEvent<HTMLButtonElement>) => {

                event.preventDefault();
                setTezosLoading(true);
                const dekuClient = new DEKUClient(process.env["REACT_APP_DEKU_NODE"]!,process.env["REACT_APP_CONTRACT"]!,TezosL2);

                try {
                const withdrawProof : DEKUWithdrawProof = await dekuClient.getWithdrawProof(opHash);
                alert(JSON.stringify(withdrawProof));
                console.log("withdrawProof",withdrawProof);
  
                await handleWithdraw(withdrawProof); 

                enqueueSnackbar("Your L1 Withdraw has been accepted", {variant: "success", autoHideDuration:10000});

            } catch (error : any) {
                console.table(`Error: ${JSON.stringify(error, null, 2)}`);
                let tibe : TransactionInvalidBeaconError = new TransactionInvalidBeaconError(error);
                enqueueSnackbar(tibe.data_message, { variant:"error" , autoHideDuration:10000});
                
            } finally {
                setTezosLoading(false);
            }
            
            setTezosLoading(false);
        };

            const handleL2Withdraw = async (event : MouseEvent<HTMLButtonElement>) => {
                
                event.preventDefault();
                setTezosLoading(true);
                
                try {
                    // 
                    const dekuClient = new DEKUClient(process.env["REACT_APP_DEKU_NODE"]!,process.env["REACT_APP_CONTRACT"]!,TezosL2);
                    
                    alert(await dekuClient.getBalance(userL2Address,tokenBytes.get(TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE])!));
                    

                    //alert(await dekuClient.getBlockLevel());

                    //alert(await dekuClient.requestNonce());


                    //alert(await dekuClient.getWithdrawProof("b7f65dd6fc72e9e825e894de6c798ed73baa86ffda5a52146e37c00eeb8a917a"));


                    const opHash = await dekuClient.withdraw(userL2Address,1,tokenBytes.get(TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE])!);
                    alert(opHash);
                    console.log("The proof will be available in 10s...Give this opHash to "+userL2Address+".Login to L1 and call withdraw-proof+CLAIM on ophash...");
                    console.log("opHash",opHash);
                    enqueueSnackbar("Your L2 Withdraw has been accepted with opHash"+opHash, {variant: "success", autoHideDuration:10000});
                    await myRef!.current!.refreshRollup();
                    await refreshBalance();
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
            
            const handleWithdraw = async (withdrawProof : DEKUWithdrawProof) => {
                
                setTezosLoading(true);
                
                let rollupContract : Contract = await TezosL2.contract.at(rollupType === ROLLUP_TYPE.DEKU ?process.env["REACT_APP_ROLLUP_CONTRACT_DEKU"]!:process.env["REACT_APP_ROLLUP_CONTRACT_TORU"]!);

                try {
                    let param : RollupParameters = 
                    rollupType === ROLLUP_TYPE.DEKU ? 
                    new RollupParametersDEKU(
                        process.env["REACT_APP_CONTRACT"]!+"%withdrawDEKU", 
                        withdrawProof.withdrawal_handle.amount,
                        tokenType == TOKEN_TYPE.XTZ ? await getBytes(TOKEN_TYPE.XTZ) : await getBytes(TOKEN_TYPE[tokenType.toUpperCase() as keyof typeof TOKEN_TYPE],process.env["REACT_APP_"+tokenType+"_CONTRACT"]!) ,
                        withdrawProof.withdrawal_handle.id,
                        userAddress,
                        process.env["REACT_APP_CONTRACT"]!,
                        withdrawProof.withdrawal_handles_hash,
                        withdrawProof.proof) 
                        : new RollupParametersTORU();
                        
                        console.log("param",param);

                        const op = await rollupContract.methods.withdraw(...Object.values(param)).send();
                        await op.confirmation();
                        enqueueSnackbar("Your Withdraw has been accepted", {variant: "success", autoHideDuration:10000});
                        await myRef!.current!.refreshRollup();
                        await refreshBalance();
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
                
                const isDesktop = useMediaQuery('(min-width:600px)');
                
                return (
                    <Box display="flex"
                    justifyContent="center"
                    alignItems="center" 
                    color="primary.main" 
                    alignContent={"space-between"} 
                    textAlign={"center"} 
                    sx={{ margin: "1em", padding : "1em"}}
                    minHeight="100vh"
                    >
                    
                    
                    <Backdrop
                    sx={{ color: '#fff', zIndex: (theme : any) => theme.zIndex.drawer + 1 }}
                    open={tezosLoading}
                    >
                    <CircularProgress color="inherit" />
                    </Backdrop>
                    
                    <Stack width={!isDesktop?"100%":"700px"}   >
                    
                    
                    {activeAccount && activeAccount?.address === userAddress && activeAccount.accountIdentifier!==LAYER2Type.L2_DEKU ? 
                        <UserWallet 
                        direction="From"
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
                        ref={myRef}
                        Tezos={Tezos}
                        userAddress={userAddress}
                        tokenBytes={tokenBytes}
                        handlePendingWithdraw={undefined}
                        handlePendingDeposit={handlePendingDeposit}
                        contractStorage={contractStorage}
                        setRollupType={setRollupType}
                        rollupType={rollupType}
                        rollup={rollup}
                        setRollup={setRollup}
                        />
                    }
                    
                    <Grid item xs={12} md={3} >

                    
                    {activeAccount && activeAccount?.address === userAddress && activeAccount.accountIdentifier!==LAYER2Type.L2_DEKU?
                        
                        <Fragment>
                        <Button variant="contained" disabled={isDepositButtonDisabled()} onClick={(e)=>handleDeposit(e)}>DEPOSIT</Button>

                        <div>
                        <TextField value={opHash} label="Enter your operation hash here" onChange={(e)=>setOpHash(e.target.value?e.target.value.trim():"")}/>
                        <Button variant="contained" onClick={(e)=>handleL1Withdraw(e)}>L1 Claim</Button>    
                        </div>                        

                        </Fragment>
                        
                        :   <Button disabled={rollupType === ROLLUP_TYPE.CHUSAI || rollupType === ROLLUP_TYPE.TORU } variant="contained" onClick={(e)=>handleL2Withdraw(e)}>Withdraw</Button>
                        
                    }
                  
                    
                    
                    </Grid>
                    
                    <Grid item xs={12} md={1} >
                    
                    
                    
                    
                    <Divider
                    orientation= "horizontal" 
                    flexItem
                    >                        <Avatar onClick={()=>switchActiveAccount()} > <SwapHorizOutlined color="primary"/> </Avatar>
                    </Divider>
                    
                    
                    
                    
                    
                    </Grid>
                    
                    {activeAccount && activeAccount?.address === userAddress && activeAccount.accountIdentifier!==LAYER2Type.L2_DEKU? 
                        <RollupBox 
                        ref={myRef}
                        Tezos={Tezos}
                        userAddress={userAddress}
                        tokenBytes={tokenBytes}
                        handlePendingWithdraw={undefined}
                        handlePendingDeposit={handlePendingDeposit}
                        contractStorage={contractStorage}
                        setRollupType={setRollupType}
                        rollupType={rollupType}
                        rollup={rollup}
                        setRollup={setRollup}
                        />
                        :
                        <UserWallet 
                        direction="To"
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
                
                
                