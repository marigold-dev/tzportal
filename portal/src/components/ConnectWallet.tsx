import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { BigMapAbstraction, TezosToolkit, WalletContract } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import {
    NetworkType
} from "@airgap/beacon-sdk";
import Button from "@mui/material/Button";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { PAGES } from "../App";
import { FA12Contract } from "./fa12Contract";
import BigNumber from 'bignumber.js';


type ButtonProps = {
    Tezos: TezosToolkit;
    setWallet: Dispatch<SetStateAction<any>>;
    setUserAddress: Dispatch<SetStateAction<string>>;
    setUserBalance: Dispatch<SetStateAction<number>>;
    setUserCtezBalance : Dispatch<SetStateAction<number>>;
    setActivePage: Dispatch<SetStateAction<PAGES>>;
    wallet: BeaconWallet;
};

const ConnectButton = ({
    Tezos,
    setWallet,
    setUserAddress,
    setUserBalance,
    setUserCtezBalance,
    setActivePage,
    wallet
}: ButtonProps): JSX.Element => {

    const setup = async (userAddress: string): Promise<void> => {
        setUserAddress(userAddress);
        // updates balance
        const balance = await Tezos.tz.getBalance(userAddress);
        setUserBalance(balance.toNumber());
        //ctez
        let ctezContract : WalletContract = await Tezos.wallet.at(process.env["REACT_APP_CTEZ_CONTRACT"]!);
        const tokenMap : BigMapAbstraction = (await ctezContract.storage() as FA12Contract).tokens;
        let ctezBalance : BigNumber|undefined = await tokenMap.get<BigNumber>(userAddress);
        setUserCtezBalance(ctezBalance != undefined ? ctezBalance.toNumber() : 0);    
    };

    const connectWallet = async (): Promise<void> => {
        try {
            if (!wallet) await createWallet();
            await wallet.requestPermissions({
                network: {
                    type: process.env["REACT_APP_NETWORK"]? NetworkType[process.env["REACT_APP_NETWORK"].toUpperCase() as keyof typeof NetworkType]  : NetworkType.ITHACANET,
                    rpcUrl: process.env["REACT_APP_TEZOS_NODE"]!
                }
            });
            // gets user's address
            const userAddress = await wallet.getPKH();
            await setup(userAddress);
            setActivePage(PAGES.DEPOSIT);
        } catch (error) {
            console.log(error);
        }
    };

    const createWallet = async () => {
        // creates a wallet instance if not exists
        if (!wallet) {
            wallet = new BeaconWallet({
                name: "TzPortal",
                preferredNetwork: process.env["REACT_APP_NETWORK"]? NetworkType[process.env["REACT_APP_NETWORK"].toUpperCase() as keyof typeof NetworkType]  : NetworkType.ITHACANET,
            });
        }
        Tezos.setWalletProvider(wallet);
        setWallet(wallet);
        // checks if wallet was connected before
        const activeAccount = await wallet.client.getActiveAccount();
        if (activeAccount) {
            const userAddress = await wallet.getPKH();
            await setup(userAddress);
        }
    }

    useEffect(() => {
        (async () => createWallet())();
    }, []);

    return (
            <Button variant="contained" onClick={connectWallet}>
               <AccountBalanceWalletIcon /> &nbsp; Connect
            </Button>
    );
};

export default ConnectButton;