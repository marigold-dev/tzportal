import { DekuToolkit } from "@marigold-dev/deku-toolkit";
import { Backdrop, Box, Button, CircularProgress, keyframes, Stack, useMediaQuery } from "@mui/material";
import { compose, TezosToolkit } from "@taquito/taquito";
import { tzip12 } from "@taquito/tzip12";
import { tzip16 } from "@taquito/tzip16";
import BigNumber from 'bignumber.js';
import { useSnackbar } from "notistack";
import { MouseEvent, useEffect, useRef, useState } from "react";
import RollupBox, { RollupBoxComponentType } from "./RollupBox";
import { RollupCHUSAI, RollupDEKU, RollupTORU, ROLLUP_TYPE, TOKEN_TYPE } from "./TezosUtils";
import { TransactionInvalidBeaconError } from "./TransactionInvalidBeaconError";



type TransferL2Props = {
    TezosL2: TezosToolkit;
    dekuClient: DekuToolkit;
    userL2Address: string;
    tokenBytes: Map<TOKEN_TYPE, string>;
    rollup: RollupTORU | RollupDEKU | RollupCHUSAI | undefined;
    rollupmap: Map<ROLLUP_TYPE, string>;
    rollupType: ROLLUP_TYPE;
};

const TransferL2 = ({
    TezosL2,
    dekuClient,
    userL2Address,
    tokenBytes,
    rollup,
    rollupmap,
    rollupType
}: TransferL2Props): JSX.Element => {

    const [quantity, setQuantity] = useState<BigNumber>(new BigNumber(0));
    const [userL2DestinationAddress, setUserL2DestinationAddress] = useState<string>(""); // L2 user destination address
    const userL2DestinationAddressRef = useRef(userL2DestinationAddress); //TRICK : to track current value on async timeout functions
    userL2DestinationAddressRef.current = userL2DestinationAddress;

    const rollupBoxRef = useRef<RollupBoxComponentType>();
    const rollupDestinationBoxRef = useRef<RollupBoxComponentType>();


    // MESSAGES
    const { enqueueSnackbar } = useSnackbar();

    //TEZOS OPERATIONS
    const [tezosLoading, setTezosLoading] = useState(false);

    const [userTicketBalance, setUserTicketBalance] = useState<Map<TOKEN_TYPE, BigNumber>>(new Map());
    const [userTicketDestinationBalance, setUserTicketDestinationBalance] = useState<Map<TOKEN_TYPE, BigNumber>>(new Map()); //the L2 destination address

    let oldTicketBalance = useRef<BigNumber>();
    let oldTicketDestinationBalance = useRef<BigNumber>();

    const [tokenType, setTokenType] = useState<string>(TOKEN_TYPE.CTEZ);
    const tokenTypeRef = useRef(tokenType); //TRICK : to track current value on async timeout functions
    tokenTypeRef.current = tokenType;
    useEffect(() => {
        oldTicketBalance.current = userTicketBalance.get(TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE])!;
        oldTicketDestinationBalance.current = userTicketDestinationBalance.get(TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE])!;
    }, [tokenType]); //required to refresh to current when changing token type



    const refreshTicketBalance = async (destinationL2Address?: string) => {

        //Note : tokenTypeRef.current is this ref instead of tokenType to get last current value to track
        let userL2: string = destinationL2Address ? destinationL2Address : userL2Address;

        let newCurrentBalance: BigNumber = new BigNumber(0);


        //FIXME change to bigdecimal later all below


        //XTZ
        console.log("Refreshing balance for XTZ: ",
            process.env["REACT_APP_CONTRACT"],
            tokenBytes.get(TOKEN_TYPE.XTZ));
        const XTZbalance = new BigNumber(await dekuClient.getBalance(userL2, { ticketer: process.env["REACT_APP_CONTRACT"]!, data: tokenBytes.get(TOKEN_TYPE.XTZ)! }));

        //kUSD
        let kUSDContract = await TezosL2.wallet.at(process.env["REACT_APP_KUSD_CONTRACT"]!, compose(tzip12, tzip16));
        let kUSDBalance = new BigNumber(await dekuClient.getBalance(userL2, { ticketer: process.env["REACT_APP_CONTRACT"]!, data: tokenBytes.get(TOKEN_TYPE.KUSD)! }));

        //CTEZ
        console.log("Refreshing balance for Ctez: ",
            process.env["REACT_APP_CTEZ_CONTRACT"],
            tokenBytes.get(TOKEN_TYPE.CTEZ));
        let ctezContract = await TezosL2.wallet.at(process.env["REACT_APP_CTEZ_CONTRACT"]!, compose(tzip12, tzip16));
        let ctezBalance = new BigNumber(await dekuClient.getBalance(userL2, { ticketer: process.env["REACT_APP_CONTRACT"]!, data: tokenBytes.get(TOKEN_TYPE.CTEZ)! }));

        //UUSD
        let uusdContract = await TezosL2.wallet.at(process.env["REACT_APP_UUSD_CONTRACT"]!, tzip12);
        let uusdBalance = new BigNumber(await dekuClient.getBalance(userL2, { ticketer: process.env["REACT_APP_CONTRACT"]!, data: tokenBytes.get(TOKEN_TYPE.UUSD)! }));

        //EURL
        let eurlContract = await TezosL2.wallet.at(process.env["REACT_APP_EURL_CONTRACT"]!, tzip12);
        let eurlBalance = new BigNumber(await dekuClient.getBalance(userL2, { ticketer: process.env["REACT_APP_CONTRACT"]!, data: tokenBytes.get(TOKEN_TYPE.EURL)! }));

        let balance = new Map<TOKEN_TYPE, BigNumber>();
        balance.set(TOKEN_TYPE.XTZ, XTZbalance.dividedBy(Math.pow(10, 6))); //convert mutez to tez
        balance.set(TOKEN_TYPE.KUSD, kUSDBalance.dividedBy(Math.pow(10, (await kUSDContract.tzip12().getTokenMetadata(0)).decimals)));//convert from lowest kUSD decimal
        balance.set(TOKEN_TYPE.CTEZ, ctezBalance.dividedBy(Math.pow(10, (await ctezContract.tzip12().getTokenMetadata(0)).decimals)));//convert from muctez
        balance.set(TOKEN_TYPE.UUSD, uusdBalance.dividedBy(Math.pow(10, (await uusdContract.tzip12().getTokenMetadata(0)).decimals)));//convert from lowest UUSD decimal
        balance.set(TOKEN_TYPE.EURL, eurlBalance.dividedBy(Math.pow(10, (await eurlContract.tzip12().getTokenMetadata(0)).decimals)));//convert from lowest EURL decimal

        switch (tokenTypeRef.current) {
            case TOKEN_TYPE.XTZ: newCurrentBalance = balance.get(TOKEN_TYPE.XTZ)!; break;
            case TOKEN_TYPE.KUSD: newCurrentBalance = balance.get(TOKEN_TYPE.KUSD)!; break;
            case TOKEN_TYPE.CTEZ: newCurrentBalance = balance.get(TOKEN_TYPE.CTEZ)!; break;
            case TOKEN_TYPE.UUSD: newCurrentBalance = balance.get(TOKEN_TYPE.UUSD)!; break;
            case TOKEN_TYPE.EURL: newCurrentBalance = balance.get(TOKEN_TYPE.EURL)!; break;
        }

        destinationL2Address ? setUserTicketDestinationBalance(balance) : setUserTicketBalance(balance);
        console.log("[TransferL2] All ticket balances initialized for " + userL2, balance);

        destinationL2Address ? rollupDestinationBoxRef?.current?.setShouldBounce(false) : rollupBoxRef?.current?.setShouldBounce(false);



        if (destinationL2Address) {
            if (!oldTicketDestinationBalance.current) { //first time, we just record the value
                oldTicketDestinationBalance.current = newCurrentBalance;
            }
            else if (!newCurrentBalance.isEqualTo(oldTicketDestinationBalance.current)) {
                setTimeout(() => {
                    rollupDestinationBoxRef?.current?.setChangeTicketColor(newCurrentBalance.isGreaterThan(oldTicketDestinationBalance.current!) ? "green" : "red");
                    rollupDestinationBoxRef?.current?.setShouldBounce(true)
                    setTimeout(() => {
                        rollupDestinationBoxRef?.current?.setChangeTicketColor("");
                        oldTicketDestinationBalance.current = newCurrentBalance; //keep old value before it vanishes
                    }, 1000);
                }, 500);
            }
        } else {
            if (!oldTicketBalance.current) { //first time, we just record the value
                oldTicketBalance.current = newCurrentBalance;
            }
            else if (!newCurrentBalance.isEqualTo(oldTicketBalance.current)) {
                setTimeout(() => {
                    rollupBoxRef?.current?.setChangeTicketColor(newCurrentBalance.isGreaterThan(oldTicketBalance.current!) ? "green" : "red");
                    rollupBoxRef?.current?.setShouldBounce(true)
                    setTimeout(() => {
                        rollupBoxRef?.current?.setChangeTicketColor("");
                        oldTicketBalance.current = newCurrentBalance; //keep old value before it vanishes
                    }, 1000);
                }, 500);
            }
        }



    }



    useEffect(() => {
        oldTicketBalance.current = userTicketBalance.get(TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE])!;
    }, [tokenType]); //required to refresh to current when changing token type

    useEffect(() => {

        (async () => {
            await refreshTicketBalance();
            await refreshTicketBalance(userL2DestinationAddressRef.current);
        })();

        const intervalId = setInterval(refreshTicketBalance, 15 * 1000); //refresh async L2 balances
        const intervalId2 = setInterval(() => refreshTicketBalance(userL2DestinationAddressRef.current), 15 * 1000); //refresh async L2 destination balances

        return () => { clearInterval(intervalId); clearInterval(intervalId2) };

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

    const isDesktop = useMediaQuery('(min-width:600px)');



    const handleL2Transfer = async (event: MouseEvent<HTMLButtonElement>) => {

        event.preventDefault();
        setTezosLoading(true);

        try {
            let decimals = Math.pow(10, 6);
            if (tokenType !== TOKEN_TYPE.XTZ) {
                let faContract = await TezosL2.wallet.at(tokenType === TOKEN_TYPE.CTEZ ? process.env["REACT_APP_CTEZ_CONTRACT"]! : tokenType === TOKEN_TYPE.KUSD ? process.env["REACT_APP_KUSD_CONTRACT"]! : tokenType === TOKEN_TYPE.UUSD ? process.env["REACT_APP_UUSD_CONTRACT"]! : process.env["REACT_APP_EURL_CONTRACT"]!, tzip12);
                decimals = Math.pow(10, (await faContract.tzip12().getTokenMetadata(0)).decimals);
            }

            //FIXME change to bigdecimal later
            const opHash = await dekuClient.transferTo(userL2DestinationAddress, quantity.multipliedBy(decimals).toNumber(), process.env["REACT_APP_CONTRACT"]!, tokenBytes.get(TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE])!);
            enqueueSnackbar("Transaction to " + userL2DestinationAddress + " was successful", { variant: "success", autoHideDuration: 10000 });
        } catch (error: any) {
            console.table(`Error: ${JSON.stringify(error, null, 2)}`);
            let tibe: TransactionInvalidBeaconError = new TransactionInvalidBeaconError(error);
            enqueueSnackbar(tibe.data_message, { variant: "error", autoHideDuration: 10000 });

        } finally {
            setTezosLoading(false);
        }

        setTezosLoading(false);
    };


    return (
        <Box display="flex"
            justifyContent="center"
            alignItems="center"
            color="primary.main"
            alignContent={"space-between"}
            textAlign={"center"}
            width={!isDesktop ? "100%" : "700px"}
            sx={isDesktop ? { marginTop: "2vh", padding: "2em", background:"var(--tertiary-color)", border: "3px solid #7B7B7E" } : { marginTop: 0, padding: 0, borderRadius: "0" }}
        >

            <Backdrop
                sx={{ color: '#fff', zIndex: (theme: any) => theme.zIndex.drawer + 1 }}
                open={tezosLoading}
            >
                <CircularProgress color="inherit" />
            </Backdrop>


            <Stack sx={isDesktop ? { width: "inherit" } : { padding: "30px" }} direction="column" spacing={2}>

                <RollupBox
                    rollupmap={rollupmap}
                    isDirectionDeposit={false}
                    ref={rollupBoxRef}
                    Tezos={TezosL2}
                    userAddress={userL2Address}
                    setUserAddress={undefined}
                    userBalance={userTicketBalance}
                    tokenBytes={tokenBytes}
                    handlePendingWithdraw={undefined}
                    handlePendingDeposit={undefined}
                    handleL2Transfer={handleL2Transfer}
                    rollupType={rollupType}
                    rollup={rollup}
                    dekuClient={dekuClient}
                    tokenType={TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE]}
                    quantity={quantity}
                    setQuantity={setQuantity}
                    setTokenType={setTokenType}
                />

                <div style={{ height: 0 }}>
                    <Button sx={{ position: "relative", top: "-90px" }} color="warning" variant="contained" onClick={(e) => handleL2Transfer(e)}>Transfer</Button>
                </div>

                <RollupBox
                    rollupmap={rollupmap}
                    isDirectionDeposit={true}
                    ref={rollupDestinationBoxRef}
                    Tezos={TezosL2}
                    userAddress={userL2DestinationAddress}
                    setUserAddress={setUserL2DestinationAddress}
                    userBalance={userTicketDestinationBalance}
                    tokenBytes={tokenBytes}
                    handlePendingWithdraw={undefined}
                    handlePendingDeposit={undefined}
                    handleL2Transfer={handleL2Transfer}
                    rollupType={rollupType}
                    rollup={rollup}
                    dekuClient={dekuClient}
                    tokenType={TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE]}
                    quantity={quantity}
                    setQuantity={setQuantity}
                    setTokenType={setTokenType}
                />


            </Stack>


        </Box>
    );
};

export default TransferL2;


