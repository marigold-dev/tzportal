import { Dispatch, SetStateAction, useState, useEffect, MouseEvent } from "react";
import { BigMapAbstraction, TezosToolkit, WalletContract } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import Button from "@mui/material/Button";
import { Avatar, Backdrop, Box, Card, CardContent, CardHeader, Chip, CircularProgress, Divider, Grid, IconButton, InputAdornment, Stack, TextField } from "@mui/material";
import { AccountBalanceWallet, AccountCircle, CameraRoll, MoreVert } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { TransactionInvalidBeaconError } from "./TransactionInvalidBeaconError";
import { ContractFA12Parameters, ContractParameters, ContractXTZParameters } from "./ContractParameters";
import { TezosTicket, TezosUtils, TOKEN_TYPE } from "./TezosUtils";
import { FA12Contract } from "./fa12Contract";
import BigNumber from 'bignumber.js';
import { collapseTextChangeRangesAcrossMultipleVersions } from "typescript";


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
    
    const [userBalance, setUserBalance] = useState<number>(0);
    const [userCtezBalance, setUserCtezBalance] = useState<number>(0);
    const [rollupInbox, setRollupInbox] = useState<Map<string,TezosTicket>>(new Map<string,TezosTicket>());
    
    const [quantity, setQuantity]  = useState<number>(0); //in float TEZ
    const [l2Address, setL2Address]  = useState<string>("");
    const [tokenType, setTokenType]  = useState<TOKEN_TYPE>(TOKEN_TYPE.XTZ);
    
    //TEZOS OPERATIONS
    const [tezosLoading, setTezosLoading]  = useState(false);
    
    // MESSAGES
    const { enqueueSnackbar } = useSnackbar();
    
    const refreshCtezBalance = async() => {
        let ctezContract : WalletContract = await Tezos.wallet.at(process.env["REACT_APP_CTEZ_CONTRACT"]!);
        const tokenMap : BigMapAbstraction = (await ctezContract.storage() as FA12Contract).tokens;
        let ctezBalance : BigNumber|undefined = await tokenMap.get<BigNumber>(userAddress);
        setUserCtezBalance(ctezBalance !== undefined ? ctezBalance.toNumber() / 1000000 : 0); //convert to muctez
    }
    
    const refreshBalance = async() => {
        const balance = await Tezos.tz.getBalance(userAddress);
        setUserBalance(balance.toNumber() / 1000000); //convert mutez to tez
    }
    
    let rollupAddress : string = process.env["REACT_APP_ROLLUP_CONTRACT"]!;
    const refreshRollupInbox = async() => {
        let rollupContract : WalletContract = await Tezos.wallet.at(rollupAddress);
        let ticketMap = TezosUtils.convertTicketMapStorageToTicketMap(rollupContract);
        setRollupInbox(ticketMap);
    }
    
    useEffect(() => {
        refreshRollupInbox();
        refreshBalance();
        refreshCtezBalance();
    }, []);
    
    
    const handleDeposit = async (event : MouseEvent<HTMLButtonElement>) => {
        
        event.preventDefault();
        setTezosLoading(true);
        
        let c : WalletContract = await Tezos.wallet.at(process.env["REACT_APP_CONTRACT"]!);
        
        try {
            
            //in case of FA1.2 an allowance should be granted with minimum tokens
            if(tokenType === TOKEN_TYPE.FA12){
                let fa12Contract : WalletContract = await Tezos.wallet.at(process.env["REACT_APP_CTEZ_CONTRACT"]!);
                let fa12ContractStorage : FA12Contract = await fa12Contract.storage() as FA12Contract;
                let allowance : BigNumber|undefined = await fa12ContractStorage.allowances.get<BigNumber>({
                    owner: userAddress,
                    spender: process.env["REACT_APP_CONTRACT"]!
                });
                if(allowance === undefined || allowance.toNumber() < quantity*1000000) {
                    enqueueSnackbar("Allowance ("+allowance+") is not enough for requested collateral of "+(quantity*1000000)+", please allow an allowance first", {variant: "warning", autoHideDuration:10000});        
                    
                    if(allowance === undefined || allowance.toNumber() == 0){
                        const op = await fa12Contract.methods.approve(process.env["REACT_APP_CONTRACT"]!,quantity*1000000).send();
                        await op.confirmation();    
                        enqueueSnackbar("Your allowance of "+quantity*1000000+" has been accepted for "+process.env["REACT_APP_CONTRACT"]!, {variant: "success", autoHideDuration:10000});        
                    }else{//need to reset allowance to zero, then reset allowance back to avoid HACK
                        enqueueSnackbar("As allowance is not null, we need to reset allowance to zero, then reset allowance back to quantity to avoid HACK", {variant: "warning", autoHideDuration:10000});        
                        const op = await fa12Contract.methods.approve(process.env["REACT_APP_CONTRACT"]!,0).send();
                        await op.confirmation();
                        const op2 = await fa12Contract.methods.approve(process.env["REACT_APP_CONTRACT"]!,quantity*1000000).send();
                        await op2.confirmation();        
                        enqueueSnackbar("Your allowance of "+quantity*1000000+" has been accepted for "+process.env["REACT_APP_CONTRACT"]!, {variant: "success", autoHideDuration:10000});        
                    }
                    
                }else{
                    console.log("FA1.2 allowance is fine (actual : "+allowance+", requested : "+quantity*1000000+")")
                }
            }
            
            let param : ContractParameters = tokenType === TOKEN_TYPE.XTZ ? new ContractXTZParameters( ""+(quantity*1000000) ,l2Address,process.env["REACT_APP_ROLLUP_CONTRACT"]!) : new ContractFA12Parameters(""+(quantity*1000000),process.env["REACT_APP_CTEZ_CONTRACT"]!,l2Address,process.env["REACT_APP_ROLLUP_CONTRACT"]!)
            const op = await c.methods.deposit(...Object.values(param)).send(tokenType === TOKEN_TYPE.XTZ?{amount:quantity}:{});
            await op.confirmation();
            enqueueSnackbar("Your deposit has been accepted (wait a bit the refresh)", {variant: "success", autoHideDuration:10000});
            await refreshRollupInbox();
            await refreshBalance();
            await refreshCtezBalance();
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
        
        <Grid item xs={12} md={3}>
        <Card>
        <CardHeader
        sx={{color:"secondary.main",backgroundColor:"primary.main"}}
        avatar={<Avatar aria-label="recipe"><AccountBalanceWallet /> </Avatar>}
        title="Tezos Wallet"
        subheader={<div className="address"><span className="address1">{userAddress.substring(0,userAddress.length/2)}</span><span className="address2">{userAddress.substring(userAddress.length/2)}</span></div> }
        />
        <CardContent>
        <Stack spacing={1} direction="column"  divider={<Divider orientation="horizontal" flexItem />}>
        <Chip 
        onClick={()=>{setTokenType(TOKEN_TYPE.XTZ);setQuantity(userBalance)}}
        sx={{justifyContent: "right"}}
        deleteIcon={<Avatar sx={{height:24,width:24}} src="XTZ.png" />}
        onDelete={()=>{}}
        label={userBalance}
        variant="outlined" 
        />
        <Chip 
        onClick={()=>{setTokenType(TOKEN_TYPE.FA12);setQuantity(userCtezBalance)}}
        sx={{justifyContent: "right"}}
        onDelete={()=>{}}
        deleteIcon={<Avatar sx={{height:24,width:24}} src="CTEZ.png" />}
        label={userCtezBalance}
        variant="outlined"
        />
        </Stack>
        </CardContent>
        </Card>
        </Grid>
        
        <Grid item xs={12} md={4} >
        
        <Grid item xs={12} md={12} padding={1}>
        <TextField
        fullWidth
        
        value={l2Address}
        onChange={(e)=>setL2Address(e.target.value)}
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
            
            <Grid item xs={12} md={12} padding={1}>
            <TextField
            
            fullWidth
            type="number"
            onChange={(e)=>setQuantity(e.target.value?parseFloat(e.target.value):0)}
            value={quantity}
            label="Quantity"
            inputProps={{style: { textAlign: 'right' }}} 
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                    <Avatar sx={{height:"24px", width:"24px"}} src={ tokenType === TOKEN_TYPE.XTZ ? "XTZ.png":"CTEZ.png"} />
                    </InputAdornment>
                    ),
                }}
                variant="standard"
                />
                </Grid>
                <Grid item xs={12} md={12} padding={1}>
                <Button variant="contained" onClick={(e)=>handleDeposit(e)}>DEPOSIT</Button>
                </Grid>
                </Grid>
                
                <Grid item xs={12} md={5} >
                <Card>
                <CardHeader
                sx={{color:"secondary.main",backgroundColor:"primary.main"}}
                avatar={<Avatar aria-label="recipe"><CameraRoll /></Avatar>}
                action={
                    <IconButton aria-label="settings" onClick={()=>alert("Not yet implemented! It will be able to switch to another rollup later")}>
                    <MoreVert />
                    </IconButton>
                }
                title="Default rollup"
                subheader={<div className="address"><span className="address1">{rollupAddress.substring(0,rollupAddress.length/2)}</span><span className="address2">{rollupAddress.substring(rollupAddress.length/2)}</span></div> }
                />
                <CardContent>
                <Stack spacing={1} direction="column"  divider={<Divider orientation="horizontal" flexItem />}>
                {rollupInbox.size > 0 ? 
                    Array.from(rollupInbox.entries()).map(([key,ticket],index) => <Chip 
                    key={index}
                    avatar={ticket.value==="Unit"?<Avatar src="XTZ-ticket.png"/> : <Avatar src="CTEZ-ticket.png"/>}
                    label={<span>{ticket.amount} for <span className="address"><span className="address1">{key.substring(0,key.length/2)}</span><span className="address2">{key.substring(key.length/2)}</span></span></span>}
                    variant="outlined" 
                    />
                    ) 
                    : <span />}
                    </Stack>
                    </CardContent>
                    </Card>
                    </Grid>
                    </Grid>
                    
                    </Box>
                    );
                };
                
                export default Deposit;