import {
    AccountInfo,
    NetworkType
} from "@airgap/beacon-types";
import { LogoutOutlined } from "@mui/icons-material";
import { Avatar, Button, Chip, Stack, useMediaQuery } from "@mui/material";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { TezosToolkit } from "@taquito/taquito";
import { Dispatch, Fragment, SetStateAction } from "react";
import { PAGES } from "../App";
import './../App.css';
import { LAYER2Type } from "./TezosUtils";


type ButtonProps = {
    Tezos: TezosToolkit;
    setTezos: Dispatch<SetStateAction<TezosToolkit>>;
    setWallet: Dispatch<SetStateAction<any>>;
    userAddress: string;
    userL2Address: string;
    setUserAddress: Dispatch<SetStateAction<string>>;
    wallet: BeaconWallet;
    disconnectWallet: any;
    activeAccount: AccountInfo;
    setActiveAccount: Dispatch<SetStateAction<AccountInfo | undefined>>;
    accounts: AccountInfo[];
    hideAfterConnect: boolean;
    setPageIndex: Dispatch<SetStateAction<string>>;
};

const ConnectButton = ({
    Tezos,
    setTezos,
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

    const setL1AccountAsActive = async () => {
        const l1Account: AccountInfo | undefined = accounts.find((a) => { return a.address == userAddress && a.accountIdentifier !== LAYER2Type.L2_DEKU });
        setActiveAccount(l1Account);

        if (userL2Address === "") setPageIndex("" + PAGES.WELCOME)
        else setPageIndex("" + PAGES.DEPOSIT);
    }

    const connectWallet = async (): Promise<void> => {
        try {
            await wallet.requestPermissions({
                network: {
                    type: process.env["REACT_APP_NETWORK"] ? NetworkType[process.env["REACT_APP_NETWORK"].toUpperCase() as keyof typeof NetworkType] : NetworkType.JAKARTANET,
                    rpcUrl: process.env["REACT_APP_TEZOS_NODE"]!
                }
            });
            //force refresh here like this
            const activeAccount = (await wallet.client.getActiveAccount()) as AccountInfo;
            setUserAddress(activeAccount!.address);
            console.log("Connected to Layer 1");
            setActiveAccount(activeAccount);
            accounts.push(activeAccount);

            Tezos.setWalletProvider(wallet);
            setTezos(Tezos);

            if (userL2Address !== "") setPageIndex("" + PAGES.DEPOSIT);

        } catch (error) {
            console.log(error);
        }
    };

    const isDesktop = useMediaQuery('(min-width:600px)');
    return (<Fragment>
        {!userAddress || userAddress === "" ?
            <Stack direction="row" alignContent="center" alignItems="center">
                 <img style={{ background: "var(--tertiary-color)" }} src="XTZ_white.png" height={24} width={24} />
                <Button variant="contained"  onClick={connectWallet}>
                    Connect Tezos wallet
                </Button>
            </Stack>
            : !hideAfterConnect ? <Chip
                style={{
                    marginTop: "20px", marginRight: "20px",
                    opacity: (activeAccount?.address == userAddress && activeAccount.accountIdentifier !== LAYER2Type.L2_DEKU ? 1 : 0.38)
                }}
                onClick={() => setL1AccountAsActive()} avatar={<Avatar src="XTZ_white.png" />}
                color="primary" onDelete={disconnectWallet} label={userAddress} deleteIcon={<LogoutOutlined />} />
                : ""
        }
    </Fragment>
    );
};

export default ConnectButton;


