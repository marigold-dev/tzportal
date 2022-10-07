import { DekuToolkit } from "@marigold-dev/deku-toolkit";
import { UnfoldMoreOutlined } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Avatar, Badge, Box, Chip, FormControl, Grid, Input, InputAdornment, InputLabel, keyframes, MenuItem, OutlinedInput, Paper, Select, SelectChangeEvent, Skeleton, Stack, styled, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { TezosToolkit } from "@taquito/taquito";
import BigNumber from 'bignumber.js';
import React, { Dispatch, forwardRef, Fragment, SetStateAction, useImperativeHandle, useState } from "react";
import { RollupCHUSAI, RollupDEKU, RollupTORU, ROLLUP_TYPE, TOKEN_TYPE } from "./TezosUtils";
import { ContractFAStorage } from "./TicketerContractUtils";

BigNumber.config({ EXPONENTIAL_AT: 19 });


export type RollupBoxComponentType = {
    setShouldBounce: (b: boolean) => Promise<void>,
    setChangeTicketColor: (color: string) => Promise<void>
}

type RollupProps = {
    Tezos: TezosToolkit;
    userAddress: string;
    setUserAddress: Dispatch<SetStateAction<string>> | undefined;
    userBalance: Map<TOKEN_TYPE, BigNumber>;
    tokenBytes: Map<TOKEN_TYPE, string>;
    handlePendingWithdraw: ((event: React.MouseEvent<HTMLButtonElement, MouseEvent>, to: string, contractFAStorage: ContractFAStorage, ticketTokenType: string) => Promise<void>) | undefined;
    handlePendingDeposit: ((event: React.MouseEvent<HTMLButtonElement>, from: string, contractFAStorage: ContractFAStorage, ticketTokenType: string) => Promise<void>) | undefined;
    handleL2Transfer: ((event: React.MouseEvent<HTMLButtonElement>) => Promise<void>) | undefined;
    rollupType: ROLLUP_TYPE;
    rollup: RollupTORU | RollupDEKU | RollupCHUSAI | undefined;
    isDirectionDeposit: boolean;
    dekuClient: DekuToolkit;
    tokenType: TOKEN_TYPE;
    quantity: BigNumber;
    setQuantity: Dispatch<SetStateAction<BigNumber>>;
    setTokenType: Dispatch<SetStateAction<string>>;
    rollupmap: Map<ROLLUP_TYPE, string>;
};

const RollupBox = ({
    Tezos,
    userAddress,
    setUserAddress,
    userBalance,
    tokenBytes,
    handlePendingWithdraw,
    handlePendingDeposit,
    handleL2Transfer,
    rollupType,
    rollup,
    isDirectionDeposit,
    dekuClient,
    tokenType,
    quantity,
    setQuantity,
    setTokenType,
    rollupmap
}: RollupProps, ref: any): JSX.Element => {

    const layer2Tickets = React.createRef<any>();
    const [shouldBounce, setShouldBounce] = useState(true);
    const [changeTicketColor, setChangeTicketColor] = useState("#55606A");

    //POPUP
    const [selectRollupPopupAnchorEl, setSelectRollupPopupAnchorEl] = React.useState<null | HTMLElement>(null);
    const showSelectRollupPopup = (event: React.MouseEvent<HTMLButtonElement>) => {
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

    useImperativeHandle(ref, () => ({ setShouldBounce, setChangeTicketColor }));

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

    const isDesktop = useMediaQuery('(min-width:600px)');

    return (

        <Grid bgcolor="var(--tertiary-color)" padding="1em" container spacing={1}>



            <Grid xs={12} sm={2} item >
                <Stack margin={1} spacing={1}>
                    {isDesktop ? (<><Typography fontWeight="bolder" color="secondary" variant="h6" sx={{ backgroundColor: "primary.main" }}>{isDirectionDeposit ? "To" : "From"}</Typography><Tooltip title={rollupmap.get(rollupType)}>
                        <img src="deku_white.png" width={80} />
                    </Tooltip></>) : (<div style={{ display: "flex", flexDirection: "row" }}><Tooltip title={rollupmap.get(rollupType)}>
                        <img src="deku_white.png" width={30} style={{ padding: "10px" }} />
                    </Tooltip><Typography lineHeight={2} fontWeight="bolder" color="secondary" variant="h6" sx={{ backgroundColor: "primary.main", width: "-webkit-fill-available" }}>{isDirectionDeposit ? "To" : "From"}</Typography></div>)}

                </Stack  >
            </Grid>

            <Grid xs={12} sm={10} item>


                {isDirectionDeposit && !handleL2Transfer ? <div style={isDesktop ? { height: "70px" } : { height: "0" }}></div>
                    : isDirectionDeposit && handleL2Transfer ?
                        <TextField
                            sx={{ paddingBottom: "1em" }}
                            fullWidth
                            value={userAddress}
                            placeholder="Enter your L2 destination address here"
                            onChange={(e) => setUserAddress!(e.target.value ? e.target.value.trim() : "")} />
                        : ""}


                <Stack direction={"column"} spacing={1} style={isDesktop ? { textAlign: "initial" } : { textAlign: "center" }} >
                    {
                        rollup instanceof RollupTORU ?
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
                                            shouldBounce ? {
                                                animation: `${myKeyframe} 1s ease`,
                                                backgroundColor: changeTicketColor
                                            } : {
                                                animation: "",
                                                backgroundColor: "#55606A"
                                            }
                                        }
                                        fullWidth
                                        inputProps={{
                                            style: {
                                                textAlign: "right",
                                                display: 'inline',
                                                width: "70%",
                                            }
                                        }}
                                        endAdornment={((userBalance.get(TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE])?.toString() + " " + tokenType) === 'undefined XTZ') ? (<Typography variant="h1">{<Skeleton style={{ background: "#d6d6d6", width: "100px", height: "20px" }} />}</Typography>
                                        ) : (<InputAdornment position="end" >
                                            <img height="24px" src={tokenType + ".png"} />
                                            <img height="24px" src={"ticket.png"} />
                                        </InputAdornment>)}
                                        startAdornment="Available balance"
                                        value=
                                        {(userBalance.get(TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE])?.toString()
                                            + " " + tokenType + "-ticket") === 'undefined XTZ-ticket' ? ("") : ((userBalance.get(TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE])?.toString()
                                                + " " + tokenType + "-ticket"))
                                        } />

                                    {!isDirectionDeposit ?
                                        <Fragment>

                                            <Input

                                                fullWidth
                                                required
                                                type="number"
                                                onChange={(e) => setQuantity(e.target.value ? new BigNumber(e.target.value) : new BigNumber(0))}
                                                value={quantity}
                                                title="Enter amount"
                                                endAdornment={
                                                    <Fragment>

                                                        <span style={{ color: "var(--tertiary-color)" }} onClick={() => setQuantity(userBalance.get(TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE])!)}>MAX</span>

                                                        <Select
                                                            variant="standard"
                                                            defaultValue={TOKEN_TYPE.XTZ}
                                                            value={tokenType}
                                                            label="ticket-token type"
                                                            sx={{ paddingRight: 0 }}
                                                            onChange={(e: SelectChangeEvent) => { setTokenType(e.target.value) }}
                                                        >
                                                            {Object.keys(TOKEN_TYPE).map((key) =>
                                                                <MenuItem key={key} value={key}>
                                                                    <Chip sx={{ border: "none" }} variant="outlined"
                                                                        avatar={<Fragment><img height="24px" src={key + ".png"} />
                                                                            <img height="24px" src={"ticket.png"} /> </Fragment>}
                                                                        label={key}
                                                                    />
                                                                </MenuItem>
                                                            )}</Select>

                                                    </Fragment>}
                                            />
                                        </Fragment>
                                        : ""
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
                                                                <Avatar component="span" src={TOKEN_TYPE.XTZ + ".png"}></Avatar>
                                                                <Avatar variant="square" src="ticket.png" />
                                                            </Badge>
                                                        </MenuItem>


                                                    </Select>

                                                </FormControl>

                                            </AccordionDetails>
                                        </Accordion>

                                    </Fragment>


                                    : "No rollup info ..."}
                </Stack>

                {!isDirectionDeposit ? <div style={{ height: "70px" }}></div>
                    : ""}


            </Grid>


        </Grid>



    );
};

export default forwardRef(RollupBox);