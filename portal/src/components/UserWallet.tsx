import { Avatar, Card, CardContent, CardHeader, Chip, Divider, Grid, Stack } from "@mui/material";
import AccountBalanceWallet from "@mui/icons-material/AccountBalanceWallet";
import { TOKEN_TYPE } from "./TezosUtils";
import BigNumber from 'bignumber.js';

type ButtonProps = {
    userAddress: string;
    userBalance : Map<TOKEN_TYPE,BigNumber>;
};

const UserWallet = ({
    userAddress,
    userBalance
}: ButtonProps): JSX.Element => {

    return (
              
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
        
        {Object.values(TOKEN_TYPE).map((value)=>
            <Chip 
            key={value}
            sx={{justifyContent: "right"}}
            deleteIcon={<Avatar sx={{height:24,width:24}} src={value+".png"} />}
            onDelete={()=>{}}
            label={userBalance.get(value)?.toString()}
            variant="outlined" 
            />
            
            )
        }
        
        
        
        </Stack>
        </CardContent>
        </Card>
        </Grid>
        
    );
};

export default UserWallet;