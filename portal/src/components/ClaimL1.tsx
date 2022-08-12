import { Backdrop, CircularProgress, Grid, InputAdornment, keyframes, OutlinedInput, Stack, TextField } from "@mui/material";
import Button from "@mui/material/Button";
import { BigMapAbstraction, compose, Contract, TezosToolkit } from "@taquito/taquito";
import { tzip12 } from "@taquito/tzip12";
import { tzip16 } from "@taquito/tzip16";
import BigNumber from 'bignumber.js';
import { useSnackbar } from "notistack";
import { MouseEvent, useEffect, useRef, useState } from "react";
import DEKUClient, { DEKUWithdrawProof } from "./DEKUClient";
import { FA12Contract } from "./fa12Contract";
import { FA2Contract } from "./fa2Contract";
import { RollupParameters, RollupParametersDEKU, RollupParametersTORU } from "./RollupParameters";
import { getBytes, ROLLUP_TYPE, TOKEN_TYPE } from "./TezosUtils";
import { TransactionInvalidBeaconError } from "./TransactionInvalidBeaconError";



type ClaimL1Props = {
    TezosL2 : TezosToolkit;
    rollupType : ROLLUP_TYPE;
    userAddress : string;
};

const ClaimL1 = ({
    TezosL2,
    rollupType,
    userAddress
}: ClaimL1Props): JSX.Element => {
    
    const [shouldBounce,setShouldBounce] = useState(true);
    const [changeTicketColor,setChangeTicketColor] = useState("#55606A");
    
    const [userBalance, setUserBalance] = useState<Map<TOKEN_TYPE,BigNumber>>(new Map());
    
    let oldBalance = useRef<BigNumber>();
    const [tokenType, setTokenType]  = useState<string>(TOKEN_TYPE.XTZ);
    const tokenTypeRef = useRef(tokenType); //TRICK : to track current value on async timeout functions
    tokenTypeRef.current = tokenType;
    useEffect(() => { 
        if(oldBalance)oldBalance!.current = userBalance.get(TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE])!;
    }, [tokenType]); //required to refresh to current when changing token type
    
    // MESSAGES
    const { enqueueSnackbar } = useSnackbar();
    
    //TEZOS OPERATIONS
    const [tezosLoading, setTezosLoading]  = useState(false);
    
    
    const [opHash,setOpHash] = useState<string>("");
    
    const handleL1Withdraw = async (event : MouseEvent<HTMLButtonElement>) => {
        
        event.preventDefault();
        setTezosLoading(true);
        const dekuClient = new DEKUClient(process.env["REACT_APP_DEKU_NODE"]!,process.env["REACT_APP_CONTRACT"]!,TezosL2);
        
        try {
            const withdrawProof : DEKUWithdrawProof = await dekuClient.getWithdrawProof(opHash);
            await handleWithdraw(withdrawProof); 
            
            enqueueSnackbar("Your L1 Claim has been accepted", {variant: "success", autoHideDuration:10000});
            
        } catch (error : any) {
            console.table(`Error: ${JSON.stringify(error, null, 2)}`);
            let tibe : TransactionInvalidBeaconError = new TransactionInvalidBeaconError(error);
            enqueueSnackbar("Maybe it is too early to claim, wait next block and retry. Error : "+tibe.data_message, { variant:"error" , autoHideDuration:10000});
            
        } finally {
            setTezosLoading(false);
        }
        
        setTezosLoading(false);
    };
    
    const refreshBalance = async() => {
        
        //Note : tokenTypeRef.current is this ref instead of tokenType to get last current value to track
        
        let newCurrentBalance  : BigNumber = new BigNumber(0) ;
        
        //XTZ
        const XTZbalance = await TezosL2.tz.getBalance(userAddress);
        
        //FA1.2 LOOP
        
        //kUSD
        let kUSDContract = await TezosL2.wallet.at(process.env["REACT_APP_KUSD_CONTRACT"]!,compose(tzip12, tzip16));
        const kUSDtokenMap : BigMapAbstraction = (await kUSDContract.storage() as FA12Contract).tokens;
        let kUSDBalance : BigNumber|undefined = await kUSDtokenMap.get<BigNumber>(userAddress);
        
        
        //CTEZ
        let ctezContract = await TezosL2.wallet.at(process.env["REACT_APP_CTEZ_CONTRACT"]!,compose(tzip12, tzip16));
        const ctezContractStorage : FA12Contract = (await ctezContract.storage() as FA12Contract)
        const cteztokenMap : BigMapAbstraction = ctezContractStorage.tokens;
        let ctezBalance : BigNumber|undefined = await cteztokenMap.get<BigNumber>(userAddress);
        
        //UUSD
        let uusdContract = await TezosL2.wallet.at(process.env["REACT_APP_UUSD_CONTRACT"]!,tzip12);
        const uusdContractStorage : FA2Contract = (await uusdContract.storage() as FA2Contract)
        const uusdtokenMap : BigMapAbstraction = uusdContractStorage.ledger;
        let uusdBalance : BigNumber|undefined = await uusdtokenMap.get<BigNumber>([userAddress,0]);
        
        //EURL
        let eurlContract = await TezosL2.wallet.at(process.env["REACT_APP_EURL_CONTRACT"]!,tzip12);
        const eurlContractStorage : FA2Contract = (await eurlContract.storage() as FA2Contract)
        const eurltokenMap : BigMapAbstraction = eurlContractStorage.ledger;
        let eurlBalance : BigNumber|undefined = await eurltokenMap.get<BigNumber>([userAddress,0]);
        
        let balance = new Map<TOKEN_TYPE,BigNumber>();
        balance.set(TOKEN_TYPE.XTZ,XTZbalance.dividedBy(Math.pow(10,6))); //convert mutez to tez
        if(kUSDBalance !== undefined) balance.set(TOKEN_TYPE.KUSD,kUSDBalance.dividedBy(Math.pow(10,(await kUSDContract.tzip12().getTokenMetadata(0)).decimals)));//convert from lowest kUSD decimal
        else balance.set(TOKEN_TYPE.KUSD,new BigNumber(0)); 
        if(ctezBalance !== undefined) balance.set(TOKEN_TYPE.CTEZ,ctezBalance.dividedBy(Math.pow(10,(await ctezContract.tzip12().getTokenMetadata(0)).decimals)));//convert from muctez
        else balance.set(TOKEN_TYPE.CTEZ,new BigNumber(0)); 
        if(uusdBalance !== undefined) balance.set(TOKEN_TYPE.UUSD,uusdBalance.dividedBy(Math.pow(10,(await uusdContract.tzip12().getTokenMetadata(0)).decimals)));//convert from lowest UUSD decimal
        else balance.set(TOKEN_TYPE.UUSD,new BigNumber(0)); 
        if(eurlBalance !== undefined) balance.set(TOKEN_TYPE.EURL,eurlBalance.dividedBy(Math.pow(10,(await eurlContract.tzip12().getTokenMetadata(0)).decimals)));//convert from lowest EURL decimal
        else balance.set(TOKEN_TYPE.EURL,new BigNumber(0)); 
        
        switch(tokenTypeRef.current){
            case TOKEN_TYPE.XTZ : newCurrentBalance=balance.get(TOKEN_TYPE.XTZ)!;break;
            case TOKEN_TYPE.KUSD : newCurrentBalance=balance.get(TOKEN_TYPE.KUSD)!;break;
            case TOKEN_TYPE.CTEZ : newCurrentBalance=balance.get(TOKEN_TYPE.CTEZ)!;break;
            case TOKEN_TYPE.UUSD : newCurrentBalance=balance.get(TOKEN_TYPE.UUSD)!;break;
            case TOKEN_TYPE.EURL : newCurrentBalance=balance.get(TOKEN_TYPE.EURL)!;break;
        }
        
        setUserBalance(balance);
        console.log("All balances initialized",balance);
        
        setShouldBounce(false);        
        
        if(!oldBalance.current){ //first time, we just record the value
            oldBalance.current = newCurrentBalance;
        }
        else if(!newCurrentBalance.isEqualTo(oldBalance.current)){
            setTimeout(() => {
                setChangeTicketColor(newCurrentBalance.isGreaterThan(oldBalance.current!)?"green":"red");
                setShouldBounce(true)
                setTimeout(() => {
                    setChangeTicketColor("");
                    oldBalance.current = newCurrentBalance; //keep old value before it vanishes
                }, 1000);
            }, 500);
        }
    }
    
    const handleWithdraw = async (withdrawProof : DEKUWithdrawProof) : Promise<number>=> {
        
        alert(JSON.stringify(withdrawProof))
        
        console.log("handleWithdraw");
        let rollupContract : Contract = await TezosL2.contract.at(rollupType === ROLLUP_TYPE.DEKU ?process.env["REACT_APP_ROLLUP_CONTRACT_DEKU"]!:process.env["REACT_APP_ROLLUP_CONTRACT_TORU"]!);
        console.log("rollupContract",rollupContract);
        
        
        let param : RollupParameters = 
        rollupType === ROLLUP_TYPE.DEKU ? 
        new RollupParametersDEKU(
            process.env["REACT_APP_CONTRACT"]!+"%withdrawDEKU", 
            withdrawProof.withdrawal_handle.amount,
            tokenType == TOKEN_TYPE.XTZ ? await getBytes(TOKEN_TYPE.XTZ) : await getBytes(TOKEN_TYPE[tokenType.toUpperCase() as keyof typeof TOKEN_TYPE],process.env["REACT_APP_"+tokenType+"_CONTRACT"]!) ,
            withdrawProof.withdrawal_handle.id,
            userAddress,
            process.env["REACT_APP_CONTRACT"]!,
            withdrawProof.withdrawal_handles_hash,
            withdrawProof.proof) 
            : new RollupParametersTORU();
            
            console.log("param",param);
            
            const op = await rollupContract.methods.withdraw(...Object.values(param)).send();
            console.log("sent");
            
            return op.confirmation();
            
        };
        
        
        useEffect(() => { (async () => {
            refreshBalance();
            setInterval(refreshBalance, 15*1000); //refresh async L1 balances 
        })();
    }, []);
    
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
        <Grid container  borderRadius={5}
        spacing={2}
        color="primary.main" 
        width="auto"
        sx={{ margin : "5vh 20vw", padding : "2em"}}
        bgcolor="secondary.main">
        
        <Backdrop
        sx={{ color: '#fff', zIndex: (theme : any) => theme.zIndex.drawer + 1 }}
        open={tezosLoading}
        >
        <CircularProgress color="inherit" />
        </Backdrop>
        
        
        <Stack sx={{width:"100%"}} direction="column" spacing={2}>
        
        <OutlinedInput 
        fullWidth
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
    
    
    <TextField value={opHash} placeholder="Enter your operation hash here" onChange={(e)=>setOpHash(e.target.value?e.target.value.trim():"")}/>
    <Button color="warning" variant="contained" onClick={(e)=>handleL1Withdraw(e)}>L1 Claim</Button>    
    
    </Stack>          
    
    </Grid>
    );
};

export default ClaimL1;


