import React, { Dispatch, Fragment, SetStateAction, useEffect } from "react";
import { BigMapAbstraction, TezosToolkit, WalletContract } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import {
    AccountInfo,
    NetworkType
} from "@airgap/beacon-types";
import Button from "@mui/material/Button";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { PAGES } from "../App";
import { FA12Contract } from "./fa12Contract";
import BigNumber from 'bignumber.js';
import { Avatar, Chip } from "@mui/material";
import { LogoutOutlined } from "@mui/icons-material";


type ButtonProps = {
    Tezos: TezosToolkit;
    setWallet: Dispatch<SetStateAction<any>>;
    userAddress:string;
    setUserAddress: Dispatch<SetStateAction<string>>;
    setUserBalance: Dispatch<SetStateAction<number>>;
    wallet: BeaconWallet;
    disconnectWallet:any;
    activeAccount : AccountInfo;
    setActiveAccount :  Dispatch<SetStateAction<AccountInfo|undefined>>;

};

const ConnectButton = ({
    Tezos,
    setWallet,
    userAddress,
    setUserAddress,
    setUserBalance,
    wallet,
    disconnectWallet,
    activeAccount,
    setActiveAccount
}: ButtonProps): JSX.Element => {

    

    const connectWallet = async (): Promise<void> => {
        try {
            await wallet.requestPermissions({
                network: {
                    type: process.env["REACT_APP_NETWORK"]? NetworkType[process.env["REACT_APP_NETWORK"].toUpperCase() as keyof typeof NetworkType]  : NetworkType.JAKARTANET,
                    rpcUrl: process.env["REACT_APP_TEZOS_NODE"]!
                }
            });
            //force refresh here like this
            const activeAccount = await wallet.client.getActiveAccount();
            setUserAddress(activeAccount!.address);
            setActiveAccount(activeAccount);
        } catch (error) {
            console.log(error);
        }
    };

    return (<Fragment>
        {!userAddress || userAddress === ""?
            <Button variant="contained" onClick={connectWallet}>
               <AccountBalanceWalletIcon /> &nbsp; Connect L1 Tezos
            </Button>
            :<Chip   avatar={<Avatar src="XTZ.png" />}
 variant={activeAccount?.address == userAddress ?"filled":"outlined"}  color="secondary"      onDelete={disconnectWallet}     label={userAddress} deleteIcon={<LogoutOutlined />}/> }
         </Fragment>
    );
};

export default ConnectButton;