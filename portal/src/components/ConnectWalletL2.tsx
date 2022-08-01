import { Dispatch, Fragment, SetStateAction, useEffect } from "react";
import { BigMapAbstraction, TezosToolkit, WalletContract } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";

import { AccountInfo, NetworkType} from "@airgap/beacon-types";

import Button from "@mui/material/Button";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { PAGES } from "../App";
import { FA12Contract } from "./fa12Contract";
import BigNumber from 'bignumber.js';
import { Avatar, Chip } from "@mui/material";
import { LogoutOutlined } from "@mui/icons-material";


type ButtonProps = {
    userL2Address:string;
    setUserL2Address: Dispatch<SetStateAction<string>>;
    setUserL2Balance: Dispatch<SetStateAction<number>>;
    wallet: BeaconWallet;
    activeAccount : AccountInfo;
    setActiveAccount :  Dispatch<SetStateAction<AccountInfo|undefined>>;
};



const ConnectButtonL2 = ({
    userL2Address,
    setUserL2Address,
    setUserL2Balance,
    wallet,
    activeAccount,
    setActiveAccount
}: ButtonProps): JSX.Element => {
    
    const connectWallet = async (): Promise<void> => {
        try 
        {
            const l1ActiveAccount = (await wallet.client.getAccounts())[0];
            console.log("l1ActiveAccount",l1ActiveAccount);
            await wallet.requestPermissions({
                network: {
                    type: process.env["REACT_APP_NETWORK"]? NetworkType[process.env["REACT_APP_NETWORK"].toUpperCase() as keyof typeof NetworkType]  : NetworkType.JAKARTANET,
                    rpcUrl: process.env["REACT_APP_DEKU_NODE"]!
                }
            });
            //force refresh here like this
            const activeAccount = await wallet.client.getActiveAccount();
            setUserL2Address(activeAccount!.address);
            console.log("Connected to Layer 2");
            setActiveAccount(l1ActiveAccount); //reset to L1 for deposit
        } catch (error) {
            console.log(error);
        }
    };

    const removeAccount = async () => {
        const accounts = await wallet.client.getAccounts();
        const l2Account : AccountInfo | undefined = accounts.find((a)=> {return a.address == userL2Address}); 
        wallet.client.removeAccount(l2Account!.accountIdentifier);
        setUserL2Address("");
        setUserL2Balance(0);
        wallet.client.setActiveAccount(accounts[0]);
        console.log("Disconnected from Layer 2");
    };
    
    return (
        <Fragment>
        {!userL2Address?
            <Button variant="contained" onClick={connectWallet}>
            <AccountBalanceWalletIcon /> &nbsp; Connect L2
            </Button>
            :<Chip   avatar={<Avatar src="DEKU.png" />}
            variant={activeAccount?.address == userL2Address ?"filled":"outlined"} color="secondary"  onDelete={removeAccount}   label={userL2Address} deleteIcon={<LogoutOutlined />}/> }
            </Fragment>
            );
        };
        
        export default ConnectButtonL2;