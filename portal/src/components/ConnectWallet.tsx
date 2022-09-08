import React, { Dispatch, Fragment, SetStateAction, useEffect } from "react";
import { BigMapAbstraction, TezosToolkit, WalletContract } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import {
    AccountInfo,
    NetworkType
} from "@airgap/beacon-types";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { PAGES } from "../App";
import { FA12Contract } from "./fa12Contract";
import BigNumber from 'bignumber.js';
import { Avatar, Button, Chip, Icon, Stack, useMediaQuery } from "@mui/material";
import { LogoutOutlined } from "@mui/icons-material";
import { LAYER2Type } from "./TezosUtils";
import './../App.css';


type ButtonProps = {
    Tezos: TezosToolkit;
    setWallet: Dispatch<SetStateAction<any>>;
    userAddress:string;
    userL2Address:string;
    setUserAddress: Dispatch<SetStateAction<string>>;
    wallet: BeaconWallet;
    disconnectWallet:any;
    activeAccount : AccountInfo;
    setActiveAccount :  Dispatch<SetStateAction<AccountInfo|undefined>>;
    accounts : AccountInfo[];
    hideAfterConnect : boolean;
    setPageIndex : Dispatch<SetStateAction<string>>;
};

const ConnectButton = ({
    Tezos,
    setWallet,
    userAddress,
    userL2Address,
    setUserAddress,
    wallet,
    disconnectWallet,
    activeAccount,
    setActiveAccount,
    accounts,
    hideAfterConnect,
    setPageIndex
}: ButtonProps): JSX.Element => {
    
    const setL1AccountAsActive = async() => {
        const l1Account : AccountInfo | undefined = accounts.find((a)=> {return a.address == userAddress && a.accountIdentifier!==LAYER2Type.L2_DEKU}); 
        setActiveAccount(l1Account);

        if(userL2Address==="")setPageIndex(""+PAGES.WELCOME)
        else setPageIndex(""+PAGES.DEPOSIT) ;
    }
    
    const connectWallet = async (): Promise<void> => {
        try {
            await wallet.requestPermissions({
                network: {
                    type: process.env["REACT_APP_NETWORK"]? NetworkType[process.env["REACT_APP_NETWORK"].toUpperCase() as keyof typeof NetworkType]  : NetworkType.JAKARTANET,
                    rpcUrl: process.env["REACT_APP_TEZOS_NODE"]!
                }
            });
            //force refresh here like this
            const activeAccount = (await wallet.client.getActiveAccount())as AccountInfo;
            setUserAddress(activeAccount!.address);
            console.log("Connected to Layer 1");
            setActiveAccount(activeAccount);
            accounts.push(activeAccount);
            
            if(userL2Address!=="")setPageIndex(""+PAGES.DEPOSIT) ;

        } catch (error) {
            console.log(error);
        }
    };
    
    const isDesktop = useMediaQuery('(min-width:600px)');
    return (<Fragment>
        {!userAddress || userAddress === ""?
        <Stack direction="row" alignContent="center" alignItems="center">
        <img  style={isDesktop?{background:"transparent"}:{background:"#22313f", borderRadius: "5px"}} src="XTZ_white.png" height={24} width={24}/>
        <Button variant="contained" onClick={connectWallet}>
        Connect Tezos wallet
        </Button>
        </Stack>
        : !hideAfterConnect? <Chip  
        style={{
            marginTop: "20px", marginRight: "20px",
            opacity: (activeAccount?.address == userAddress && activeAccount.accountIdentifier!==LAYER2Type.L2_DEKU?1:0.38)}}
            onClick={()=>setL1AccountAsActive()}  avatar={<Avatar src="XTZ_white.png" />}
            color="primary"      onDelete={disconnectWallet}     label={userAddress} deleteIcon={<LogoutOutlined />}/>
            :""
        }
        </Fragment>
        );
    };
    
    export default ConnectButton;
    
    
    