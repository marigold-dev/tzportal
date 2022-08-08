import { Avatar, Card, CardContent, CardHeader, Chip, Divider, Grid, Input, InputAdornment, MenuItem, OutlinedInput, Paper, Select, SelectChangeEvent, Stack, TextField, Typography } from "@mui/material";
import { LAYER2Type, TOKEN_TYPE } from "./TezosUtils";
import BigNumber from 'bignumber.js';
import { AccountInfo } from "@airgap/beacon-types";
import { Dispatch, Fragment, SetStateAction } from "react";
import { Badge, InputOutlined } from "@mui/icons-material";

type ButtonProps = {
    direction : string;
    userAddress: string;
    userBalance : Map<TOKEN_TYPE,BigNumber>;
    activeAccount : AccountInfo;
    quantity : number;
    setQuantity :Dispatch<SetStateAction<number>>;
    tokenType : string;
    setTokenType : Dispatch<SetStateAction<string>>;
};

const UserWallet = ({
    direction,
    userAddress,
    userBalance,
    activeAccount,
    quantity,
    setQuantity,
    tokenType,
    setTokenType
}: ButtonProps): JSX.Element => {
    
    return (
        
        <Grid bgcolor="var(--tertiary-color)" padding="1em" container spacing={1}>
        
        <Grid xs={12} sm={2} item >   
        <Stack margin={1} spacing={1}>
        <Typography fontWeight="bolder" color="secondary" variant="h6" sx={{backgroundColor:"primary.main"}} >{direction}</Typography>
        <img src="XTZ_white.png" width={80}/>
        </Stack  >
        </Grid>
        
        <Grid xs={12} sm={10} item>

            <Stack direction={"column"} spacing={1} >
        
        <OutlinedInput 
        fullWidth
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
        
        {activeAccount && activeAccount.address === userAddress && activeAccount.accountIdentifier!==LAYER2Type.L2_DEKU?
            
            <Fragment>

            <Input
            fullWidth 
            required 
            type="number"
            onChange={(e)=>setQuantity(e.target.value?parseFloat(e.target.value):0)}
            value={quantity}
            title="Enter amount"
            endAdornment={
                <Fragment>
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
                    <div style={{height:"50px"}}>  </div></Fragment>
                
                    
                    :""}
                    </Stack>
                    </Grid>
                    
                    </Grid>
                    
                    );
                };
                
                export default UserWallet;