import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { TezosToolkit } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import Button from "@mui/material/Button";
import { Avatar, Box, Card, CardContent, CardHeader, CardMedia, Chip, Divider, Grid, IconButton, ListItemIcon, Paper, Stack, StepIcon } from "@mui/material";
import { AirplaneTicket, CameraRoll, MoreVert } from "@mui/icons-material";

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
    
    return (
        <Box color="primary.main" alignContent={"space-between"} textAlign={"center"} sx={{ margin: "1em", padding : "1em",  backgroundColor : "#FFFFFFAA"}} >
        
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
            <Button variant="contained" >DEPOSIT</Button>
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
                                <Chip 
                                    sx={{width:"fit-content"}}
                                    avatar={<Avatar src="XTZ-ticket.png" />}
                                    label="0 for tz4XXXXXXXXXXXXXXXX"
                                    variant="outlined" 
                                />
                        </Stack>
                    </CardContent>
            </Card>
        </Grid>
        </Grid>
        
        </Box>
        );
    };
    
    export default Deposit;