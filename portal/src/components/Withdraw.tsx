import React, { useState, useEffect, MouseEvent, Fragment, ForwardRefExoticComponent, RefAttributes, useRef } from "react";
import { BigMapAbstraction, compose, TezosToolkit, WalletContract, WalletOperationBatch, WalletParamsWithKind } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import Button from "@mui/material/Button";
import {  Avatar, Backdrop, Badge, Box, CircularProgress, Divider, FormControl, FormLabel, Grid, Hidden, IconButton, InputAdornment, InputLabel, ListItem, MenuItem, Paper, Popover, Select, SelectChangeEvent, Stack, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import { AccountCircle, Add, Delete, InfoOutlined, Key, } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { TransactionInvalidBeaconError } from "./TransactionInvalidBeaconError";
import {   ContractFA12Storage,  ContractStorage } from "./TicketerContractUtils";
import {  getBytes, LAYER2Type, RollupCHUSAI, RollupDEKU, RollupTORU, ROLLUP_TYPE, TOKEN_TYPE } from "./TezosUtils";
import { FA12Contract } from "./fa12Contract";
import BigNumber from 'bignumber.js';
import { RollupParameters, RollupParametersDEKU, RollupParametersTORU } from "./RollupParameters";
import { OpKind } from "@taquito/rpc";
import UserWallet from "./UserWallet";
import RollupBox, { RollupBoxComponentType } from "./RollupBox";
import { tzip12 } from "@taquito/tzip12";
import { tzip16 } from "@taquito/tzip16";


type WithdrawProps = {
    Tezos: TezosToolkit;
    wallet: BeaconWallet;
    userAddress:string;
};

const Withdraw = ({
    Tezos,
    wallet,
    userAddress
}: WithdrawProps): JSX.Element => {
    
    const [userBalance, setUserBalance] = useState<Map<TOKEN_TYPE,number>>(new Map());
    
    const [quantity, setQuantity]  = useState<number>(0); //in float TEZ
    const [handleId , setHandleId] = useState<number>(0);
    const [proof, setProof]  = useState<string>(""); 
    const [proofList, setProofList] = useState<Array<[string,string]>>([]);
    const [inputProof1,setInputProof1] = useState<string>("");
    const [inputProof2,setInputProof2] = useState<string>("");
    
    
    const [l1Address, setL1Address]  = useState<string>("");
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
    
    
    const refreshBalance = async() => {
        //XTZ
        const XTZbalance = await Tezos.tz.getBalance(userAddress);
        
        //FA1.2 LOOP
        
        //kUSD
        let kUSDContract  = await Tezos.wallet.at(process.env["REACT_APP_KUSD_CONTRACT"]!,compose(tzip12, tzip16));
        const kUSDtokenMap : BigMapAbstraction = (await kUSDContract.storage() as FA12Contract).tokens;
        let kUSDBalance : BigNumber|undefined = await kUSDtokenMap.get<BigNumber>(userAddress);
        
        
        //CTEZ
        let ctezContract  = await Tezos.wallet.at(process.env["REACT_APP_CTEZ_CONTRACT"]!,compose(tzip12, tzip16));
        const cteztokenMap : BigMapAbstraction = (await ctezContract.storage() as FA12Contract).tokens;
        let ctezBalance : BigNumber|undefined = await cteztokenMap.get<BigNumber>(userAddress);
        
        
        let balance = new Map();
        balance.set(TOKEN_TYPE.XTZ,XTZbalance.toNumber() / Math.pow(10,6)); //convert mutez to tez
        if(kUSDBalance !== undefined) balance.set(TOKEN_TYPE.KUSD,kUSDBalance.toNumber() / Math.pow(10,(await kUSDContract.tzip12().getTokenMetadata(0)).decimals));//convert to mukUSD
        else balance.set(TOKEN_TYPE.KUSD,0); 
        if(ctezBalance !== undefined) balance.set(TOKEN_TYPE.CTEZ,ctezBalance.toNumber() / Math.pow(10,(await ctezContract.tzip12().getTokenMetadata(0)).decimals))//convert to muctez
        else balance.set(TOKEN_TYPE.CTEZ,0); 
        
        setUserBalance(balance);
        
    }
    
    
    
    const refreshContract = async() => {
        const c = await Tezos.wallet.at(process.env["REACT_APP_CONTRACT"]!);
        const store : ContractStorage = {...(await c?.storage())}; //copy fields
        setContract(c);        
        setContractStorage(store);
    }
    
    useEffect( () => { (async () => {
        refreshContract();
        
        setTokenBytes(new Map([
            [TOKEN_TYPE.XTZ, await getBytes(TOKEN_TYPE.XTZ)],
            [TOKEN_TYPE.CTEZ, await getBytes(TOKEN_TYPE.CTEZ,process.env["REACT_APP_CTEZ_CONTRACT"]!)],
            [TOKEN_TYPE.KUSD, await getBytes(TOKEN_TYPE.KUSD,process.env["REACT_APP_KUSD_CONTRACT"]!)]
        ]));
        
        refreshBalance();
        
        if(rollupType === ROLLUP_TYPE.DEKU)setL1Address(userAddress);
        
        
    })();
}, []);



const handlePendingWithdraw = async (event : MouseEvent<HTMLButtonElement>,to : string,contractFA12Storage : ContractFA12Storage) => {
    event.preventDefault();
    
    const operations : WalletParamsWithKind[]= [];
    
    try{
        setTezosLoading(true);
        
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
        let fa12Contract : WalletContract = await Tezos.wallet.at(contractFA12Storage.fa12Address);
        
        console.log("contractFA12Storage.fa12Address",contractFA12Storage.fa12Address);
        
        operations.push({
            kind: OpKind.TRANSACTION,
            ...fa12Contract.methods.transfer(contractStorage?.treasuryAddress,to,contractFA12Storage.amountToTransfer.toNumber()).toTransferParams()
        })
        
        const batch : WalletOperationBatch = await Tezos.wallet.batch(operations);
        const batchOp = await batch.send();
        const br = await batchOp.confirmation(1);
        
        enqueueSnackbar("Treasury gave back  "+contractFA12Storage.amountToTransfer.toNumber()+" tokens to "+to, {variant: "success", autoHideDuration:10000});        
        refreshBalance();
        await refreshContract();
        await myRef!.current!.refreshRollup();
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


const handleWithdraw = async (event : MouseEvent<HTMLButtonElement>) => {
    
    event.preventDefault();
    setTezosLoading(true);
    
    let rollupContract : WalletContract = await Tezos.wallet.at(rollupType === ROLLUP_TYPE.DEKU ?process.env["REACT_APP_ROLLUP_CONTRACT_DEKU"]!:process.env["REACT_APP_ROLLUP_CONTRACT_TORU"]!);
    
    try {
        let param : RollupParameters = 
        rollupType === ROLLUP_TYPE.DEKU ? 
        new RollupParametersDEKU(
            process.env["REACT_APP_CONTRACT"]!+"%withdrawDEKU", 
            quantity,
            tokenType == TOKEN_TYPE.XTZ ? await getBytes(TOKEN_TYPE.XTZ) : tokenType == TOKEN_TYPE.CTEZ ? await getBytes(TOKEN_TYPE.CTEZ,process.env["REACT_APP_CTEZ_CONTRACT"]!) : await getBytes(TOKEN_TYPE.KUSD,process.env["REACT_APP_KUSD_CONTRACT"]!) ,
            handleId,
            l1Address,
            process.env["REACT_APP_CONTRACT"]!,
            proof,
            proofList) 
            : new RollupParametersTORU();
            
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
    
    
    
    return (
        <Box color="primary.main" alignContent={"space-between"} textAlign={"center"} sx={{ margin: "1em", padding : "1em",  backgroundColor : "#FFFFFFAA"}} >
        
        
        
        <Backdrop
        sx={{ color: '#fff', zIndex: (theme : any) => theme.zIndex.drawer + 1 }}
        open={tezosLoading}
        >
        <CircularProgress color="inherit" />
        </Backdrop>
        <Grid container spacing={2} >
        
        
        <RollupBox 
        ref={myRef}
        Tezos={Tezos}
        userAddress={userAddress}
        tokenBytes={tokenBytes}
        handlePendingWithdraw={handlePendingWithdraw}
        handlePendingDeposit={undefined}
        contractStorage={contractStorage}
        setRollupType={setRollupType}
        rollupType={rollupType}
        rollup={rollup}
        setRollup={setRollup}
        />
        
        
        <Grid item xs={12} md={4} >
        
        {rollup instanceof RollupDEKU ? <Fragment>
            
            <Grid item xs={12} md={12} padding={1}>
            <TextField
            fullWidth
            required
            disabled
            value={l1Address}
            onChange={(e)=>setL1Address(e.target.value?e.target.value.trim():"")}
            label="L1 address"
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
                
                <Grid item xs={12} md={12} padding={1}>
                
                
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
                label={<span>Quantity <Tooltip title="Ticket quantity is expressed with the lowest decimal 10^-6. Example : mutez, muctez, etc ..."><InfoOutlined/></Tooltip></span> }
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
                onChange={(e : SelectChangeEvent)=>{setTokenType(e.target.value)}}
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
                    <TextField required
                    fullWidth
                    type="number"
                    value={handleId}
                    onChange={(e)=>setHandleId(e.target.value?parseInt(e.target.value):0)}
                    label="Proof ID"
                    inputProps={{style: { textAlign: 'right' }}} 
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                            <Key />
                            </InputAdornment>
                            ),
                            style : {fontSize : "0.8em"}
                        }}
                        variant="standard"  
                        />
                        </Grid>
                        
                        <Grid item xs={12} md={12} padding={1}>
                        <TextField
                        fullWidth
                        required
                        value={proof}
                        onChange={(e)=>setProof(e.target.value?e.target.value.trim():"")}
                        label="Proof hash"
                        inputProps={{style: { textAlign: 'right' }}} 
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                <Key />
                                </InputAdornment>
                                ),
                                style : {fontSize : "0.8em"}
                            }}
                            variant="standard"  
                            />
                            </Grid>
                            
                            
                            
                            
                            <Grid item xs={12} md={12} padding={1}>
                            
                            <span style={{textAlign:"left"}}>
                            <InputLabel style={{fontSize : "0.8em"}} required >Proof List</InputLabel>
                            
                            
                            <TextField required value={inputProof1} label="Proof 1" 
                            inputProps={{style: { textAlign: 'right' }}} 
                            variant="standard"
                            onChange={(e) => setInputProof1(e.target.value?e.target.value.trim():"")} ></TextField>
                            <TextField required sx={{ marginLeft: "0.5em" }} value={inputProof2}  label="Proof 2" 
                            inputProps={{style: { textAlign: 'right' }}} 
                            variant="standard"
                            onChange={(e) => setInputProof2(e.target.value?e.target.value.trim():"")} ></TextField>
                            <Button sx={{ marginLeft: "0.5em" }}  variant="outlined" onClick={()=>{setProofList(
                                proofList.concat([
                                    [inputProof1.startsWith("0x")?inputProof1.substring(2):inputProof1,
                                    inputProof2.startsWith("0x")?inputProof2.substring(2):inputProof2]
                                ]));setInputProof1("");setInputProof2("");}}><Add style={{padding : "0.3em 0em"}}/></Button>
                                </span>
                                {  proofList.map( ([proofItem1,proofItem2] : [string,string],index : number) =>
                                    
                                    <div key={proofItem1+proofItem2}>
                                    <hr />
                                    <span> 
                                    <InputLabel style={{maxWidth : "40%" , display: "inline-block"}} >{proofItem1}</InputLabel>&nbsp;
                                    <InputLabel style={{maxWidth : "40%" , display: "inline-block"}} >{proofItem2}</InputLabel>
                                    <Delete onClick={()=>{proofList.splice(index, 1);setProofList(Object.assign([], proofList))}}/>
                                    </span>
                                    </div>
                                    )
                                }
                                
                                </Grid>
                                
                                
                                
                                </Fragment>
                                
                                : "not yet implemented ..." }
                                
                                <Grid item xs={12} md={12} padding={1}>
                                <Button disabled={rollupType === ROLLUP_TYPE.CHUSAI || rollupType === ROLLUP_TYPE.TORU } variant="contained" onClick={(e)=>handleWithdraw(e)}>Withdraw</Button>
                                </Grid>
                                
                                
                                
                                </Grid>
                                
                                <UserWallet 
                                userAddress={userAddress}
                                userBalance={userBalance}
                                />
                                
                                </Grid>
                                
                                </Box>
                                );
                            };
                            
                            export default Withdraw;