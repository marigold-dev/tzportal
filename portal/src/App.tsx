import { MichelCodecPacker, TezosToolkit } from '@taquito/taquito';
import { useState } from 'react';
import './App.css';
import ConnectButton from './components/ConnectWallet';

import { AccountInfo, NetworkType } from "@airgap/beacon-types";
import { DekuToolkit, fromMemorySigner } from '@marigold-dev/deku-toolkit';
import { Archive, Hail, Home, Send, Unarchive } from '@mui/icons-material';
import AppsIcon from '@mui/icons-material/Apps';
import MenuIcon from '@mui/icons-material/Menu';
import { TabContext, TabPanel } from '@mui/lab';
import { Button, Chip, Grid, Select, SelectChangeEvent, Stack, Tab, Tabs, useMediaQuery } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { BeaconWallet } from '@taquito/beacon-wallet';
import { Tzip12Module } from "@taquito/tzip12";
import * as React from 'react';
import ClaimL1 from './components/ClaimL1';
import ConnectButtonL2 from './components/ConnectWalletL2';
import DepositWithdrawV2 from './components/DepositWithdrawV2';
import { getTokenBytes, LAYER2Type, RollupCHUSAI, RollupDEKU, RollupTORU, ROLLUP_TYPE, TezosUtils, TOKEN_TYPE } from './components/TezosUtils';
import TransferL2 from './components/TransferL2';

export enum PAGES {
  "WELCOME",
  "L1CLAIM",
  "DEPOSIT",
  "WITHDRAW",
  "L2TRANSFER",
};

function App() {

  const [pageIndex, setPageIndex] = useState<string>("" + PAGES.WELCOME);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [anchorEl2, setAnchorEl2] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const open2 = Boolean(anchorEl2);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }

  const handleClick2 = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl2(event.currentTarget);
  }
  const handleClose2 = () => {
    setAnchorEl2(null);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const setPageIndexWrapper = (newValue: string) => {
    if (newValue === "" + PAGES.WITHDRAW || newValue === "" + PAGES.L2TRANSFER) {
      const l2Account: AccountInfo | undefined = accounts.find((a) => { return a.address == userL2Address && a.accountIdentifier === LAYER2Type.L2_DEKU });
      setActiveAccount(l2Account);
    }
    if (newValue === "" + PAGES.DEPOSIT) {
      const l1Account: AccountInfo | undefined = accounts.find((a) => { return a.address == userAddress && a.accountIdentifier !== LAYER2Type.L2_DEKU });
      setActiveAccount(l1Account);
    }
    if (newValue === "" + PAGES.L1CLAIM) { //we will need both wallet for signature on both networks. we start with L2, then L1
      const l2Account: AccountInfo | undefined = accounts.find((a) => { return a.address == userL2Address && a.accountIdentifier === LAYER2Type.L2_DEKU });
      setActiveAccount(l2Account);
    }
    setPageIndex(newValue)
  }

  const [Tezos, setTezos] = useState<TezosToolkit>(new TezosToolkit(process.env["REACT_APP_TEZOS_NODE"]!));
  const [TezosL2, setTezosL2] = useState<TezosToolkit>(new TezosToolkit(process.env["REACT_APP_TEZOS_NODE"]!));

  Tezos.setPackerProvider(new MichelCodecPacker());
  Tezos.addExtension(new Tzip12Module());

  const [wallet, setWallet] = useState<BeaconWallet | undefined>();

  const [activeAccount, setActiveAccount] = useState<AccountInfo>(); //used to display selected wallet
  const [accounts, setAccounts] = useState<AccountInfo[]>([]); //used to track both wallets



  const [userAddress, setUserAddress] = useState<string>("");
  const [userL2Address, setUserL2Address] = useState<string>("");//

  const [tokenBytes, setTokenBytes] = useState<Map<TOKEN_TYPE, string>>(new Map<TOKEN_TYPE, string>());
  const [rollupMap, setRollupMap] = useState<Map<ROLLUP_TYPE, string>>(new Map());

  let network = process.env["REACT_APP_NETWORK"] ? NetworkType[process.env["REACT_APP_NETWORK"].toUpperCase() as keyof typeof NetworkType] : NetworkType.JAKARTANET;

  const dekuClient = new DekuToolkit({ dekuRpc: process.env["REACT_APP_DEKU_NODE"]!, dekuSigner: fromMemorySigner(TezosL2.signer) })
    .setTezosRpc(process.env["REACT_APP_TEZOS_NODE"]!)
    .onBlock(block => {
      console.log("The client received a block");
      console.log(block);
    });



  const createWallet = async () => {
    let wallet = new BeaconWallet({
      name: "TzPortal",
      preferredNetwork: process.env["REACT_APP_NETWORK"] ? NetworkType[process.env["REACT_APP_NETWORK"].toUpperCase() as keyof typeof NetworkType] : NetworkType.JAKARTANET,
    });
    Tezos.setWalletProvider(wallet);
    setTezos(Tezos);
    setWallet(wallet);
  }

  const disconnectWallet = async (e: any): Promise<void> => {
    setUserAddress("");
    const newAccounts = accounts.filter(a => a.address === userL2Address && a.accountIdentifier === LAYER2Type.L2_DEKU);
    setAccounts(newAccounts);//keep only L2 if still exists
    if (newAccounts.length == 1) setActiveAccount(newAccounts[0])//set a activeAcccount
    await wallet!.disconnect();
    await wallet!.client.destroy();

    if (userL2Address == "") setPageIndex("" + PAGES.WELCOME)
    else setPageIndex("" + PAGES.L2TRANSFER);

    console.log("Wallet L1 disconnected");
    await createWallet();
  };

  const disconnectWalletL2 = async (e: any): Promise<void> => {
    setUserL2Address("");
    const newAccounts = accounts.filter(a => a.address === userAddress && a.accountIdentifier !== LAYER2Type.L2_DEKU);
    setAccounts(newAccounts);//keep only L1 if still exists
    if (newAccounts.length == 1) setActiveAccount(newAccounts[0])//set a activeAcccount
    TezosL2.setSignerProvider(undefined);

    if (userAddress == "") setPageIndex("" + PAGES.WELCOME)
    else setPageIndex("" + PAGES.L1CLAIM);

    console.log("Wallet L2 disconnected");
  };

  const [rollupType, setRollupType] = useState<ROLLUP_TYPE>(ROLLUP_TYPE.DEKU);
  const [selectedRollupType, setSelectedRollupType] = useState<string>(ROLLUP_TYPE.DEKU);
  const [rollup, setRollup] = useState<RollupTORU | RollupDEKU | RollupCHUSAI>();

  async function refreshRollup() {
    //requires this to be set first
    if (rollupMap.size != 3) {
      const rollupMap = await refreshRollupMap(); //wait
      setRollupMap(rollupMap);
    }

    switch (rollupType) {
      case ROLLUP_TYPE.TORU: setRollup(await TezosUtils.fetchRollupTORU(Tezos.rpc.getRpcUrl(), rollupMap.get(rollupType)!)); break;
      case ROLLUP_TYPE.DEKU: setRollup(await TezosUtils.fetchRollupDEKU(Tezos, rollupMap.get(rollupType)!)); break;
      case ROLLUP_TYPE.CHUSAI: {
        setRollup(await TezosUtils.fetchRollupCHUSAI(Tezos, rollupMap.get(rollupType)!)); break;
      }
    }
  }

  async function refreshRollupMap(): Promise<Map<ROLLUP_TYPE, string>> {
    return new Promise(async (resolve, reject) => {
      rollupMap.set(ROLLUP_TYPE.TORU, process.env["REACT_APP_ROLLUP_CONTRACT_TORU"]!);
      const dekuConsensusContractAddress: string = (await dekuClient.consensus?.address())!;
      rollupMap.set(ROLLUP_TYPE.DEKU, dekuConsensusContractAddress);
      rollupMap.set(ROLLUP_TYPE.CHUSAI, process.env["REACT_APP_ROLLUP_CONTRACT_CHUSAI"]!);
      return resolve(rollupMap);
    });

  }

  React.useEffect(() => {
    (async () => {
      const tokenBytes = await getTokenBytes();//need to call this first and wait for init
      setTokenBytes(tokenBytes);
      await createWallet();
      setRollupMap(await refreshRollupMap());
    })();


  }, []);


  React.useEffect(() => {
    (async () => {
      await refreshRollup();
    })();
  }, [rollupType]);


  const isDesktop = useMediaQuery('(min-width:600px)');

  return (
    <div
      style={{
        position: "relative",
        backgroundImage: "url('/bg.jpg')",
        minHeight: "100vh",
        backgroundSize: "cover",
        paddingBottom: "0px",
      }}
    >
      <Stack
        display={{ xs: "none", md: "flex" }}
        direction="row-reverse"
        id="header"
        style={{
          backgroundColor: "#0E1E2E",
          height: "80px",
          padding: "0 50px",
        }}
      >
        <ConnectButtonL2
          userAddress={userAddress}
          userL2Address={userL2Address}
          setUserL2Address={setUserL2Address}
          TezosL2={TezosL2!}
          activeAccount={activeAccount!}
          setActiveAccount={setActiveAccount}
          accounts={accounts}
          disconnectWalletL2={disconnectWalletL2}
          hideAfterConnect={false}
          setPageIndex={setPageIndex}
        />

        <ConnectButton
          Tezos={Tezos}
          setWallet={setWallet}
          userAddress={userAddress}
          userL2Address={userL2Address}
          setUserAddress={setUserAddress}
          wallet={wallet!}
          disconnectWallet={disconnectWallet}
          activeAccount={activeAccount!}
          setActiveAccount={setActiveAccount}
          accounts={accounts}
          hideAfterConnect={false}
          setPageIndex={setPageIndex}
          setTezos={setTezos}
        />

        <Select
          variant="standard"
          id="layer2-select"
          defaultValue={ROLLUP_TYPE.DEKU}
          value={selectedRollupType}
          label="Rollup type"
          sx={{
            marginRight: "2em",
            backgroundColor: "transparent",
            paddingRight: 0,
            marginTop: "0.5em",
          }}
          onChange={(e: SelectChangeEvent) => {
            setSelectedRollupType(e.target.value);
            setRollupType(
              ROLLUP_TYPE[e.target.value as keyof typeof ROLLUP_TYPE]
            );
          }}
        >
          <MenuItem key={ROLLUP_TYPE.DEKU} value={ROLLUP_TYPE.DEKU}>
            <Chip
              sx={{ border: "none", margin: 0 }}
              avatar={
                <Avatar
                  sx={{ backgroundColor: "secondary.main" }}
                  src="deku_white.png"
                />
              }
              label={ROLLUP_TYPE.DEKU}
              variant="outlined"
            />
          </MenuItem>
        </Select>

        <img
          src="icon.png"
          height="80px"
          style={{ position: "absolute", left: 0, marginLeft: "50px" }}
        />
      </Stack>

      <Stack
        display={{ xs: "flex", md: "none" }}
        direction="row-reverse"
        id="header"
        style={{
          backgroundColor: "#0E1E2E",
          height: "80px",
          padding: "0 50px",
        }}
      >
        <img
          src="icon.png"
          height="60px"
          style={{
            position: "absolute",
            left: 0,
            marginLeft: "25px",
            marginTop: "5px",
          }}
        />
        <div style={{ left: 0, marginLeft: "40vW", position: "absolute" }}>
          <Button
            id="basic-button"
            aria-controls={open ? "basic-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            onClick={handleClick}
          >
            <Tab icon={<AppsIcon color="primary" />} />
          </Button>
          <Menu
            id="basic-menu2"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              "aria-labelledby": "basic-button"
            }}
          >
            <label style={{
              padding: "1em",
              color: "#b5b5b5",
            }}>
              Marigold apps
            </label>
            <MenuItem>
              <a href='https://tzstamp.io/' target="_blank">Tz Stamp</a>
            </MenuItem>
            <MenuItem>
              <a href='https://tzvote.marigold.dev/' target="_blank">Tz Vote</a>
            </MenuItem>
            <MenuItem>
              <a href='https://faucet.marigold.dev/' target="_blank">Faucet App</a>
            </MenuItem>
            <label style={{
              padding: "1em",
              color: "#b5b5b5",
            }}>
              Documentation
            </label>
            <MenuItem>
              <a href='https://tezos.gitlab.io/alpha/transaction_rollups.html' target="_blank">Toru</a>
            </MenuItem>
            <MenuItem>
              <a href='https://www.marigold.dev/project/deku-sidechain' target="_blank">Deku</a>
            </MenuItem>
          </Menu>
        </div>
        <div style={{ left: 0, marginLeft: "60vW", position: "absolute" }}>
          <Button
            id="basic-button"
            aria-controls={open ? "basic-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            onClick={handleClick2}
          >
            <Tab icon={<MenuIcon color="primary" />} />
          </Button>
          <Menu
            id="basic-menu"
            anchorEl={anchorEl2}
            open={open2}
            onClose={handleClose2}
            MenuListProps={{
              "aria-labelledby": "basic-button",
            }}
          >
            <label style={{
              padding: "1em",
              color: "#b5b5b5",
            }}>
              L2 network
            </label>
            <MenuItem>
              <Select
                variant="standard"
                id="layer2-select"
                defaultValue={ROLLUP_TYPE.DEKU}
                value={selectedRollupType}
                label="Rollup type"
                sx={{
                  marginRight: "2em",
                  backgroundColor: "transparent",
                  paddingRight: 0,
                  marginTop: "0.5em",
                }}
                onChange={(e: SelectChangeEvent) => {
                  setSelectedRollupType(e.target.value);
                  setRollupType(
                    ROLLUP_TYPE[e.target.value as keyof typeof ROLLUP_TYPE]
                  );
                }}
              >
                <MenuItem
                  key={ROLLUP_TYPE.DEKU}
                  value={ROLLUP_TYPE.DEKU}
                >
                  <Chip
                    sx={{ border: "none", margin: 0 }}
                    avatar={
                      <Avatar
                        sx={{ backgroundColor: "secondary.main" }}
                        src="deku_white.png"
                      />
                    }
                    label={ROLLUP_TYPE.DEKU}
                    variant="outlined"
                  />
                </MenuItem>
              </Select>
            </MenuItem>
            <label style={{
              padding: "1em",
              color: "#b5b5b5",
            }}>
              L1 account
            </label>
            <MenuItem >
              <ConnectButton
                Tezos={Tezos}
                setWallet={setWallet}
                userAddress={userAddress}
                userL2Address={userL2Address}
                setUserAddress={setUserAddress}
                wallet={wallet!}
                disconnectWallet={disconnectWallet}
                activeAccount={activeAccount!}
                setActiveAccount={setActiveAccount}
                accounts={accounts}
                hideAfterConnect={false}
                setPageIndex={setPageIndex}
                setTezos={setTezos}
              />
            </MenuItem>
            <label style={{
              padding: "1em",
              color: "#b5b5b5",
            }}>
              L2 account
            </label>
            <MenuItem >
              <ConnectButtonL2
                userAddress={userAddress}
                userL2Address={userL2Address}
                setUserL2Address={setUserL2Address}
                TezosL2={TezosL2!}
                activeAccount={activeAccount!}
                setActiveAccount={setActiveAccount}
                accounts={accounts}
                disconnectWalletL2={disconnectWalletL2}
                hideAfterConnect={false}
                setPageIndex={setPageIndex}
              />
            </MenuItem>
          </Menu>
        </div>
      </Stack>

      {network != NetworkType.MAINNET ? (
        <div className="banner" style={{ height: "20px" }}>
          WARNING: (TEST ONLY) You are on {network}
        </div>
      ) : (
        <span />
      )}

      <TabContext value={pageIndex}>
        <Box display={{ xs: "none", md: "grid" }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={pageIndex}
              centered
              onChange={(e, newValue: string) => {
                !newValue
                  ? setPageIndex(PAGES.WELCOME.toString())
                  : setPageIndexWrapper(newValue);
              }}
            >
              <Tab
                icon={<Home />}
                sx={{ display: "none" }}
                label="HOME"
                disabled={true}
                value={"" + PAGES.WELCOME}
              />
              <Tab
                icon={<Hail />}
                label="L1 Claim"
                disabled={userL2Address == "" || userAddress == ""}
                value={"" + PAGES.L1CLAIM}
              />
              <Tab
                icon={<Archive />}
                label="Deposit"
                disabled={userL2Address == "" || userAddress == ""}
                value={"" + PAGES.DEPOSIT}
              />
              <Tab
                icon={<Unarchive />}
                label="Withdraw"
                disabled={userL2Address == "" || userAddress == ""}
                value={"" + PAGES.WITHDRAW}
              />
              <Tab
                icon={<Send />}
                label="L2 Transfer"
                disabled={userL2Address == ""}
                value={"" + PAGES.L2TRANSFER}
              />
            </Tabs>
          </Box>

          <TabPanel value={"" + PAGES.WELCOME}>
            <Grid
              container
              borderRadius={5}
              spacing={2}
              color="primary.main"
              width="auto"
              sx={{ margin: "5vh 20vw", padding: "2em" }}
              bgcolor="secondary.main"
            >
              <Grid item xs={3}>
                <Stack
                  direction="row"
                  height="100%"
                  style={{ fontFamily: "Chilanka" }}
                >
                  <span style={{ paddingTop: "25%", paddingRight: "1em" }}>
                    Do Deposit / Withdraw
                    <br />
                    <br />
                    or
                    <br />
                    <br />
                    Claim your L1 Withdraw
                  </span>

                  <Divider
                    color="white"
                    sx={{ borderWidth: "1px" }}
                    orientation="vertical"
                    flexItem
                  />

                  <span style={{ width: "min-content" }}>
                    <br />
                    <br />
                    &rarr;
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    &rarr;
                  </span>
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Stack spacing={2}>
                  {userAddress === "" ? (
                    <div
                      style={{
                        padding: "1em",
                        backgroundColor: "var(--tertiary-color)",
                      }}
                    >
                      <ConnectButton
                        Tezos={Tezos}
                        setWallet={setWallet}
                        userAddress={userAddress}
                        userL2Address={userL2Address}
                        setUserAddress={setUserAddress}
                        wallet={wallet!}
                        disconnectWallet={disconnectWallet}
                        activeAccount={activeAccount!}
                        setActiveAccount={setActiveAccount}
                        accounts={accounts}
                        hideAfterConnect={true}
                        setPageIndex={setPageIndex}
                        setTezos={setTezos}
                      />
                    </div>
                  ) : (
                    <div style={{ height: "100px" }}>&nbsp;</div>
                  )}

                  <div
                    style={{
                      padding: "1em",
                      backgroundColor: "var(--tertiary-color)",
                    }}
                  >
                    <ConnectButtonL2
                      userAddress={userAddress}
                      userL2Address={userL2Address}
                      setUserL2Address={setUserL2Address}
                      TezosL2={TezosL2!}
                      activeAccount={activeAccount!}
                      setActiveAccount={setActiveAccount}
                      accounts={accounts}
                      disconnectWalletL2={disconnectWalletL2}
                      hideAfterConnect={true}
                      setPageIndex={setPageIndex}
                    />
                  </div>
                </Stack>
              </Grid>
              <Grid item xs={3}>
                <Stack
                  height="100%"
                  alignContent="space-between"
                  alignItems="center"
                  spacing={1}
                >
                  <span
                    style={{
                      fontFamily: "Chilanka",
                      height: "50%",
                      paddingTop: "25%",
                    }}
                  >
                    {" "}
                  </span>
                  <span
                    style={{
                      fontFamily: "Chilanka",
                      height: "50%",
                      paddingTop: "25%",
                    }}
                  >
                    {" "}
                    &larr; Do L2 Transfer{" "}
                  </span>
                </Stack>
              </Grid>
            </Grid>
          </TabPanel>
          <TabPanel value={"" + PAGES.L1CLAIM}>
            <ClaimL1
              Tezos={Tezos}
              TezosL2={TezosL2}
              dekuClient={dekuClient}
              rollupType={rollupType}
              userAddress={userAddress}
              accounts={accounts}
              setActiveAccount={setActiveAccount}
            />
          </TabPanel>
          <TabPanel
            style={isDesktop ? { paddingLeft: "calc(50% - 350px)" } : { padding: 0 }}
            value={"" + PAGES.DEPOSIT}
          >
            <DepositWithdrawV2
              rollupMap={rollupMap}
              Tezos={Tezos}
              dekuClient={dekuClient}
              wallet={wallet!}
              TezosL2={TezosL2}
              userAddress={userAddress}
              userL2Address={userL2Address}
              rollupType={rollupType}
              setRollupType={setRollupType}
              rollup={rollup}
              setRollup={setRollup}
              activeAccount={activeAccount}
              setActiveAccount={setActiveAccount}
              accounts={accounts}
              tokenBytes={tokenBytes}
              setPageIndex={setPageIndex}
            />
          </TabPanel>
          <TabPanel
            style={isDesktop ? { paddingLeft: "calc(50% - 350px)" } : { padding: 0 }}
            value={"" + PAGES.WITHDRAW}
          >
            <DepositWithdrawV2
              rollupMap={rollupMap}
              Tezos={Tezos}
              dekuClient={dekuClient}
              wallet={wallet!}
              TezosL2={TezosL2}
              userAddress={userAddress}
              userL2Address={userL2Address}
              rollupType={rollupType}
              setRollupType={setRollupType}
              rollup={rollup}
              setRollup={setRollup}
              activeAccount={activeAccount}
              setActiveAccount={setActiveAccount}
              accounts={accounts}
              tokenBytes={tokenBytes}
              setPageIndex={setPageIndex}
            />
          </TabPanel>
          <TabPanel
            style={isDesktop ? { paddingLeft: "calc(50% - 350px)" } : { padding: 0 }}
            value={"" + PAGES.L2TRANSFER}
          >
            <TransferL2
              TezosL2={TezosL2}
              dekuClient={dekuClient}
              userL2Address={userL2Address}
              tokenBytes={tokenBytes}
              rollupType={rollupType}
              rollup={rollup}
              rollupmap={rollupMap}

            />
          </TabPanel>
        </Box>
      </TabContext>
      <TabContext value={pageIndex}>
        <Box display={{ xs: "grid", md: "none" }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs

              value={pageIndex}
              centered
              onChange={(e, newValue: string) => {
                !newValue
                  ? setPageIndex(PAGES.WELCOME.toString())
                  : setPageIndexWrapper(newValue);
              }}
            >
              <Tab
                icon={<Home />}
                sx={{ display: "none" }}
                disabled={true}
                value={"" + PAGES.WELCOME}
              />
              <Tab
                icon={<Hail />}
                label=" "
                disabled={userL2Address == "" || userAddress == ""}
                value={"" + PAGES.L1CLAIM}
              />
              <Tab
                icon={<Archive />}
                label=" "
                disabled={userL2Address == "" || userAddress == ""}
                value={"" + PAGES.DEPOSIT}
              />
              <Tab
                icon={<Unarchive />}
                label=" "
                disabled={userL2Address == "" || userAddress == ""}
                value={"" + PAGES.WITHDRAW}
              />
              <Tab
                icon={<Send />}
                label=" "
                disabled={userL2Address == ""}
                value={"" + PAGES.L2TRANSFER}
              />
            </Tabs>
          </Box>

          <TabPanel sx={{ margin: 0, padding: 0 }} value={"" + PAGES.WELCOME}>
            <Grid
              container
              spacing={3}
              color="primary.main"
              width="auto"
              sx={{ padding: "2em" }}
              bgcolor="secondary.main"
              style={{ justifyContent: "center", paddingLeft: "20px" }}
            >
              <Grid item xs={6} style={{ maxWidth: "100%" }}>
                <Stack spacing={2}>
                  {userAddress === "" ? (
                    <div
                      style={{
                        padding: "1em",
                        backgroundColor: "var(--tertiary-color)",
                        width: "250px"
                      }}
                    >
                      <ConnectButton
                        Tezos={Tezos}
                        setWallet={setWallet}
                        userAddress={userAddress}
                        userL2Address={userL2Address}
                        setUserAddress={setUserAddress}
                        wallet={wallet!}
                        disconnectWallet={disconnectWallet}
                        activeAccount={activeAccount!}
                        setActiveAccount={setActiveAccount}
                        accounts={accounts}
                        hideAfterConnect={true}
                        setPageIndex={setPageIndex}
                        setTezos={setTezos}
                      />
                    </div>
                  ) : (
                    <div style={{ height: "100px" }}>&nbsp;</div>
                  )}

                  <div
                    style={{
                      padding: "1em",
                      backgroundColor: "var(--tertiary-color)",
                      width: "max-content",
                    }}
                  >
                    <ConnectButtonL2
                      userAddress={userAddress}
                      userL2Address={userL2Address}
                      setUserL2Address={setUserL2Address}
                      TezosL2={TezosL2!}
                      activeAccount={activeAccount!}
                      setActiveAccount={setActiveAccount}
                      accounts={accounts}
                      disconnectWalletL2={disconnectWalletL2}
                      hideAfterConnect={true}
                      setPageIndex={setPageIndex}
                    />
                  </div>
                </Stack>
              </Grid>
            </Grid>
          </TabPanel>
          <TabPanel style={isDesktop ? { padding: "20px" } : { padding: 0 }} value={"" + PAGES.L1CLAIM}>
            <ClaimL1
              Tezos={Tezos}
              TezosL2={TezosL2}
              dekuClient={dekuClient}
              rollupType={rollupType}
              userAddress={userAddress}
              accounts={accounts}
              setActiveAccount={setActiveAccount}
            />
          </TabPanel>
          <TabPanel
            style={isDesktop ? { paddingLeft: "calc(50% - 350px)" } : { padding: "30px", background: "#0e1e2e" }}
            value={"" + PAGES.DEPOSIT}
          >
            <DepositWithdrawV2
              rollupMap={rollupMap}
              Tezos={Tezos}
              dekuClient={dekuClient}
              wallet={wallet!}
              TezosL2={TezosL2}
              userAddress={userAddress}
              userL2Address={userL2Address}
              rollupType={rollupType}
              setRollupType={setRollupType}
              rollup={rollup}
              setRollup={setRollup}
              activeAccount={activeAccount}
              setActiveAccount={setActiveAccount}
              accounts={accounts}
              tokenBytes={tokenBytes}
              setPageIndex={setPageIndex}
            />
          </TabPanel>
          <TabPanel
            style={isDesktop ? { paddingLeft: "calc(50% - 350px)" } : { padding: "30px", background: "#0e1e2e" }}
            value={"" + PAGES.WITHDRAW}
          >
            <DepositWithdrawV2
              rollupMap={rollupMap}
              Tezos={Tezos}
              dekuClient={dekuClient}
              wallet={wallet!}
              TezosL2={TezosL2}
              userAddress={userAddress}
              userL2Address={userL2Address}
              rollupType={rollupType}
              setRollupType={setRollupType}
              rollup={rollup}
              setRollup={setRollup}
              activeAccount={activeAccount}
              setActiveAccount={setActiveAccount}
              accounts={accounts}
              tokenBytes={tokenBytes}
              setPageIndex={setPageIndex}
            />
          </TabPanel>
          <TabPanel
            style={isDesktop ? { paddingLeft: "calc(50% - 350px)" } : { padding: 0 }}
            value={"" + PAGES.L2TRANSFER}
          >
            <TransferL2
              TezosL2={TezosL2}
              dekuClient={dekuClient}
              userL2Address={userL2Address}
              tokenBytes={tokenBytes}
              rollupType={rollupType}
              rollup={rollup}
              rollupmap={rollupMap}
            />
          </TabPanel>
        </Box>
      </TabContext>

      <Grid
        container
        display={{ xs: "none", md: "flex" }}
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        id="footer"
        style={{
          backgroundColor: "#0E1E2E",
          position: "absolute",
          left: 0,
          bottom: 0,
          right: 0,
          height: "80px",
          paddingLeft: "50px",
          paddingRight: "50px",
        }}
      >
        <a
          href="https://www.marigold.dev/project/deku-sidechain"
          target="_blank"
        >
          <img src="deku_logo_white.png" height={60} />
        </a>
        <a
          href="https://tezos.gitlab.io/alpha/transaction_rollups.html"
          target="_blank"
        >
          <img src="toru.png" height={60} />
        </a>

        <Divider orientation="vertical" color="white" sx={{ height: "70%" }} />
        <a href="https://tzstamp.io/" target="_blank">
          <img src="tzstamp.png" height={60} />
        </a>
        <a href="https://faucet.marigold.dev/" target="_blank">
          <img src="faucet.png" height={60} />
        </a>
        <a href="https://tzvote.marigold.dev/" target="_blank">
          <img src="tzvote.png" height={60} />
        </a>

        <Divider orientation="vertical" color="white" sx={{ height: "70%" }} />

        <a href="https://marigold.dev/" target="_blank">
          <Typography variant="h4" color="primary">
            Powered by Marigold
          </Typography>
        </a>
      </Grid>
      <Grid
        container
        display={{ xs: "flex", md: "none" }}
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        id="footer"
        style={{
          backgroundColor: "#0E1E2E",
          position: "absolute",
          left: 0,
          bottom: 0,
          right: 0,
          height: "50px",
          justifyContent: "center"
        }}
      >
        <a href="https://marigold.dev/" target="_blank">
          <Typography variant="h6" color="primary">
            Powered by Marigold
          </Typography>
        </a>
      </Grid>
    </div>
  );
}

export default App;