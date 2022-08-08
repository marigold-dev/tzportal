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



type ClaimL1Props = {
    TezosL2 : TezosToolkit;
    rollupType : ROLLUP_TYPE;
    userAddress : string;
};

const ClaimL1 = ({
    TezosL2,
    rollupType,
    userAddress
}: ClaimL1Props): JSX.Element => {

    const [userBalance, setUserBalance] = useState<Map<TOKEN_TYPE,BigNumber>>(new Map());
    const [tokenType, setTokenType]  = useState<string>(TOKEN_TYPE.XTZ);

    // MESSAGES
    const { enqueueSnackbar } = useSnackbar();
    
    //TEZOS OPERATIONS
    const [tezosLoading, setTezosLoading]  = useState(false);
    
    
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
    
    const refreshBalance = async() => {
        //XTZ
        const XTZbalance = await TezosL2.tz.getBalance(userAddress);
        
        //FA1.2 LOOP
        
        //kUSD
        let kUSDContract = await TezosL2.wallet.at(process.env["REACT_APP_KUSD_CONTRACT"]!,compose(tzip12, tzip16));
        const kUSDtokenMap : BigMapAbstraction = (await kUSDContract.storage() as FA12Contract).tokens;
        let kUSDBalance : BigNumber|undefined = await kUSDtokenMap.get<BigNumber>(userAddress);
        
        
        //CTEZ
        let ctezContract = await TezosL2.wallet.at(process.env["REACT_APP_CTEZ_CONTRACT"]!,compose(tzip12, tzip16));
        const ctezContractStorage : FA12Contract = (await ctezContract.storage() as FA12Contract)
        const cteztokenMap : BigMapAbstraction = ctezContractStorage.tokens;
        let ctezBalance : BigNumber|undefined = await cteztokenMap.get<BigNumber>(userAddress);
        
        //UUSD
        let uusdContract = await TezosL2.wallet.at(process.env["REACT_APP_UUSD_CONTRACT"]!,tzip12);
        const uusdContractStorage : FA2Contract = (await uusdContract.storage() as FA2Contract)
        const uusdtokenMap : BigMapAbstraction = uusdContractStorage.ledger;
        let uusdBalance : BigNumber|undefined = await uusdtokenMap.get<BigNumber>([userAddress,0]);
        
        //EURL
        let eurlContract = await TezosL2.wallet.at(process.env["REACT_APP_EURL_CONTRACT"]!,tzip12);
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
                await refreshBalance();
            } catch (error : any) {
                console.table(`Error: ${JSON.stringify(error, null, 2)}`);
                let tibe : TransactionInvalidBeaconError = new TransactionInvalidBeaconError(error);
                enqueueSnackbar(tibe.data_message, { variant:"error" , autoHideDuration:10000});
                
            } finally {
                setTezosLoading(false);
            }
            
            setTezosLoading(false);
        };






        useEffect(() => { (async () => {
            refreshBalance();
        })();
    }, []);
    
        
        return (
            <Grid container  borderRadius={5}
            spacing={2}
            color="primary.main" 
            width="auto"
            sx={{ margin : "20vh 20vw", padding : "2em"}}
            bgcolor="secondary.main">
            
            
            
            <Backdrop
            sx={{ color: '#fff', zIndex: (theme : any) => theme.zIndex.drawer + 1 }}
            open={tezosLoading}
            >
            <CircularProgress color="inherit" />
            </Backdrop>
            
            
            <div>
            <TextField value={opHash} label="Enter your operation hash here" onChange={(e)=>setOpHash(e.target.value?e.target.value.trim():"")}/>
            <Button variant="contained" onClick={(e)=>handleL1Withdraw(e)}>L1 Claim</Button>    
            </div>          
            
            </Grid>
            );
        };
        
        export default ClaimL1;
        
        
        