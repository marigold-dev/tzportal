import { Avatar, Card, CardContent, CardHeader, Chip, Divider, Grid, MenuItem, Paper, Select, SelectChangeEvent, Stack, TextField } from "@mui/material";
import { LAYER2Type, TOKEN_TYPE } from "./TezosUtils";
import BigNumber from 'bignumber.js';
import { AccountInfo } from "@airgap/beacon-types";
import { Dispatch, Fragment, SetStateAction } from "react";
import { Badge } from "@mui/icons-material";

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
        
        <Grid bgcolor="var(--tertiary-color)"  item xs={12} md={3}>
            
        <Card>
        <CardHeader
        sx={{color:"secondary.main",backgroundColor:"primary.main"}}
        avatar={<Avatar aria-label="recipe" src="XTZ.png"/>}
        title={direction+" Tezos"}
        />
        <CardContent>
        
        <div> Balance : {userBalance.get(TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE])?.toString()}</div>
        
        {activeAccount && activeAccount.address === userAddress && activeAccount.accountIdentifier!==LAYER2Type.L2_DEKU?
            <Paper
            component="form"
            sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 400 }}
            >
            <TextField fullWidth 
            required 
            type="number"
            onChange={(e)=>setQuantity(e.target.value?parseFloat(e.target.value):0)}
            value={quantity}
            label="Enter amount"
            inputProps={{style: { textAlign: 'right' }}} 
            variant="filled"
            />
            
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
                <Chip sx={{border:"none"}}
                avatar={<Avatar component="span" src={key+".png"} ></Avatar>}
                label={key}
                />
                </MenuItem>
                ) }
                
                
                </Select>
                </Paper>
                :""}
                </CardContent>
                </Card>
                </Grid>
                
                );
            };
            
            export default UserWallet;