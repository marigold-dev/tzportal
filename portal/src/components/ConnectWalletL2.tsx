import { ChangeEvent, Dispatch, Fragment, SetStateAction } from "react";
import {  TezosToolkit } from "@taquito/taquito";
import './../App.css';

import { AccountInfo, NetworkType, Origin} from "@airgap/beacon-types";

import Button from "@mui/material/Button";

import { Avatar, Chip, Stack, useMediaQuery } from "@mui/material";
import {  LogoutOutlined } from "@mui/icons-material";
import { InMemorySigner } from "@taquito/signer";
import { LAYER2Type } from "./TezosUtils";

import { PAGES } from "../App";


type ButtonProps = {
    userAddress:string;
    userL2Address:string;
    setUserL2Address: Dispatch<SetStateAction<string>>;
    TezosL2: TezosToolkit;
    activeAccount : AccountInfo;
    setActiveAccount :  Dispatch<SetStateAction<AccountInfo|undefined>>;
    accounts : AccountInfo[];
    disconnectWalletL2:any;
    hideAfterConnect:boolean;
    setPageIndex:Dispatch<SetStateAction<string>>;
};



const ConnectButtonL2 = ({
    userAddress,
    userL2Address,
    setUserL2Address,
    TezosL2,
    activeAccount,
    setActiveAccount,
    accounts,
    disconnectWalletL2,
    hideAfterConnect,
    setPageIndex
}: ButtonProps): JSX.Element => {
    
    const setL2AccountAsActive = async() => {
        const l2Account : AccountInfo | undefined = accounts.find((a)=> {return a.address == userL2Address && a.accountIdentifier===LAYER2Type.L2_DEKU}); 
        setActiveAccount(l2Account);

        if(userAddress=="")setPageIndex(""+PAGES.L2TRANSFER)
        else setPageIndex(""+PAGES.WITHDRAW) ;

    }
    
    const connectWallet = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) {
            return;
        }
        const file = e.target.files[0];
        const fileReader = new FileReader();
        
        fileReader.readAsText(file);
        fileReader.onload = async(e) => {
            if (!e?.target?.result) {
                return;
            }
            const l2Wallet : {
                address: string,
                priv_key: string    
            } = JSON.parse(e.target.result as string);
            setUserL2Address(l2Wallet.address);
            
            const accountInfo : AccountInfo = { address: l2Wallet.address,
                network: {
                    type: NetworkType[process.env["REACT_APP_NETWORK"]!.toUpperCase() as keyof typeof NetworkType]
                } ,
                scopes: [],
                accountIdentifier: LAYER2Type.L2_DEKU,
                senderId: "string",
                origin: {
                    type: Origin.EXTENSION,
                    id: "string"
                },
                publicKey: "string",
                connectedAt: new Date().getTime()
            } as AccountInfo;
            if(accounts.length == 0)setActiveAccount(accountInfo);
            accounts.push(accountInfo);
            TezosL2.setProvider({ signer: await InMemorySigner.fromSecretKey(l2Wallet.priv_key) });
            

            if(userAddress=="")setPageIndex(""+PAGES.L2TRANSFER)
            else setPageIndex(""+PAGES.DEPOSIT) ;

            console.log("Connected to Layer 2");
            
        };
    };
    const isDesktop = useMediaQuery('(min-width:600px)');
    return (
        <Fragment>
        {!userL2Address?
            
            <Stack direction="row" alignContent="center" alignItems="center">
             <img  style={isDesktop?{background:"transparent"}:{background:"#22313f"}} src="deku_white.png" height={24} width={24}/>
            <Button
            variant="contained"
            component="label" 
            >  &nbsp;
            Upload DEKU wallet file
            <input
            type="file"
            hidden
            onChange={(e: ChangeEvent<HTMLInputElement>)=>connectWallet(e)}
            />
            </Button>
            </Stack>
            :!hideAfterConnect? <Chip
            style={{ 
                marginTop: "20px", 
                opacity: (activeAccount?.address == userL2Address && activeAccount.accountIdentifier===LAYER2Type.L2_DEKU?1:0.38)}}
            color="primary"  onClick={setL2AccountAsActive} avatar={<Avatar src="deku_white.png" />}
             onDelete={disconnectWalletL2}   label={userL2Address} deleteIcon={<LogoutOutlined />
            
        }/> 
        :""
    }
    </Fragment>
    );
};

export default ConnectButtonL2;