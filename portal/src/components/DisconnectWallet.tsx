import { BeaconWallet } from "@taquito/beacon-wallet";
import { Dispatch, SetStateAction } from "react";
import { PAGES } from "../App";

interface ButtonProps {
    wallet: BeaconWallet | null;
    setUserAddress: Dispatch<SetStateAction<string>>;
    setUserBalance: Dispatch<SetStateAction<number>>;
    setWallet: Dispatch<SetStateAction<any>>;
    setActivePage: Dispatch<SetStateAction<PAGES>>;
}

const DisconnectButton = ({
    wallet,
    setUserAddress,
    setUserBalance,
    setWallet,
    setActivePage
}: ButtonProps): JSX.Element => {
    const disconnectWallet = async (): Promise<void> => {
        setUserAddress("");
        setUserBalance(0);
        setWallet(null);
        setActivePage(PAGES.WELCOME);
        console.log("disconnecting wallet");
        if (wallet) {
            await wallet.client.removeAllAccounts();
            await wallet.client.removeAllPeers();
            await wallet.client.destroy();
        }
    };

    return (
        <span onClick={disconnectWallet}>
            Disconnect wallet
        </span>
    );
};

export default DisconnectButton;

