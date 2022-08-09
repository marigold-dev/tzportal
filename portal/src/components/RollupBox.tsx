import { Accordion, AccordionDetails, AccordionSummary, Avatar, Badge, Box, Button, Card, CardContent, CardHeader, Chip, Divider, FormControl, Grid, IconButton, InputAdornment, InputLabel, keyframes, MenuItem, OutlinedInput, OutlinedInputProps, Paper, Popover, Select, SelectChangeEvent, Stack, styled, Table, TableBody, TableCell, TableContainer, TableRow, Tooltip, Typography } from "@mui/material";
import { RollupCHUSAI, RollupDEKU, RollupTORU, ROLLUP_TYPE, TezosUtils, TOKEN_TYPE } from "./TezosUtils";
import { AddShoppingCartOutlined, ArrowDropDown, CameraRoll, UnfoldMoreOutlined } from "@mui/icons-material";
import React, { Dispatch, forwardRef, Fragment, ReactComponentElement, Ref, SetStateAction, useEffect, useImperativeHandle, useState } from "react";
import { ContractFAStorage, ContractStorage } from "./TicketerContractUtils";
import { TezosToolkit } from "@taquito/taquito";
import DEKUClient from "./DEKUClient";
import BigNumber from 'bignumber.js';
import ReactCSSTransitionGroup, { CSSTransition } from 'react-transition-group'; // ES6


export type RollupBoxComponentType = {
    refreshRollup : () => Promise<void>,
    setShouldBounce : (b : boolean) => Promise<void>,
    setChangeTicketColor : (color : string) => Promise<void>
}

type RollupProps = {
    Tezos : TezosToolkit;
    userAddress: string;
    userBalance: Map<TOKEN_TYPE,number>;
    tokenBytes:Map<TOKEN_TYPE,string>;
    handlePendingWithdraw : ((event: React.MouseEvent<HTMLButtonElement, MouseEvent>, to: string, contractFAStorage: ContractFAStorage,ticketTokenType : string) => Promise<void>) | undefined;
    handlePendingDeposit : ((event : React.MouseEvent<HTMLButtonElement>,from : string,contractFAStorage : ContractFAStorage,ticketTokenType : string) => Promise<void>) | undefined;
    contractStorage : ContractStorage | undefined;
    setRollupType : Dispatch<SetStateAction<ROLLUP_TYPE>>;
    rollupType : ROLLUP_TYPE;
    rollup : RollupTORU | RollupDEKU | RollupCHUSAI | undefined;
    setRollup : Dispatch<SetStateAction<RollupTORU | RollupDEKU | RollupCHUSAI | undefined>>;
    direction : string;
    dekuClient : DEKUClient;
    tokenType : TOKEN_TYPE
};

const RollupBox = ({
    Tezos,
    userAddress,
    userBalance,
    tokenBytes,
    handlePendingWithdraw,
    handlePendingDeposit,
    contractStorage,
    setRollupType,
    rollupType,
    rollup,
    setRollup,
    direction,
    dekuClient,
    tokenType
}: RollupProps, ref : any): JSX.Element => {
    
    const layer2Tickets = React.createRef<any>();
    const [shouldBounce,setShouldBounce] = useState(true);
    const [changeTicketColor,setChangeTicketColor] = useState("#55606A");
    
    
    async function refreshRollup() {
        switch(rollupType){
            case ROLLUP_TYPE.TORU : setRollup(await TezosUtils.fetchRollupTORU(Tezos.rpc.getRpcUrl(),rollupType.address));break;
            case ROLLUP_TYPE.DEKU : setRollup(await TezosUtils.fetchRollupDEKU(Tezos,rollupType.address));break;
            case ROLLUP_TYPE.CHUSAI : {
                setRollup(await TezosUtils.fetchRollupCHUSAI(Tezos,rollupType.address));break;
            }
        }
    }
    
    
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
    
    useImperativeHandle(ref, () =>  ({refreshRollup , setShouldBounce, setChangeTicketColor }));

    const myKeyframe = keyframes`
    0 %  { transform: translate(1px, 1px)   rotate(0deg)    },
    10%  { transform: translate(-1px, -2px) rotate(-1deg);  },
    20%  { transform: translate(-3px, 0px)  rotate(1deg);   },
    30%  { transform: translate(3px, 2px)   rotate(0deg);   },
    40%  { transform: translate(1px, -1px)  rotate(1deg);   },
    50%  { transform: translate(-1px, 2px)  rotate(-1deg);  },
    60%  { transform: translate(-3px, 1px)  rotate(0deg);   },
    70%  { transform: translate(3px, 1px)   rotate(-1deg);  },
    80%  { transform: translate(-1px, -1px) rotate(1deg);   },
    90%  { transform: translate(1px, 2px)   rotate(0deg);   },
    100% { transform: translate(1px, -2px)  rotate(-1deg);  }
    `;
    return (
        
        <Grid bgcolor="var(--tertiary-color)" padding="1em" container spacing={1}>
        
        
        
        <Grid xs={12} sm={2} item >   
        <Stack margin={1} spacing={1}>
        <Typography fontWeight="bolder" color="secondary" variant="h6" sx={{backgroundColor:"primary.main"}} >{direction}</Typography>
        <Tooltip title={rollupType.address} >
        <img src="deku_white.png" width={80}/>
        </Tooltip>
        </Stack  >
        </Grid>
        
        <Grid xs={12} sm={10} item>
        
        {direction === "To"?<div style={{height:"70px"}}>  </div>:""}
        
        
        <Stack direction={"column"} spacing={1} >
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
            
            
            <OutlinedInput 
            ref={layer2Tickets}
            sx={
                shouldBounce ? {animation : `${myKeyframe} 1s ease`,
                backgroundColor : changeTicketColor
            } : {animation : "" ,
        backgroundColor : "#55606A"}
               }
            fullWidth
            inputProps={{
                style : {
                    textAlign : "right",
                    display: 'inline',
                    width:"70%",
                }
            }}
            endAdornment={<InputAdornment position="end" >
            <img height="24px" src={tokenType+".png"}/>
            <img height="24px" src={"ticket.png"}/>                
            </InputAdornment>}
            startAdornment="Available balance"
            value=
            
            {userBalance.get(TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE])
                +" " + tokenType + "-ticket" 
            } />
            
            
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
                
                {handlePendingWithdraw && contractStorage.faPendingWithdrawals?  Array.from(contractStorage.faPendingWithdrawals.entries()).map(( [key,val]: [[string,string],ContractFAStorage]) => 
                    {
                        let tokenType : string = tokenBytes.get(TOKEN_TYPE.XTZ) == key[1]? TOKEN_TYPE.XTZ : tokenBytes.get(TOKEN_TYPE.CTEZ) == key[1] ?  TOKEN_TYPE.CTEZ : tokenBytes.get(TOKEN_TYPE.KUSD) == key[1] ?  TOKEN_TYPE.KUSD : tokenBytes.get(TOKEN_TYPE.UUSD) == key[1] ?  TOKEN_TYPE.UUSD : TOKEN_TYPE.EURL ;
                        
                        return <div key={key[0]+key[1]+val.type}>  
                        <Badge  max={999999999999999999}
                        badgeContent={val.amountToTransfer.toNumber()}         
                        color="primary">
                        <Avatar component="span" src={tokenType+".png"} />
                        <Avatar variant="square" src="ticket.png" />
                        </Badge>
                        <span> for {<span className="address"><span className="address1">{key[0].substring(0,key[0].length/2)}</span><span className="address2">{key[0].substring(key[0].length/2)}</span></span>} </span>
                        <Tooltip title="Redeem collaterized user's tokens from tickets' rollup">
                        <Button onClick={(e)=>handlePendingWithdraw(e,key[0],val,tokenType)} startIcon={<AddShoppingCartOutlined/>}></Button>
                        </Tooltip>
                        </div>
                    }
                    ):""}
                    
                    
                    {handlePendingDeposit && contractStorage.faPendingDeposits ?Array.from(contractStorage.faPendingDeposits.entries()).map(( [key,val]: [[string,string],ContractFAStorage]) => 
                        {let l2Address : string = val.l2Type.l2_DEKU?val.l2Type.l2_DEKU : val.l2Type.l2_TORU;
                            let tokenType : string = tokenBytes.get(TOKEN_TYPE.XTZ) == key[1]? TOKEN_TYPE.XTZ : tokenBytes.get(TOKEN_TYPE.CTEZ) == key[1] ?  TOKEN_TYPE.CTEZ : tokenBytes.get(TOKEN_TYPE.KUSD) == key[1] ?  TOKEN_TYPE.KUSD : tokenBytes.get(TOKEN_TYPE.UUSD) == key[1] ?  TOKEN_TYPE.UUSD : TOKEN_TYPE.EURL ;
                            
                            return <div key={key[0]+key[1]+val.type}>   
                            
                            <Badge  max={999999999999999999}
                            badgeContent={val.amountToTransfer.toNumber()}         
                            color="primary">
                            <Avatar component="span" src={tokenType+".png"} />
                            <Avatar variant="square" src="ticket.png" />
                            </Badge>
                            <span> for {<span className="address"><span className="address1">{l2Address.substring(0,l2Address.length/2)}</span><span className="address2">{l2Address.substring(l2Address.length/2)}</span></span>} </span>
                            
                            
                            <Tooltip title="Collaterize user's tokens and swap to real tickets for rollup">
                            <Button onClick={(e)=>handlePendingDeposit(e,key[0],val,tokenType)} startIcon={<AddShoppingCartOutlined/>}></Button>
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
                    >
                    
                    <MenuItem key={TOKEN_TYPE.XTZ} value={TOKEN_TYPE.XTZ}>
                    <Badge max={999999999999999999}
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
                    </Grid>
                    
                    
                    </Grid>
                    
                    
                    
                    );
                };
                
                export default forwardRef(RollupBox);