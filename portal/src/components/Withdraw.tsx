import React, { useState, useEffect, MouseEvent, Fragment } from "react";
import { BigMapAbstraction, TezosToolkit, WalletContract } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import Button from "@mui/material/Button";
import { Avatar, Backdrop, Box, Card, CardContent, CardHeader, Chip, CircularProgress, Divider, Grid, Hidden, IconButton, InputAdornment, ListItem, Paper, Popover, Stack, Table, TableBody, TableCell, TableContainer, TableRow, TextField } from "@mui/material";
import { AccountBalanceWallet, AccountCircle, ArrowDropDown, CameraRoll, Key, MoreVert } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { TransactionInvalidBeaconError } from "./TransactionInvalidBeaconError";
import {  ContractFA12Parameters, ContractParameters, ContractXTZParameters } from "./ContractParameters";
import {  AddressType, RollupDEKU, RollupTORU, ROLLUP_TYPE, TezosUtils, TOKEN_TYPE } from "./TezosUtils";
import { FA12Contract } from "./fa12Contract";
import BigNumber from 'bignumber.js';
import { maxWidth, styled, width } from "@mui/system";
import { RollupParameters, RollupParametersDEKU, RollupParametersTORU } from "./RollupParameters";


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

    const [userBalance, setUserBalance] = useState<number>(0);
    const [userCtezBalance, setUserCtezBalance] = useState<number>(0);
    
    const [quantity, setQuantity]  = useState<number>(0); //in float TEZ
    const [proof, setProof]  = useState<string>(""); 

    const [l1Address, setL1Address]  = useState<string>("");
    const [tokenType, setTokenType]  = useState<TOKEN_TYPE>(TOKEN_TYPE.XTZ);
    
    const [rollupType , setRollupType] = useState<ROLLUP_TYPE>(ROLLUP_TYPE.DEKU);
    const [rollup , setRollup] = useState<RollupTORU | RollupDEKU>();
    
    //TEZOS OPERATIONS
    const [tezosLoading, setTezosLoading]  = useState(false);
    
    // MESSAGES
    const { enqueueSnackbar } = useSnackbar();

    //POPUP
    const [selectRollupPopupAnchorEl, setSelectRollupPopupAnchorEl] = React.useState<null | HTMLElement>(null);
    const showSelectRollupPopup = (event : React.MouseEvent<HTMLButtonElement>) => {
        setSelectRollupPopupAnchorEl(event.currentTarget);
    };
    const closeSelectRollupPopup = () => {
        setSelectRollupPopupAnchorEl(null);
    };
    const selectRollupPopupOpen = Boolean(selectRollupPopupAnchorEl);
    
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
    
    const refreshRollup = async() => {
        switch(rollupType){
            case ROLLUP_TYPE.TORU : setRollup(await TezosUtils.fetchRollupTORU(Tezos.rpc.getRpcUrl(),rollupType.address));break;
            case ROLLUP_TYPE.DEKU : {
                setRollup(await TezosUtils.fetchRollupDEKU(Tezos,rollupType.address));break;
            }
        }
    }
    
    useEffect(() => {
        refreshBalance();
        refreshCtezBalance();
        refreshRollup();
    }, []);

    useEffect(() => {
        refreshRollup();
    }, [rollupType]);
    
    
    const handleWithdraw = async (event : MouseEvent<HTMLButtonElement>) => {
        
        event.preventDefault();
        setTezosLoading(true);
        
        let contract : WalletContract = await Tezos.wallet.at(process.env["REACT_APP_CONTRACT"]!);
        let rollupContract : WalletContract = await Tezos.wallet.at(rollupType === ROLLUP_TYPE.DEKU ?process.env["REACT_APP_ROLLUP_CONTRACT_DEKU"]!:process.env["REACT_APP_ROLLUP_CONTRACT_TORU"]!);
        
        try {
            let param : RollupParameters = 
            rollupType === ROLLUP_TYPE.DEKU ? new RollupParametersDEKU(process.env["REACT_APP_CONTRACT"]!+"%withdrawDEKU", quantity,tokenType == TOKEN_TYPE.XTZ ? await TOKEN_TYPE.XTZ.getBytes() : await TOKEN_TYPE.FA12.getBytes(process.env["REACT_APP_CTEZ_CONTRACT"]!) ,0,l1Address,process.env["REACT_APP_CONTRACT"]!,proof) 
                    : new RollupParametersTORU()
            
             console.log("param",param);
             console.log("c.methods",rollupContract.methods);
             type StringDictionary<T> = { [key: string]: T };
             const signatures: string[][] = rollupContract.parameterSchema.ExtractSignatures();
                let signatureDict: StringDictionary<string[]> = {};
                for (let i = 0; i < signatures.length; i++) {

                    // 0th element is key, the rest are values of the dict
                    signatureDict[signatures[i][0]] = signatures[i];
                    signatureDict[signatures[i][0]].shift();
                }
                console.log("signatures",signatures);

             //let inspect = rollupContract.methods.withdraw(...Object.values(param)).toTransferParams();
             //console.log("inspect",inspect);    
             //console.log("parameter signature",rollupContract.parameterSchema.ExtractSignatures());
            
            
            const op = await rollupContract.methods.withdraw(...Object.values(param)).send();
            await op.confirmation();
            enqueueSnackbar("Your Withdraw has been accepted", {variant: "success", autoHideDuration:10000});
            await refreshRollup();
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
            <Paper title="Choose default rollup" sx={{padding : 1}} elevation={3}>
                <HoverBox onClick={()=>{setRollupType(ROLLUP_TYPE.DEKU);closeSelectRollupPopup();}}>{ROLLUP_TYPE.DEKU.name} : {ROLLUP_TYPE.DEKU.address}</HoverBox>
                <hr />
                <HoverBox onClick={()=>{setRollupType(ROLLUP_TYPE.TORU);closeSelectRollupPopup();}}>{ROLLUP_TYPE.TORU.name} : {ROLLUP_TYPE.TORU.address}</HoverBox>
            </Paper>
        </Popover>
        
        <Backdrop
        sx={{ color: '#fff', zIndex: (theme : any) => theme.zIndex.drawer + 1 }}
        open={tezosLoading}
        >
        <CircularProgress color="inherit" />
        </Backdrop>
        <Grid container spacing={2} >
        
          
        <Grid item xs={12} md={5} >
                <Card>
                <CardHeader 
                sx={{color:"secondary.main",backgroundColor:"primary.main"}}
                avatar={<Avatar aria-label="recipe"><CameraRoll /></Avatar>}
                action={
                    <IconButton aria-label="settings" onClick={(e)=>showSelectRollupPopup(e)}>
                    <ArrowDropDown />
                    </IconButton>
                }
                title={rollupType.name+" default rollup"}
                subheader={<div className="address"><span className="address1">{rollupType.address.substring(0,rollupType.address.length/2)}</span><span className="address2">{rollupType.address.substring(rollupType.address.length/2)}</span></div> }
                />
                <CardContent>
                <Stack spacing={1} direction="column"  divider={<Divider orientation="horizontal" flexItem />}>
                { 
                      rollup instanceof RollupTORU?
                    <TableContainer component={Paper}><Table><TableBody>
                        <TableRow><TableCell>commitment_newest_hash </TableCell><TableCell>{rollup.commitment_newest_hash}</TableCell></TableRow >
                        <TableRow><TableCell>finalized_commitments </TableCell><TableCell>{rollup.finalized_commitments.next}</TableCell></TableRow >
                        <TableRow><TableCell>last_removed_commitment_hashes </TableCell><TableCell>{rollup.last_removed_commitment_hashes}</TableCell></TableRow>
                        <TableRow><TableCell>inbox_ema</TableCell><TableCell>{rollup.inbox_ema}</TableCell></TableRow >
                        <TableRow><TableCell>tezos_head_level </TableCell><TableCell>{rollup.tezos_head_level}</TableCell></TableRow >
                        <TableRow><TableCell>allocated_storage </TableCell><TableCell>{rollup.allocated_storage}</TableCell></TableRow >
                        <TableRow><TableCell>uncommitted_inboxes </TableCell><TableCell>{rollup.uncommitted_inboxes.next}</TableCell></TableRow >
                        <TableRow><TableCell>unfinalized_commitments </TableCell><TableCell>{rollup.unfinalized_commitments.next}</TableCell></TableRow >
                        </TableBody></Table></TableContainer> 
                       : 
                       rollup instanceof RollupDEKU ? 
                        <Fragment>
                        <TableContainer component={Paper}><Table><TableBody>
                        <TableRow><TableCell>current_block_hash </TableCell><TableCell>{rollup.root_hash.current_block_hash}</TableCell></TableRow >
                        <TableRow><TableCell>current_block_height </TableCell><TableCell>{rollup.root_hash.current_block_height.toNumber()}</TableCell></TableRow >
                        <TableRow><TableCell>current_handles_hash </TableCell><TableCell>{rollup.root_hash.current_handles_hash}</TableCell></TableRow >
                        <TableRow><TableCell>current_state_hash </TableCell><TableCell>{rollup.root_hash.current_state_hash}</TableCell></TableRow >
                        <TableRow><TableCell>current_validators </TableCell><TableCell>{rollup.root_hash.current_validators.join(", ")}</TableCell></TableRow >
                       </TableBody></Table></TableContainer>
                       
                        <hr />
                        <h3>Vault</h3>

                        {rollup.vault.XTZTicket? 
                        <Chip
                            onClick={()=>{setTokenType(TOKEN_TYPE.XTZ);setQuantity(rollup.vault.XTZTicket?.amount.toNumber()!)}}
                            avatar={<Avatar src="XTZ-ticket.png"/>}
                            label={<span>{rollup.vault.XTZTicket?.amount.toNumber()}</span>}
                            variant="outlined" 
                            />
                        :""}
                       
                       {rollup.vault.CTEZTicket? 
                      <Chip 
                        onClick={()=>{setTokenType(TOKEN_TYPE.FA12);setQuantity(rollup.vault.CTEZTicket?.amount.toNumber()!)}}
                        avatar={<Avatar src="CTEZ-ticket.png"/>}
                        label={<span>{rollup.vault.CTEZTicket?.amount.toNumber()}</span>}
                        variant="outlined" 
                        />
                        :""}


                        </Fragment>
                    
                       : "No rollup info ..." }
                    </Stack>
                    </CardContent>
                    </Card>
        </Grid>
        

        <Grid item xs={12} md={4} >
        
        <Grid item xs={12} md={12} padding={1}>
        <TextField
        fullWidth
        
        value={l1Address}
        onChange={(e)=>setL1Address(e.target.value)}
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
        <TextField
        fullWidth
        
        value={proof}
        onChange={(e)=>setProof(e.target.value)}
        label="Proof"
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
                <Button variant="contained" onClick={(e)=>handleWithdraw(e)}>Withdraw</Button>
                </Grid>
         </Grid>
      

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
        sx={{justifyContent: "right"}}
        deleteIcon={<Avatar sx={{height:24,width:24}} src="XTZ.png" />}
        onDelete={()=>{}}
        label={userBalance}
        variant="outlined" 
        />
        <Chip 
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
        

        </Grid>
                    
                    </Box>
                    );
                };
                
                export default Withdraw;