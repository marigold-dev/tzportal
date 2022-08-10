import { Avatar, Card, CardContent, CardHeader, Chip, Divider, Grid, Input, InputAdornment, keyframes, MenuItem, OutlinedInput, Paper, Select, SelectChangeEvent, Stack, TextField, Typography } from "@mui/material";
import { LAYER2Type, TOKEN_TYPE } from "./TezosUtils";
import BigNumber from 'bignumber.js';
import { AccountInfo } from "@airgap/beacon-types";
import React, { Dispatch, forwardRef, Fragment, SetStateAction, useImperativeHandle } from "react";
import { Badge, InputOutlined } from "@mui/icons-material";
import { useState } from "react";

BigNumber.config({ EXPONENTIAL_AT : 19});


export type UserWalletComponentType = {
    setShouldBounce : (b : boolean) => Promise<void>,
    setChangeTicketColor : (color : string) => Promise<void>
}

type ButtonProps = {
    isDirectionDeposit : boolean;
    userAddress: string;
    userBalance : Map<TOKEN_TYPE,BigNumber>;
    activeAccount : AccountInfo;
    quantity : BigNumber;
    setQuantity :Dispatch<SetStateAction<BigNumber>>;
    tokenType : string;
    setTokenType : Dispatch<SetStateAction<string>>;
};

const UserWallet = ({
    isDirectionDeposit,
    userAddress,
    userBalance,
    activeAccount,
    quantity,
    setQuantity,
    tokenType,
    setTokenType
}: ButtonProps, ref : any): JSX.Element => {
    
    const layer1 = React.createRef<any>();
    const [shouldBounce,setShouldBounce] = useState(true);
    const [changeTicketColor,setChangeTicketColor] = useState("#55606A");

    useImperativeHandle(ref, () =>  ({setShouldBounce, setChangeTicketColor }));

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
        <Typography fontWeight="bolder" color="secondary" variant="h6" sx={{backgroundColor:"primary.main"}} >{isDirectionDeposit?"From":"To"}</Typography>
        <img src="XTZ_white.png" width={80}/>
        </Stack  >
        </Grid>
        
        <Grid xs={12} sm={10} item>

            <Stack direction={"column"} spacing={1} >
        
        <OutlinedInput 
        fullWidth
        ref={layer1}
            sx={
                shouldBounce ? {animation : `${myKeyframe} 1s ease`,
                backgroundColor : changeTicketColor
            } : {animation : "" ,
        backgroundColor : "#55606A"}
               }
        inputProps={{
            style : {
                textAlign : "right",
                display: 'inline',
                width:"70%"
            }
        }}
        endAdornment={<InputAdornment position="end" ><img height="24px" src={tokenType+".png"}/></InputAdornment>}
        startAdornment="Available balance"
        value={userBalance.get(TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE])?.toString() + " " + tokenType} />
        
        {isDirectionDeposit?
            <Fragment>

            <Input
            
            fullWidth 
            required 
            type="number"
            onChange={(e)=>setQuantity(e.target.value?new BigNumber(e.target.value):new BigNumber(0))}
            value={quantity}
            title="Enter amount"
            endAdornment={
                <Fragment>

                <span style={{color:"var(--tertiary-color)"}} onClick={()=>setQuantity(userBalance.get(TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE])!)}>MAX</span>

                <Select 
                variant="standard"
                defaultValue={TOKEN_TYPE.XTZ}
                value={tokenType}
                label="token type"
                sx={{paddingRight: 0}}
                onChange={(e : SelectChangeEvent)=>{setTokenType(e.target.value)}}
                >
                { Object.keys(TOKEN_TYPE).map((key)  => 
                    <MenuItem key={key} value={key}>
                    <Chip sx={{border:"none"}} variant="outlined"
                    avatar={<Avatar component="span" src={key+".png"} ></Avatar>}
                    label={key}
                    />
                    </MenuItem>
                    ) }</Select>
                    </Fragment>}
                    />
                    <div style={{height:"70px"}}>  </div>
                    </Fragment>
                
                    
                    :""}
                    </Stack>
                    </Grid>
                    
                    </Grid>
                    
                    );
                };
                
                export default forwardRef(UserWallet);