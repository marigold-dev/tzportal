import { Dispatch, SetStateAction, useState, useEffect, MouseEvent } from "react";
import { BigMapAbstraction, TezosToolkit, WalletContract } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import Button from "@mui/material/Button";
import { Avatar, Backdrop, Box, Card, CardContent, CardHeader, Chip, CircularProgress, Divider, Grid, IconButton, InputAdornment, Stack, TextField } from "@mui/material";
import { AccountCircle, CameraRoll, MoreVert } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { TransactionInvalidBeaconError } from "./TransactionInvalidBeaconError";
import { ContractFA12Parameters, ContractParameters, ContractXTZParameters } from "./ContractParameters";
import { TezosTicket, TezosUtils, TOKEN_TYPE } from "./TezosUtils";
import { FA12Contract } from "./fa12Contract";
import BigNumber from 'bignumber.js';
import { width } from "@mui/system";


type DepositProps = {
    Tezos: TezosToolkit;
    wallet: BeaconWallet;
    userAddress:string;
    userBalance:number;
    userCtezBalance:number;
    setUserBalance:Dispatch<SetStateAction<number>>;
    setUserCtezBalance:Dispatch<SetStateAction<number>>;
};

const Deposit = ({
    Tezos,
    wallet,
    userAddress,
    userBalance,
    userCtezBalance,
    setUserBalance,
    setUserCtezBalance
}: DepositProps): JSX.Element => {
    
    
    const [rollupInbox, setRollupInbox] = useState<Map<string,TezosTicket>>(new Map<string,TezosTicket>());
    
    const [quantity, setQuantity]  = useState<number>(0);
    const [l2Address, setL2Address]  = useState<string>("");
    const [tokenType, setTokenType]  = useState<TOKEN_TYPE>(TOKEN_TYPE.XTZ);
    
    //TEZOS OPERATIONS
    const [tezosLoading, setTezosLoading]  = useState(false);
    
    // MESSAGES
    const { enqueueSnackbar } = useSnackbar();
    
    const refreshCtezBalance = async(userAddress:string) => {
        let ctezContract : WalletContract = await Tezos.wallet.at(process.env["REACT_APP_CTEZ_CONTRACT"]!);
        const tokenMap : BigMapAbstraction = (await ctezContract.storage() as FA12Contract).tokens;
        let ctezBalance : BigNumber|undefined = await tokenMap.get<BigNumber>(userAddress);
        setUserCtezBalance(ctezBalance !== undefined ? ctezBalance.toNumber() : 0); 
    }
    
    const refreshBalance = async(userAddress:string) => {
        const balance = await Tezos.tz.getBalance(userAddress);
        setUserBalance(balance.toNumber());
    }
    
    const refreshRollupInbox = async() => {
        let rollupContract : WalletContract = await Tezos.wallet.at(process.env["REACT_APP_ROLLUP_CONTRACT"]!);
        let ticketMap = TezosUtils.convertTicketMapStorageToTicketMap(rollupContract);
        setRollupInbox(ticketMap);
    }
    
    useEffect(() => {
        refreshRollupInbox();
    }, []);
    
    
    const handleDeposit = async (event : MouseEvent<HTMLButtonElement>) => {
        
        event.preventDefault();
        setTezosLoading(true);
        
        let c : WalletContract = await Tezos.wallet.at(process.env["REACT_APP_CONTRACT"]!);
        
        try {
            let param : ContractParameters = tokenType === TOKEN_TYPE.XTZ ? new ContractXTZParameters(""+quantity,l2Address,process.env["REACT_APP_ROLLUP_CONTRACT"]!) : new ContractFA12Parameters(""+quantity,process.env["REACT_APP_CTEZ_CONTRACT"]!,l2Address,process.env["REACT_APP_ROLLUP_CONTRACT"]!)
            const op = await c.methods.deposit(...Object.values(param)).send(tokenType === TOKEN_TYPE.XTZ?{amount:quantity}:{});
            await op.confirmation();
            enqueueSnackbar("Your deposit has been accepted (wait a bit the refresh)", {variant: "success", autoHideDuration:10000});
            await refreshRollupInbox();
            await refreshBalance(userAddress);
            await refreshCtezBalance(userAddress);
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
        avatar={<Avatar src="tezos.png" aria-label="recipe" />}
        title="Tezos"
        />
        <CardContent>
        <Stack spacing={1} direction="column"  divider={<Divider orientation="horizontal" flexItem />}>
        <Chip 
        
        onClick={()=>{setTokenType(TOKEN_TYPE.XTZ);setQuantity(userBalance)}}
        sx={{justifyContent: "right"}}
        deleteIcon={<Avatar sx={{height:24,width:24}} src="XTZ.png" />}
        onDelete={()=>{}}
        label={ `${userBalance} (mutez)` }
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
            onChange={(e)=>setQuantity(e.target.value?parseInt(e.target.value):0)}
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
                title="Default rollup txr1XXXXXXXXXXXXXXXX"
                />
                <CardContent>
                <Stack spacing={1} direction="column"  divider={<Divider orientation="horizontal" flexItem />}>
                {rollupInbox.size > 0 ? 
                    Array.from(rollupInbox.entries()).map(([key,ticket],index) => <Chip 
                    key={index}
                    sx={{width:"fit-content"}}
                    avatar={ticket.value==="Unit"?<Avatar src="XTZ-ticket.png"/> : <Avatar src="CTEZ-ticket.png"/>}
                    label={`${ticket.amount} for ${key}`}
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