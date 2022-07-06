import React, { useState, useEffect, MouseEvent, Fragment, useRef } from "react";
import { BigMapAbstraction, OpKind, TezosToolkit, WalletContract, WalletOperationBatch, WalletParamsWithKind } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import Button from "@mui/material/Button";
import { Avatar, Backdrop, Badge, Box, Card, CardContent, CardHeader, Chip, CircularProgress, Divider, Grid, IconButton, InputAdornment, InputLabel, ListItem, MenuItem, Paper, Popover, Select, SelectChangeEvent, Stack, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Tooltip } from "@mui/material";
import { AccountBalanceWallet, AccountCircle, AddShoppingCartOutlined, ArrowDropDown, CameraRoll } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { TransactionInvalidBeaconError } from "./TransactionInvalidBeaconError";
import {  ContractFA12Parameters, ContractFA12Storage, ContractParameters, ContractStorage, ContractXTZParameters } from "./TicketerContractUtils";
import {  getBytes, LAYER2Type, RollupCHUSAI, RollupDEKU, RollupTORU, ROLLUP_TYPE, TezosUtils, TOKEN_TYPE } from "./TezosUtils";
import { FA12Contract } from "./fa12Contract";
import BigNumber from 'bignumber.js';
import {  styled } from "@mui/system";
import { OperationContentsAndResultTransaction , OperationResultTransaction} from "@taquito/rpc";
import UserWallet from "./UserWallet";
import RollupBox, { RollupBoxComponentType } from "./RollupBox";


type DepositProps = {
    Tezos: TezosToolkit;
    wallet: BeaconWallet;
    userAddress:string;
};

const Deposit = ({
    Tezos,
    wallet,
    userAddress
}: DepositProps): JSX.Element => {
    
    const [userBalance, setUserBalance] = useState<Map<TOKEN_TYPE,number>>(new Map());
    
    const [quantity, setQuantity]  = useState<number>(0); //in float TEZ
    const [l2Address, setL2Address]  = useState<string>("");
    const [tokenType, setTokenType]  = useState<string>(TOKEN_TYPE.XTZ);
    
    const [rollupType , setRollupType] = useState<ROLLUP_TYPE>(ROLLUP_TYPE.DEKU);
    const [rollup , setRollup] = useState<RollupTORU | RollupDEKU | RollupCHUSAI>();
    
    const [contractStorage, setContractStorage] = useState<ContractStorage>();
    const [contract, setContract] =  useState<WalletContract>();
    
    const [tokenBytes,setTokenBytes] = useState<Map<TOKEN_TYPE,string>>(new Map<TOKEN_TYPE,string>());
    
    //TEZOS OPERATIONS
    const [tezosLoading, setTezosLoading]  = useState(false);
    
    // MESSAGES
    const { enqueueSnackbar } = useSnackbar();
    

    const myRef = useRef<RollupBoxComponentType>();


    //POPUP
    const [selectRollupPopupAnchorEl, setSelectRollupPopupAnchorEl] = React.useState<null | HTMLElement>(null);
    const showSelectRollupPopup = (event : React.MouseEvent<HTMLButtonElement>) => {
        setSelectRollupPopupAnchorEl(event.currentTarget);
    };
    const closeSelectRollupPopup = () => {
        setSelectRollupPopupAnchorEl(null);
    };
    const selectRollupPopupOpen = Boolean(selectRollupPopupAnchorEl);
    
    const refreshBalance = async() => {
        //XTZ
        const XTZbalance = await Tezos.tz.getBalance(userAddress);
        
        //FA1.2 LOOP
        
        //kUSD
        let kUSDContract : WalletContract = await Tezos.wallet.at(process.env["REACT_APP_KUSD_CONTRACT"]!);
        const kUSDtokenMap : BigMapAbstraction = (await kUSDContract.storage() as FA12Contract).tokens;
        let kUSDBalance : BigNumber|undefined = await kUSDtokenMap.get<BigNumber>(userAddress);
        
        
        //CTEZ
        let ctezContract : WalletContract = await Tezos.wallet.at(process.env["REACT_APP_CTEZ_CONTRACT"]!);
        const cteztokenMap : BigMapAbstraction = (await ctezContract.storage() as FA12Contract).tokens;
        let ctezBalance : BigNumber|undefined = await cteztokenMap.get<BigNumber>(userAddress);
        
        
        let balance = new Map();
        balance.set(TOKEN_TYPE.XTZ,XTZbalance.toNumber() / 1000000); //convert mutez to tez
        if(kUSDBalance !== undefined) balance.set(TOKEN_TYPE.KUSD,kUSDBalance.toNumber() / 1000000);//convert to mukUSD
        else balance.set(TOKEN_TYPE.KUSD,0); 
        if(ctezBalance !== undefined) balance.set(TOKEN_TYPE.CTEZ,ctezBalance.toNumber() / 1000000)//convert to muctez
        else balance.set(TOKEN_TYPE.CTEZ,0); 
        
        setUserBalance(balance);
        
    }
    
    const refreshContract = async() => {
        const c = await Tezos.wallet.at(process.env["REACT_APP_CONTRACT"]!);
        const store : ContractStorage = {...(await c?.storage())}; //copy fields
        setContract(c);        
        setContractStorage(store);
    }
    
    useEffect(() => { (async () => {
        refreshContract();
        refreshBalance();
        await myRef!.current!.refreshRollup();
        setTokenBytes(new Map([
            [TOKEN_TYPE.XTZ, await getBytes(TOKEN_TYPE.XTZ)],
            [TOKEN_TYPE.CTEZ, await getBytes(TOKEN_TYPE.CTEZ,process.env["REACT_APP_CTEZ_CONTRACT"]!)]
        ]));
    })();
}, []);


const isDepositButtonDisabled = () : boolean | undefined => {
    let isDisabled = true;
    switch(tokenType){
        case TOKEN_TYPE.XTZ : isDisabled= (quantity === 0 || (userBalance.get(TOKEN_TYPE.XTZ) !== undefined && (quantity > userBalance.get(TOKEN_TYPE.XTZ)!)));break;
        case TOKEN_TYPE.CTEZ : isDisabled= (quantity === 0 || (userBalance.get(TOKEN_TYPE.CTEZ) !== undefined && (quantity > userBalance.get(TOKEN_TYPE.CTEZ)!)));break;
        case TOKEN_TYPE.KUSD : isDisabled= (quantity === 0 || (userBalance.get(TOKEN_TYPE.KUSD) !== undefined && (quantity > userBalance.get(TOKEN_TYPE.KUSD)!)));break;
    }
    return isDisabled;
}

const handlePendingDeposit = async (event : MouseEvent<HTMLButtonElement>,from : string,contractFA12Storage : ContractFA12Storage) => {
    event.preventDefault();
    
    const operations : WalletParamsWithKind[]= [];
    
    try{
        setTezosLoading(true);

        console.log("from",from);
        
        //1. Treasury takes tokens
        let fa12Contract : WalletContract = await Tezos.wallet.at(contractFA12Storage.fa12Address);
        
        operations.push({
            kind: OpKind.TRANSACTION,
            ...fa12Contract.methods.transfer(from,contractStorage?.treasuryAddress,contractFA12Storage.amountToTransfer.toNumber()).toTransferParams()
        })
        
        enqueueSnackbar("Treasury has batched collaterization "+contractFA12Storage.amountToTransfer.toNumber()+" tokens from "+from, {variant: "success", autoHideDuration:10000});        
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
    
    let c : WalletContract = await Tezos.wallet.at(process.env["REACT_APP_CONTRACT"]!);
    const operations : WalletParamsWithKind[]= [];
    
    try {
        
        if(tokenType === TOKEN_TYPE.CTEZ && rollupType == ROLLUP_TYPE.CHUSAI){
            alert("CHUSAI is not yet ready for FA1.2");
            return;
        }
        
        //in case of FA1.2 an allowance should be granted with minimum tokens
        if(tokenType === TOKEN_TYPE.CTEZ || tokenType === TOKEN_TYPE.KUSD){
            let fa12Contract : WalletContract = await Tezos.wallet.at( tokenType === TOKEN_TYPE.CTEZ?process.env["REACT_APP_CTEZ_CONTRACT"]! : process.env["REACT_APP_KUSD_CONTRACT"]!);
            let fa12ContractStorage : FA12Contract = await fa12Contract.storage() as FA12Contract;
            let allowance : BigNumber|undefined = await fa12ContractStorage.allowances.get<BigNumber>({
                owner: userAddress,
                spender: contractStorage?.treasuryAddress
            });
            if(allowance === undefined || allowance.toNumber() < quantity*1000000) {
                enqueueSnackbar("Allowance ("+allowance+") is not enough for requested collateral of "+(quantity*1000000)+", please allow an allowance first", {variant: "warning", autoHideDuration:10000});        
                
                if(allowance === undefined || allowance.toNumber() == 0){
                    
                    operations.push({
                        kind: OpKind.TRANSACTION,
                        ...fa12Contract.methods.approve(contractStorage?.treasuryAddress,quantity*1000000).toTransferParams(),
                    })
                    
                    enqueueSnackbar("Your allowance of "+quantity*1000000+" has been batched for Treasury "+contractStorage?.treasuryAddress, {variant: "success", autoHideDuration:10000});        
                }else{//need to reset allowance to zero, then reset allowance back to avoid HACK
                    enqueueSnackbar("As allowance is not null, we need to reset allowance to zero, then reset allowance back to quantity to avoid HACK", {variant: "warning", autoHideDuration:10000});        
                    
                    operations.push({
                        kind: OpKind.TRANSACTION,
                        ...fa12Contract.methods.approve(contractStorage?.treasuryAddress,0).toTransferParams(),
                    })
                    
                    operations.push({
                        kind: OpKind.TRANSACTION,
                        ...fa12Contract.methods.approve(contractStorage?.treasuryAddress,quantity*1000000).toTransferParams(),
                    })
                    
                    enqueueSnackbar("Your allowance of "+quantity*1000000+" has been batched for Treasury "+contractStorage?.treasuryAddress, {variant: "success", autoHideDuration:10000});        
                }
                
            }else{
                console.log("FA1.2 allowance is fine (actual : "+allowance+", requested : "+quantity*1000000+")")
            }
        }
        
        let param : ContractParameters = 
        tokenType === TOKEN_TYPE.XTZ ? new ContractXTZParameters( new BigNumber(quantity*1000000),rollupType === ROLLUP_TYPE.DEKU ? LAYER2Type.L2_DEKU : rollupType === ROLLUP_TYPE.TORU ? LAYER2Type.L2_TORU : LAYER2Type.L2_CHUSAI ,l2Address,rollupType.address) 
        : new ContractFA12Parameters(new BigNumber(quantity*1000000),  tokenType === TOKEN_TYPE.CTEZ ?    process.env["REACT_APP_CTEZ_CONTRACT"]! : process.env["REACT_APP_KUSD_CONTRACT"]!,rollupType === ROLLUP_TYPE.DEKU ? LAYER2Type.L2_DEKU : rollupType === ROLLUP_TYPE.TORU ? LAYER2Type.L2_TORU : LAYER2Type.L2_CHUSAI,l2Address,rollupType.address);
        
        /* console.log("param",param);
        let inspect = c.methods.deposit(...Object.values(param)).toTransferParams();
        console.log("inspect",inspect);    
        console.log("parameter signature",c.parameterSchema.ExtractSignatures());
        */

        console.log("l2addrdeposit",l2Address);
        
        operations.push({
            kind: OpKind.TRANSACTION,
            ...c.methods.deposit(...Object.values(param)).toTransferParams(),
            amount: tokenType === TOKEN_TYPE.XTZ?quantity:0,
        })
        
        const batch : WalletOperationBatch = await Tezos.wallet.batch(operations);
        const batchOp = await batch.send();
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

//just needed for the selectRollupPopup selection
const HoverBox = styled(Box)`&:hover {background-color: #a9a9a9;}`;

return (
    <Box color="primary.main" alignContent={"space-between"} textAlign={"center"} sx={{ margin: "1em", padding : "1em",  backgroundColor : "#FFFFFFAA"}} >
    
    <Popover
    id="selectRollupPopup"
    open={selectRollupPopupOpen}
    anchorEl={selectRollupPopupAnchorEl}
    onClose={closeSelectRollupPopup}
    anchorOrigin={{
        vertical: 'top',
        horizontal: 'left',
    }}
    >
    <Paper title="Choose rollup or sidechain" sx={{padding : 1}} elevation={3}>
    <HoverBox onClick={()=>{setRollupType(ROLLUP_TYPE.DEKU);closeSelectRollupPopup();}}>{ROLLUP_TYPE.DEKU.name} : {ROLLUP_TYPE.DEKU.address}</HoverBox>
    <hr />
    <HoverBox onClick={()=>{setRollupType(ROLLUP_TYPE.TORU);closeSelectRollupPopup();}}>{ROLLUP_TYPE.TORU.name} : {ROLLUP_TYPE.TORU.address}</HoverBox>
    <hr />
    <HoverBox onClick={()=>{setL2Address(userAddress);setRollupType(ROLLUP_TYPE.CHUSAI);closeSelectRollupPopup();}}>{ROLLUP_TYPE.CHUSAI.name} : {ROLLUP_TYPE.CHUSAI.address}</HoverBox>
    </Paper>
    </Popover>
    
    <Backdrop
    sx={{ color: '#fff', zIndex: (theme : any) => theme.zIndex.drawer + 1 }}
    open={tezosLoading}
    >
    <CircularProgress color="inherit" />
    </Backdrop>
    <Grid container spacing={2} >
    
    <UserWallet 
    userAddress={userAddress}
    userBalance={userBalance} />
    
    <Grid item xs={12} md={4} >
    
    <Grid item xs={12} md={12} padding={1}>
    <TextField
    fullWidth
    required
    value={l2Address}
    disabled={rollupType == ROLLUP_TYPE.CHUSAI}
    onChange={(e)=>{setL2Address(e.target.value?e.target.value.trim():"")}}
    label="L2 address"
    inputProps={{style: { textAlign: 'right' }}} 
    InputProps={{
        startAdornment: (
            <InputAdornment position="start">
            <AccountCircle />
            </InputAdornment>
            ),
            style : {fontSize : "0.8em"}
        }}
        variant="standard"  
        />
        </Grid>
        
        
        
        <Grid item xs={12} md={12} padding={1} >
        
        
        <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            padding : "0.4em"
        }}>
        
        <TextField fullWidth 
        required 
        type="number"
        onChange={(e)=>setQuantity(e.target.value?parseFloat(e.target.value):0)}
        value={quantity}
        label="Quantity"
        inputProps={{style: { textAlign: 'right' }}} 
        variant="standard"
        />
        
        &nbsp;
        
        <Select 
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        defaultValue={TOKEN_TYPE.XTZ}
        value={tokenType}
        label="token type"
        onChange={(e : SelectChangeEvent)=>{setTokenType(e.target.value);console.log("toekn",e.target.value)}}
        >
        { Object.keys(TOKEN_TYPE).map((key)  => 
            <MenuItem key={key} value={key}>
            <Badge >
            <Avatar component="span" src={key+".png"}></Avatar>
            </Badge>
            </MenuItem>
        ) }
        
        
        </Select>
        
        </Box>
        
        </Grid>
        
        
        <Grid item xs={12} md={12} padding={1}>
        <Button variant="contained" disabled={isDepositButtonDisabled()} onClick={(e)=>handleDeposit(e)}>DEPOSIT</Button>
        </Grid>
        </Grid>
        
      
      

        <RollupBox 
    ref={myRef}
    Tezos={Tezos}
    userAddress={userAddress}
    tokenBytes={tokenBytes}
    handlePendingWithdraw={undefined}
    handlePendingDeposit={handlePendingDeposit}
    contractStorage={contractStorage}
    />

                            </Grid>
                            
                            </Box>
                            );
                        };
                        
                        export default Deposit;