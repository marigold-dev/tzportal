import { Dispatch, SetStateAction, useState, useEffect, MouseEvent } from "react";
import { TezosToolkit, WalletContract } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import Button from "@mui/material/Button";
import { Avatar, Backdrop, Box, Card, CardContent, CardHeader, Chip, CircularProgress, Divider, Grid, IconButton, InputAdornment, Stack, TextField } from "@mui/material";
import { AccountCircle, CameraRoll, MoreVert } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { TransactionInvalidBeaconError } from "./TransactionInvalidBeaconError";
import { ContractFA12Parameters, ContractParameters, ContractXTZParameters } from "./ContractParameters";
import { TezosTicket, TezosUtils, TOKEN_TYPE } from "./TezosUtils";

type DepositProps = {
    Tezos: TezosToolkit;
    wallet: BeaconWallet;
    userBalance:number;
    userCtezBalance:number;
    setUserBalance:Dispatch<SetStateAction<number>>;
    setUserCtezBalance:Dispatch<SetStateAction<number>>;
};

const Deposit = ({
    Tezos,
    wallet,
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
            let param : ContractParameters = tokenType == TOKEN_TYPE.XTZ ? new ContractXTZParameters(""+quantity,l2Address,process.env["REACT_APP_ROLLUP_CONTRACT"]!) : new ContractFA12Parameters(""+quantity,process.env["REACT_APP_CTEZ_CONTRACT"]!,l2Address,process.env["REACT_APP_ROLLUP_CONTRACT"]!)
            //const op = await c.methods.deposit(...Object.values(param)).send(tokenType == TOKEN_TYPE.XTZ?{amount:quantity}:{});
            

            const op = await c.methods.deposit(
                "fA12_OP",
                ""+quantity,
                process.env["REACT_APP_CTEZ_CONTRACT"]!,
                l2Address,
                process.env["REACT_APP_ROLLUP_CONTRACT"]!
            ).send(tokenType == TOKEN_TYPE.XTZ?{amount:quantity}:{});
            await op.confirmation();
            enqueueSnackbar("Your deposit has been accepted (wait a bit the refresh)", {variant: "success", autoHideDuration:10000});
            await refreshRollupInbox();
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
        
        <Grid item xs={12} md={5}>
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
        sx={{width:"fit-content"}}
        avatar={<Avatar src="XTZ.png" />}
        label={userBalance/1000000}
        variant="outlined" 
        />
        <Chip 
        onClick={()=>{setTokenType(TOKEN_TYPE.FA12);setQuantity(userCtezBalance)}}
        sx={{width:"fit-content"}}
        avatar={<Avatar src="CTEZ.png" />}
        label={userCtezBalance}
        variant="outlined"
        />
        </Stack>
        </CardContent>
        </Card>
        </Grid>
        
        <Grid item xs={12} md={2} >
        <TextField
        value={l2Address}
        onChange={(e)=>setL2Address(e.target.value)}
        label="L2 address"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <AccountCircle />
            </InputAdornment>
          ),
        }}
        variant="standard"
      />
      <TextField
      type="number"
      onChange={(e)=>setQuantity(e.target.value?parseInt(e.target.value):0)}
      value={quantity}
        label="Quantity"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Avatar sx={{height:"24px", width:"24px"}} src={ tokenType == TOKEN_TYPE.XTZ ? "XTZ.png":"CTEZ.png"} />
            </InputAdornment>
          ),
        }}
        variant="standard"
      />
        <Button variant="contained" onClick={(e)=>handleDeposit(e)}>DEPOSIT</Button>
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
            avatar={ticket.value=="Unit"?<Avatar src="XTZ-ticket.png"/> : <Avatar src="CTEZ-ticket.png"/>}
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