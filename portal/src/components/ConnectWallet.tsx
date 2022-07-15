import { Dispatch, SetStateAction, useEffect } from "react";
import { BigMapAbstraction, TezosToolkit, WalletContract } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import {
    NetworkType
} from "@airgap/beacon-types";
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
    setActivePage,
    wallet
}: ButtonProps): JSX.Element => {

    const setup = async (userAddress: string): Promise<void> => {
        setUserAddress(userAddress);
        // updates balance
        const balance = await Tezos.tz.getBalance(userAddress);
        setUserBalance(balance.toNumber());   
    };

    const connectWallet = async (): Promise<void> => {
        try {
            if (!wallet) await createWallet();
            await wallet.requestPermissions({
                network: {
                    type: process.env["REACT_APP_NETWORK"]? NetworkType[process.env["REACT_APP_NETWORK"].toUpperCase() as keyof typeof NetworkType]  : NetworkType.JAKARTANET,
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
                preferredNetwork: process.env["REACT_APP_NETWORK"]? NetworkType[process.env["REACT_APP_NETWORK"].toUpperCase() as keyof typeof NetworkType]  : NetworkType.JAKARTANET,
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