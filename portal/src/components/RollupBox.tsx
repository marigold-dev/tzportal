import { Accordion, AccordionDetails, AccordionSummary, Avatar, Badge, Box, Button, Card, CardContent, CardHeader, Chip, Divider, FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Popover, Select, SelectChangeEvent, Stack, styled, Table, TableBody, TableCell, TableContainer, TableRow, Tooltip, Typography } from "@mui/material";
import AccountBalanceWallet from "@mui/icons-material/AccountBalanceWallet";
import { RollupCHUSAI, RollupDEKU, RollupTORU, ROLLUP_TYPE, TezosUtils, TOKEN_TYPE } from "./TezosUtils";
import { AddShoppingCartOutlined, ArrowDropDown, CameraRoll, UnfoldMoreOutlined } from "@mui/icons-material";
import React, { forwardRef, Fragment, Ref, useEffect, useImperativeHandle, useState } from "react";
import { ContractFA12Storage, ContractStorage } from "./TicketerContractUtils";
import { TezosToolkit } from "@taquito/taquito";

export type RollupBoxComponentType = {
    refreshRollup : () => Promise<void>,
}

type RollupProps = {
    Tezos : TezosToolkit;
    userAddress: string;
    tokenBytes:Map<TOKEN_TYPE,string>;
    handlePendingWithdraw : ((event: React.MouseEvent<HTMLButtonElement, MouseEvent>, to: string, contractFA12Storage: ContractFA12Storage) => Promise<void>) | undefined;
    handlePendingDeposit : ((event : React.MouseEvent<HTMLButtonElement>,from : string,contractFA12Storage : ContractFA12Storage) => Promise<void>) | undefined;
    contractStorage : ContractStorage | undefined;
};

const RollupBox = ({
    Tezos,
    userAddress,
    tokenBytes,
    handlePendingWithdraw,
    handlePendingDeposit,
    contractStorage
}: RollupProps, ref : any): JSX.Element => {
    
    
    const [rollupType , setRollupType] = useState<ROLLUP_TYPE>(ROLLUP_TYPE.DEKU);
    const [rollup , setRollup] = useState<RollupTORU | RollupDEKU | RollupCHUSAI>();
    const [tokenType, setTokenType]  = useState<string>(TOKEN_TYPE.XTZ);
    
    async function refreshRollup() {
        switch(rollupType){
            case ROLLUP_TYPE.TORU : setRollup(await TezosUtils.fetchRollupTORU(Tezos.rpc.getRpcUrl(),rollupType.address));break;
            case ROLLUP_TYPE.DEKU : {
                setRollup(await TezosUtils.fetchRollupDEKU(Tezos,rollupType.address));break;}
                case ROLLUP_TYPE.CHUSAI : {
                    setRollup(await TezosUtils.fetchRollupCHUSAI(Tezos,rollupType.address));break;
                }
            }
        }
        
        
        
        useEffect( () => { (async () => {
            refreshRollup();
        })();}, []);
        
        
        useEffect(() => {
            refreshRollup();
        }, [rollupType]);
        
        //POPUP
        const [selectRollupPopupAnchorEl, setSelectRollupPopupAnchorEl] = React.useState<null | HTMLElement>(null);
        const showSelectRollupPopup = (event : React.MouseEvent<HTMLButtonElement>) => {
            setSelectRollupPopupAnchorEl(event.currentTarget);
        };
        const closeSelectRollupPopup = () => {
            setSelectRollupPopupAnchorEl(null);
        };
        const selectRollupPopupOpen = Boolean(selectRollupPopupAnchorEl);
        
        //just needed for the selectRollupPopup selection
        const HoverBox = styled(Box)`&:hover {background-color: #a9a9a9;}`;
        
        const SmallAvatar = styled(Avatar)(({ theme }) => ({
            width: 22,
            height: 22,
            border: `2px solid ${theme.palette.background.paper}`,
        }));
        
        useImperativeHandle(ref, () =>  ({refreshRollup}));
        
        return (
            <Fragment>
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
            <HoverBox onClick={()=>{setRollupType(ROLLUP_TYPE.CHUSAI);closeSelectRollupPopup();}}>{ROLLUP_TYPE.CHUSAI.name} : {ROLLUP_TYPE.CHUSAI.address}</HoverBox>
            </Paper>
            </Popover>
            
            
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
            title={rollupType.name}
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
                
                <Accordion>
                <AccordionSummary
                expandIcon={<UnfoldMoreOutlined />}
                aria-controls="panel1a-content"
                id="panel1a-header"
                >
                <Typography>Rollup Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                <TableContainer component={Paper}><Table><TableBody>
                <TableRow><TableCell>current_block_hash </TableCell><TableCell>{rollup.root_hash.current_block_hash}</TableCell></TableRow >
                <TableRow><TableCell>current_block_height </TableCell><TableCell>{rollup.root_hash.current_block_height.toNumber()}</TableCell></TableRow >
                <TableRow><TableCell>current_handles_hash </TableCell><TableCell>{rollup.root_hash.current_handles_hash}</TableCell></TableRow >
                <TableRow><TableCell>current_state_hash </TableCell><TableCell>{rollup.root_hash.current_state_hash}</TableCell></TableRow >
                <TableRow><TableCell>current_validators </TableCell><TableCell>{rollup.root_hash.current_validators.join(", ")}</TableCell></TableRow >
                </TableBody></Table></TableContainer>
                </AccordionDetails>
                </Accordion>
                
                
                
                <Accordion defaultExpanded>
                <AccordionSummary
                expandIcon={<UnfoldMoreOutlined />}
                aria-controls="panel1a-content"
                id="panel1a-header"
                >
                <Typography>Vault</Typography>
                </AccordionSummary>
                <AccordionDetails >
                
                <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">Select ticket</InputLabel>
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
                    <Badge 
                    badgeContent={rollup.vault.ticketMap.get(key)?.amount.toNumber()}          
                    
                    color="primary">
                    <Avatar component="span" src={key+".png"}></Avatar>
                    <Avatar variant="square" src="ticket.png" />
                    </Badge>
                    </MenuItem>
                    ) }
                    
                    </Select>
                    
                    </FormControl>
                    
                    
                    
                    
                    
                    </AccordionDetails>
                    </Accordion>
                    
                    
                    
                    
                    {contractStorage?.treasuryAddress == userAddress?
                        
                        
                        <Accordion>
                        <AccordionSummary
                        expandIcon={<UnfoldMoreOutlined />}
                        aria-controls="panel1a-content"
                        id="panel1a-header"
                        >
                        <Typography>Pending operations</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                        
                        {handlePendingWithdraw?  Array.from(contractStorage.fa12PendingWithdrawals.entries()).map(( [key,val]: [[string,string],ContractFA12Storage]) => 
                            {let l2Address : string = val.l2Type.l2_DEKU?val.l2Type.l2_DEKU : val.l2Type.l2_TORU;
                                return <div key={key[0]+key[1]+val.type}>  
                                <Badge 
                                badgeContent={val.amountToTransfer.toNumber()}         
                                color="primary">
                                <Avatar component="span" src={tokenBytes.get(TOKEN_TYPE.XTZ) == key[1]? TOKEN_TYPE.XTZ+".png" : tokenBytes.get(TOKEN_TYPE.CTEZ) == key[1] ?  TOKEN_TYPE.CTEZ+".png" :   TOKEN_TYPE.KUSD+".png" } />
                                <Avatar variant="square" src="ticket.png" />
                                </Badge>
                                <span> for {<span className="address"><span className="address1">{key[0].substring(0,key[0].length/2)}</span><span className="address2">{key[0].substring(key[0].length/2)}</span></span>} </span>
                                <Tooltip title="Redeem collaterized user's tokens from tickets' rollup">
                                <Button onClick={(e)=>handlePendingWithdraw(e,key[0],val)} startIcon={<AddShoppingCartOutlined/>}></Button>
                                </Tooltip>
                                </div>
                            }
                            ):""}
                            
                            
                            {handlePendingDeposit?Array.from(contractStorage.fa12PendingDeposits.entries()).map(( [key,val]: [[string,string],ContractFA12Storage]) => 
                                {let l2Address : string = val.l2Type.l2_DEKU?val.l2Type.l2_DEKU : val.l2Type.l2_TORU;
                                    
                                    return <div key={key[0]+key[1]+val.type}>   
                                    
                                    <Badge 
                                    badgeContent={val.amountToTransfer.toNumber()}         
                                    color="primary">
                                    <Avatar component="span" src={tokenBytes.get(TOKEN_TYPE.XTZ) == key[1]? TOKEN_TYPE.XTZ+".png" : tokenBytes.get(TOKEN_TYPE.CTEZ) == key[1] ?  TOKEN_TYPE.CTEZ+".png" :   TOKEN_TYPE.KUSD+".png" } />
                                    <Avatar variant="square" src="ticket.png" />
                                    </Badge>
                                    <span> for {<span className="address"><span className="address1">{l2Address.substring(0,key[0].length/2)}</span><span className="address2">{l2Address.substring(l2Address.length/2)}</span></span>} </span>
                                    
                                    
                                    <Tooltip title="Collaterize user's tokens and swap to real tickets for rollup">
                                    <Button onClick={(e)=>handlePendingDeposit(e,key[0],val)} startIcon={<AddShoppingCartOutlined/>}></Button>
                                    </Tooltip>
                                    </div>
                                }
                                ):""}
                                
                                
                                
                                </AccordionDetails>
                                </Accordion>
                                
                                
                                
                                
                                
                                
                                
                                :""
                            }
                            
                            
                            
                            
                            </Fragment>
                            
                            : rollup instanceof RollupCHUSAI ? 
                            <Fragment>
                                <Accordion>
                <AccordionSummary
                expandIcon={<UnfoldMoreOutlined />}
                aria-controls="panel1a-content"
                id="panel1a-header"
                >
                <Typography>Rollup Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                            <TableContainer component={Paper}><Table><TableBody>
                            <TableRow><TableCell>rollup_level </TableCell><TableCell>{rollup.rollup_level.toNumber()}</TableCell></TableRow >
                            <TableRow><TableCell>messages </TableCell><TableCell>{rollup.messages.toJSON()}</TableCell></TableRow >
                            <TableRow><TableCell>fixed_ticket_key.mint_address </TableCell><TableCell>{rollup.fixed_ticket_key.mint_address}</TableCell></TableRow>
                            <TableRow><TableCell>fixed_ticket_key.payload</TableCell><TableCell>{rollup.fixed_ticket_key.payload}</TableCell></TableRow >
                            </TableBody></Table></TableContainer> 
                            
                            </AccordionDetails>
                </Accordion>
                
                
                
                <Accordion defaultExpanded>
                <AccordionSummary
                expandIcon={<UnfoldMoreOutlined />}
                aria-controls="panel1a-content"
                id="panel1a-header"
                >
                <Typography>Vault</Typography>
                </AccordionSummary>
                <AccordionDetails >
                
                <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">Select ticket</InputLabel>
                <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                defaultValue={TOKEN_TYPE.XTZ}
                value={tokenType}
                label="token type"
                onChange={(e : SelectChangeEvent)=>{setTokenType(e.target.value)}}
                >
                
                    <MenuItem key={TOKEN_TYPE.XTZ} value={TOKEN_TYPE.XTZ}>
                    <Badge 
                    badgeContent={rollup.ticket?.amount.toNumber()}          
                    
                    color="primary">
                    <Avatar component="span" src={TOKEN_TYPE.XTZ+".png"}></Avatar>
                    <Avatar variant="square" src="ticket.png" />
                    </Badge>
                    </MenuItem>
                   
                    
                    </Select>
                    
                    </FormControl>
                    
                    
                    
                    
                    
                    </AccordionDetails>
                    </Accordion>
                                
                                </Fragment>
                                
                                
                                : "No rollup info ..." }
                                </Stack>
                                </CardContent>
                                </Card>
                                
                                </Grid>
                                
                                </Fragment>
                                
                                );
                            };
                            
                            export default forwardRef(RollupBox);