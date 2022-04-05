import React, { Dispatch, SetStateAction, useState, useEffect, FormEvent, MouseEvent } from "react";
import { TezosToolkit, WalletContract } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import Button from "@mui/material/Button";
import { Avatar, Backdrop, Box, Card, CardContent, CardHeader, CardMedia, Chip, CircularProgress, Divider, Grid, IconButton, ListItemIcon, Paper, Stack, StepIcon } from "@mui/material";
import { AirplaneTicket, CameraRoll, MoreVert } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { TransactionInvalidBeaconError } from "./TransactionInvalidBeaconError";
import { ContractXTZParameters } from "./ContractParameters";
import { TicketToken } from "@taquito/michelson-encoder/dist/types/tokens/ticket";

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
    

    const [rollupInbox, setRollupInbox] = useState<Map<string,TicketToken>>(new Map<string,TicketToken>());


    //TEZOS OPERATIONS
    const [tezosLoading, setTezosLoading]  = React.useState(false);
    
    // MESSAGES
    const { enqueueSnackbar } = useSnackbar();


    useEffect(() => {
        (async () => {
            let rollupContract : WalletContract = await Tezos.wallet.at(process.env["REACT_APP_ROLLUP_CONTRACT"]!);
            console.log(await rollupContract.storage());
            setRollupInbox(await rollupContract.storage() as Map<string,TicketToken>);
        })();
      }, []);
    
    
    const handleDeposit = async (event : MouseEvent<HTMLButtonElement>) => {
        
        event.preventDefault();
        setTezosLoading(true);
        
        let c : WalletContract = await Tezos.wallet.at(process.env["REACT_APP_CONTRACT"]!);
        
        try {
            let param : ContractXTZParameters = new ContractXTZParameters('1',"tz1h5GajcQWq4ybaWuwSiYrR5PvmUxndm8T8",process.env["REACT_APP_ROLLUP_CONTRACT"]!)
            //console.log(param);
            console.log(c);
            console.log(c.parameterSchema.ExtractSignatures());
            let inspect = c.methods.deposit(
                "xTZ_OP",
                "1",
                "tz1h5GajcQWq4ybaWuwSiYrR5PvmUxndm8T8",
                process.env["REACT_APP_ROLLUP_CONTRACT"]!
            ).toTransferParams(); 
            console.log(JSON.stringify(inspect, null, 2))
            
            const op = await c.methods.deposit({
                amountToTransfer: "1",
                l2Address: "tz1h5GajcQWq4ybaWuwSiYrR5PvmUxndm8T8",
                rollupAddress: process.env["REACT_APP_ROLLUP_CONTRACT"]!
            }).send();
            await op.confirmation();
            
            enqueueSnackbar("Your deposit has been accepted (wait a bit the refresh)", {variant: "success", autoHideDuration:10000});
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
        sx={{width:"fit-content"}}
        avatar={<Avatar src="XTZ.png" />}
        label={userBalance/1000000}
        variant="outlined" 
        />
        <Chip 
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
            Array.from(rollupInbox.values()).map(ticket => <Chip 
            sx={{width:"fit-content"}}
            avatar={<Avatar src="XTZ-ticket.png" />}
            label={`${ticket.tokenVal} for tz4XXXXXXXXXXXXXXXX`}
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