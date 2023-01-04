import { AccountInfo } from "@airgap/beacon-types";
import { DekuPClient } from "@marigold-dev/deku";
import { Proof } from "@marigold-dev/deku/dist/deku-p";
import {
  Backdrop,
  CircularProgress,
  Grid,
  InputAdornment,
  keyframes,
  OutlinedInput,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import Button from "@mui/material/Button";
import { BlockResponse } from "@taquito/rpc";
import {
  BigMapAbstraction,
  compose,
  TezosToolkit,
  WalletContract,
} from "@taquito/taquito";
import { tzip12 } from "@taquito/tzip12";
import { tzip16 } from "@taquito/tzip16";
import BigNumber from "bignumber.js";
import { useSnackbar } from "notistack";
import {
  Dispatch,
  MouseEvent,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { FA12Contract } from "./fa12Contract";
import { FA2Contract } from "./fa2Contract";
import {
  RollupParameters,
  RollupParametersDEKU,
  RollupParametersTORU,
} from "./RollupParameters";
import { getBytes, LAYER2Type, ROLLUP_TYPE, TOKEN_TYPE } from "./TezosUtils";
import { TransactionInvalidBeaconError } from "./TransactionInvalidBeaconError";

type ClaimL1Props = {
  Tezos: TezosToolkit;
  TezosL2: TezosToolkit;
  dekuClient: DekuPClient;
  rollupType: ROLLUP_TYPE;
  userAddress: string;
  accounts: AccountInfo[];
  setActiveAccount: Dispatch<SetStateAction<AccountInfo | undefined>>;
};

const ClaimL1 = ({
  Tezos,
  TezosL2,
  dekuClient,
  rollupType,
  userAddress,
  accounts,
  setActiveAccount,
}: ClaimL1Props): JSX.Element => {
  const [shouldBounce, setShouldBounce] = useState(true);
  const [changeTicketColor, setChangeTicketColor] = useState("#2a2a2e");

  const [userBalance, setUserBalance] = useState<Map<TOKEN_TYPE, BigNumber>>(
    new Map()
  );

  let oldBalance = useRef<BigNumber>();
  const [tokenType, setTokenType] = useState<string>(TOKEN_TYPE.XTZ);
  const tokenTypeRef = useRef(tokenType); //TRICK : to track current value on async timeout functions
  tokenTypeRef.current = tokenType;

  useEffect(() => {
    if (oldBalance)
      oldBalance!.current = userBalance.get(
        TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE]
      )!;
  }, [tokenType]); //required to refresh to current when changing token type

  // MESSAGES
  const { enqueueSnackbar } = useSnackbar();

  //TEZOS OPERATIONS
  const [tezosLoading, setTezosLoading] = useState(false);

  const [opHash, setOpHash] = useState<string>("");

  const handleL1Withdraw = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setTezosLoading(true);

    try {
      //we sign first with active account on L2
      const withdrawProof: Proof = await dekuClient.getProof(opHash);

      console.log("withdrawProof", withdrawProof);

      //we need to switch Beacon to force to sign on L1 now
      const l1Account: AccountInfo | undefined = accounts.find((a) => {
        return (
          a.address == userAddress && a.accountIdentifier !== LAYER2Type.L2_DEKU
        );
      });
      setActiveAccount(l1Account);
      await handleWithdraw(withdrawProof);

      enqueueSnackbar("Your L1 Claim has been accepted", {
        variant: "success",
        autoHideDuration: 10000,
      });
    } catch (error: any) {
      console.table(`Error: ${JSON.stringify(error, null, 2)}`);
      let tibe: TransactionInvalidBeaconError =
        new TransactionInvalidBeaconError(error);
      enqueueSnackbar(
        "Maybe it is too early to claim, wait next block and retry. Error : " +
          tibe.data_message,
        { variant: "error", autoHideDuration: 10000 }
      );
    } finally {
      setTezosLoading(false);
    }

    setTezosLoading(false);
  };

  const refreshBalance = async () => {
    //Note : tokenTypeRef.current is this ref instead of tokenType to get last current value to track

    let newCurrentBalance: BigNumber = new BigNumber(0);

    //XTZ
    const XTZbalance = await TezosL2.tz.getBalance(userAddress);

    //FA1.2 LOOP

    //kUSD
    let kUSDContract = await Tezos.contract.at(
      process.env["REACT_APP_KUSD_CONTRACT"]!,
      compose(tzip12, tzip16)
    );
    const kUSDtokenMap: BigMapAbstraction = (
      (await kUSDContract.storage()) as FA12Contract
    ).tokens;
    let kUSDBalance: BigNumber | undefined = await kUSDtokenMap.get<BigNumber>(
      userAddress
    );

    //CTEZ
    let ctezContract = await Tezos.contract.at(
      process.env["REACT_APP_CTEZ_CONTRACT"]!,
      compose(tzip12, tzip16)
    );
    const ctezContractStorage: FA12Contract =
      (await ctezContract.storage()) as FA12Contract;
    const cteztokenMap: BigMapAbstraction = ctezContractStorage.tokens;
    let ctezBalance: BigNumber | undefined = await cteztokenMap.get<BigNumber>(
      userAddress
    );

    //UUSD
    let uusdContract = await Tezos.contract.at(
      process.env["REACT_APP_UUSD_CONTRACT"]!,
      tzip12
    );
    const uusdContractStorage: FA2Contract =
      (await uusdContract.storage()) as FA2Contract;
    const uusdtokenMap: BigMapAbstraction = uusdContractStorage.ledger;
    let uusdBalance: BigNumber | undefined = await uusdtokenMap.get<BigNumber>([
      userAddress,
      0,
    ]);

    //EURL
    let eurlContract = await Tezos.contract.at(
      process.env["REACT_APP_EURL_CONTRACT"]!,
      tzip12
    );
    const eurlContractStorage: FA2Contract =
      (await eurlContract.storage()) as FA2Contract;
    const eurltokenMap: BigMapAbstraction = eurlContractStorage.ledger;
    let eurlBalance: BigNumber | undefined = await eurltokenMap.get<BigNumber>([
      userAddress,
      0,
    ]);

    let balance = new Map<TOKEN_TYPE, BigNumber>();
    balance.set(TOKEN_TYPE.XTZ, XTZbalance.dividedBy(Math.pow(10, 6))); //convert mutez to tez
    if (kUSDBalance !== undefined)
      balance.set(
        TOKEN_TYPE.KUSD,
        kUSDBalance.dividedBy(
          Math.pow(
            10,
            (await kUSDContract.tzip12().getTokenMetadata(0)).decimals
          )
        )
      ); //convert from lowest kUSD decimal
    else balance.set(TOKEN_TYPE.KUSD, new BigNumber(0));
    if (ctezBalance !== undefined)
      balance.set(
        TOKEN_TYPE.CTEZ,
        ctezBalance.dividedBy(
          Math.pow(
            10,
            (await ctezContract.tzip12().getTokenMetadata(0)).decimals
          )
        )
      ); //convert from muctez
    else balance.set(TOKEN_TYPE.CTEZ, new BigNumber(0));
    if (uusdBalance !== undefined)
      balance.set(
        TOKEN_TYPE.UUSD,
        uusdBalance.dividedBy(
          Math.pow(
            10,
            (await uusdContract.tzip12().getTokenMetadata(0)).decimals
          )
        )
      ); //convert from lowest UUSD decimal
    else balance.set(TOKEN_TYPE.UUSD, new BigNumber(0));
    if (eurlBalance !== undefined)
      balance.set(
        TOKEN_TYPE.EURL,
        eurlBalance.dividedBy(
          Math.pow(
            10,
            (await eurlContract.tzip12().getTokenMetadata(0)).decimals
          )
        )
      ); //convert from lowest EURL decimal
    else balance.set(TOKEN_TYPE.EURL, new BigNumber(0));

    switch (tokenTypeRef.current) {
      case TOKEN_TYPE.XTZ:
        newCurrentBalance = balance.get(TOKEN_TYPE.XTZ)!;
        break;
      case TOKEN_TYPE.KUSD:
        newCurrentBalance = balance.get(TOKEN_TYPE.KUSD)!;
        break;
      case TOKEN_TYPE.CTEZ:
        newCurrentBalance = balance.get(TOKEN_TYPE.CTEZ)!;
        break;
      case TOKEN_TYPE.UUSD:
        newCurrentBalance = balance.get(TOKEN_TYPE.UUSD)!;
        break;
      case TOKEN_TYPE.EURL:
        newCurrentBalance = balance.get(TOKEN_TYPE.EURL)!;
        break;
    }

    setUserBalance(balance);
    console.log("[ClaimL1] All balances initialized", balance);

    setShouldBounce(false);

    if (!oldBalance.current) {
      //first time, we just record the value
      oldBalance.current = newCurrentBalance;
    } else if (!newCurrentBalance.isEqualTo(oldBalance.current)) {
      setTimeout(() => {
        setChangeTicketColor(
          newCurrentBalance.isGreaterThan(oldBalance.current!) ? "green" : "red"
        );
        setShouldBounce(true);
        setTimeout(() => {
          setChangeTicketColor("");
          oldBalance.current = newCurrentBalance; //keep old value before it vanishes
        }, 1000);
      }, 500);
    }
  };

  const handleWithdraw = async (
    withdrawProof: Proof
  ): Promise<{
    block: BlockResponse;
    expectedConfirmation: number;
    currentConfirmation: number;
    completed: boolean;
    isInCurrentBranch: () => Promise<boolean>;
  }> => {
    console.log("handleWithdraw");
    let rollupContract: WalletContract = await Tezos.wallet.at(
      rollupType === ROLLUP_TYPE.DEKU
        ? (await dekuClient.consensus?.address())!
        : process.env["REACT_APP_ROLLUP_CONTRACT_TORU"]!
    );
    let ticketData =
      tokenType == TOKEN_TYPE.XTZ
        ? await getBytes(TOKEN_TYPE.XTZ)
        : await getBytes(
            TOKEN_TYPE[tokenType.toUpperCase() as keyof typeof TOKEN_TYPE],
            process.env["REACT_APP_" + tokenType + "_CONTRACT"]!
          );
    let proofPair: Array<[string, string]> = [];
    for (var i = 0; i < withdrawProof.proof.length; i = i + 2) {
      proofPair.push([
        withdrawProof.proof[i].replace("0x", ""),
        withdrawProof.proof[i + 1].replace("0x", ""),
      ]);
    }

    let param: RollupParameters =
      rollupType === ROLLUP_TYPE.DEKU
        ? new RollupParametersDEKU(
            process.env["REACT_APP_CONTRACT"]! + "%withdrawDEKU",

            parseFloat(withdrawProof.handle.amount),
            withdrawProof.handle.ticket_id.data,
            withdrawProof.handle.id,
            withdrawProof.handle.owner,
            withdrawProof.handle.ticket_id.ticketer,

            withdrawProof.withdrawal_handles_hash,
            proofPair
          )
        : /*
                1, //withdrawProof.handle.amount,
                ticketData,
                withdrawProof.handle.id,
                userAddress,
                process.env["REACT_APP_CONTRACT"]!,
                withdrawProof.withdrawal_handles_hash,
                withdrawProof.proof) */
          new RollupParametersTORU();

    console.log("param", param);

    const op = await rollupContract.methods
      .withdraw(...Object.values(param))
      .send();
    console.log("sent");

    return op.confirmation();
  };

  useEffect(() => {
    (async () => {
      refreshBalance();
    })();

    const intervalId = setInterval(refreshBalance, 15 * 1000); //refresh async L1 balances
    return () => clearInterval(intervalId);
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

  const isDesktop = useMediaQuery("(min-width:600px)");

  return (
    <Grid
      container
      spacing={2}
      color="primary.main"
      width={isDesktop ? "700px" : "auto"}
      sx={{
        margin: "0 auto",
        padding: "2em",
        background: "var(--tertiary-color)",
        border: "3px solid #7B7B7E",
      }}
      style={
        isDesktop
          ? { marginTop: "2vh", padding: "2em" }
          : { margin: "0", borderRadius: 0 }
      }
      bgcolor="secondary.main"
    >
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme: any) => theme.zIndex.drawer + 1 }}
        open={tezosLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Stack sx={{ width: "100%" }} direction="column" spacing={2}>
        <OutlinedInput
          style={{
            background: "#2a2a2e",
            borderRadius: "0",
            border: "3px solid #2a2a2e",
          }}
          fullWidth
          sx={
            shouldBounce
              ? {
                  animation: `${myKeyframe} 1s ease`,
                  backgroundColor: changeTicketColor,
                }
              : {
                  animation: "",
                  backgroundColor: "#2a2a2e",
                }
          }
          inputProps={{
            style: {
              textAlign: "right",
              display: "inline",
              width: "70%",
            },
          }}
          endAdornment={
            userBalance
              .get(TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE])
              ?.toString() +
              " " +
              tokenType ===
            "undefined XTZ" ? (
              <Typography variant="h1">
                {
                  <Skeleton
                    style={{
                      background: "#d6d6d6",
                      width: "100px",
                      height: "20px",
                    }}
                  />
                }
              </Typography>
            ) : (
              <InputAdornment position="end">
                <img height="24px" src={tokenType + ".png"} />
              </InputAdornment>
            )
          }
          startAdornment="Available balance"
          value={
            userBalance
              .get(TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE])
              ?.toString() +
              " " +
              tokenType ===
            "undefined XTZ"
              ? ""
              : userBalance
                  .get(TOKEN_TYPE[tokenType as keyof typeof TOKEN_TYPE])
                  ?.toString() +
                " " +
                tokenType
          }
        />

        <TextField
          style={{ background: "var(--tertiary-color)" }}
          value={opHash}
          placeholder="Enter your operation hash here"
          onChange={(e) =>
            setOpHash(e.target.value ? e.target.value.trim() : "")
          }
        />
        <Button
          color="warning"
          variant="contained"
          onClick={(e) => handleL1Withdraw(e)}
        >
          L1 Claim
        </Button>
      </Stack>
    </Grid>
  );
};

export default ClaimL1;
