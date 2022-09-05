import { useState } from 'react';
import './App.css';
import ConnectButton from './components/ConnectWallet';
import DisconnectButton from './components/DisconnectWallet';
import { MichelCodecPacker, TezosToolkit, Wallet } from '@taquito/taquito';

import * as React from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import MenuIcon from '@mui/icons-material/Menu';
import { Archive, ArchiveOutlined, ArrowDropDown, Badge, CameraRoll, Hail, Home, Send, SettingsBackupRestoreOutlined, Unarchive } from '@mui/icons-material';
import { Button, CardHeader, Chip, Grid, Icon, makeStyles, Paper, Popover, Select, SelectChangeEvent, Stack, Tab, Tabs, Theme } from '@mui/material';
import { AccountInfo, NetworkType} from "@airgap/beacon-types";
import { Tzip12Module } from "@taquito/tzip12";
import { getTokenBytes, LAYER2Type, RollupCHUSAI, RollupDEKU, RollupTORU, ROLLUP_TYPE, TezosUtils, TOKEN_TYPE } from './components/TezosUtils';
import styled from '@emotion/styled';
import ConnectButtonL2 from './components/ConnectWalletL2';
import { BeaconWallet } from '@taquito/beacon-wallet';
import DepositWithdrawV2 from './components/DepositWithdrawV2';
import { InMemorySigner } from '@taquito/signer';
import TransferL2 from './components/TransferL2';
import ClaimL1 from './components/ClaimL1';
import AppsIcon from '@mui/icons-material/Apps';
import { TabContext, TabPanel } from '@mui/lab';

export enum PAGES {
  "WELCOME",
  "L1CLAIM",
  "DEPOSIT",
  "WITHDRAW",
  "L2TRANSFER",
};

function App() {
  
  const [pageIndex, setPageIndex] = useState<string>(""+PAGES.WELCOME);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [anchorEl2, setAnchorEl2] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const open2 = Boolean(anchorEl2);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);}

    const handleClick2 = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl2(event.currentTarget);}
      const handleClose2 = () => {
        setAnchorEl2(null);
      };
    const handleClose = () => {
      setAnchorEl(null);
    };
  const setPageIndexWrapper = (newValue:string)=>{
    if(newValue === ""+PAGES.WITHDRAW || newValue === ""+PAGES.L2TRANSFER){
      const l2Account : AccountInfo | undefined = accounts.find((a)=> {return a.address == userL2Address && a.accountIdentifier===LAYER2Type.L2_DEKU}); 
      setActiveAccount(l2Account);
    }
    if(newValue === ""+PAGES.DEPOSIT || newValue === ""+PAGES.L1CLAIM){
      const l1Account : AccountInfo | undefined = accounts.find((a)=> {return a.address == userAddress && a.accountIdentifier!==LAYER2Type.L2_DEKU}); 
      setActiveAccount(l1Account);
    }
    setPageIndex(newValue)}
    
    const [Tezos, setTezos] = useState<TezosToolkit>(new TezosToolkit(process.env["REACT_APP_TEZOS_NODE"]!));
    const [TezosL2, setTezosL2] = useState<TezosToolkit>(new TezosToolkit(process.env["REACT_APP_TEZOS_NODE"]!));
    
    Tezos.setPackerProvider(new MichelCodecPacker());
    Tezos.addExtension(new Tzip12Module());
    
    const [wallet, setWallet] = useState<BeaconWallet|undefined>();
    
    const [activeAccount, setActiveAccount] = useState<AccountInfo>(); //used to display selected wallet
    const [accounts, setAccounts] = useState<AccountInfo[]>([]); //used to track both wallets
    
    
    
    const [userAddress, setUserAddress] = useState<string>("");
    const [userL2Address, setUserL2Address] = useState<string>("");//
    
    const [tokenBytes,setTokenBytes] = useState<Map<TOKEN_TYPE,string>>(new Map<TOKEN_TYPE,string>());
    
    
    let network = process.env["REACT_APP_NETWORK"]? NetworkType[process.env["REACT_APP_NETWORK"].toUpperCase() as keyof typeof NetworkType] : NetworkType.JAKARTANET;
    
    
    const createWallet = async () => {
      let wallet = new BeaconWallet({
        name: "TzPortal",
        preferredNetwork: process.env["REACT_APP_NETWORK"]? NetworkType[process.env["REACT_APP_NETWORK"].toUpperCase() as keyof typeof NetworkType]  : NetworkType.JAKARTANET,
      });
      Tezos.setWalletProvider(wallet);
      setWallet(wallet);  
    }
    
    const disconnectWallet = async (e:any): Promise<void> => {
      setUserAddress("");
      const newAccounts = accounts.filter(a => a.address===userL2Address && a.accountIdentifier===LAYER2Type.L2_DEKU); 
      setAccounts(newAccounts);//keep only L2 if still exists
      if(newAccounts.length==1)setActiveAccount(newAccounts[0])//set a activeAcccount
      await wallet!.disconnect();
      await wallet!.client.destroy();
      
      if(userL2Address=="")setPageIndex(""+PAGES.WELCOME)
      else setPageIndex(""+PAGES.L2TRANSFER) ;
      
      console.log("Wallet L1 disconnected");
      await createWallet();
    };
    
    const disconnectWalletL2 = async (e:any): Promise<void> => {
      setUserL2Address("");
      const newAccounts = accounts.filter(a => a.address===userAddress && a.accountIdentifier!==LAYER2Type.L2_DEKU); 
      setAccounts(newAccounts);//keep only L1 if still exists
      if(newAccounts.length==1)setActiveAccount(newAccounts[0])//set a activeAcccount
      TezosL2.setSignerProvider(undefined);
      
      if(userAddress=="")setPageIndex(""+PAGES.WELCOME)
      else setPageIndex(""+PAGES.L1CLAIM) ;
      
      console.log("Wallet L2 disconnected");
    };
    
    const [rollupType , setRollupType] = useState<ROLLUP_TYPE>(ROLLUP_TYPE.DEKU);
    const [selectedRollupType , setSelectedRollupType] = useState<string>(ROLLUP_TYPE.DEKU.name);
    const [rollup , setRollup] = useState<RollupTORU | RollupDEKU | RollupCHUSAI>();
    
    async function refreshRollup() {
      switch(rollupType){
        case ROLLUP_TYPE.TORU : setRollup(await TezosUtils.fetchRollupTORU(Tezos.rpc.getRpcUrl(),rollupType.address));break;
        case ROLLUP_TYPE.DEKU : setRollup(await TezosUtils.fetchRollupDEKU(Tezos,rollupType.address));break;
        case ROLLUP_TYPE.CHUSAI : {
          setRollup(await TezosUtils.fetchRollupCHUSAI(Tezos,rollupType.address));break;
        }
      }
    }
    
    
    React.useEffect(() => { (async () => {
      const tokenBytes = await getTokenBytes();//need to call this first and wait for init
      setTokenBytes(tokenBytes); 
      await createWallet();
    })();
  }, []);
  
  
  React.useEffect(() => {
    refreshRollup();
  }, [rollupType]);
  
  
  
  
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
        />

        <Select
          variant="standard"
          id="layer2-select"
          defaultValue={ROLLUP_TYPE.DEKU.name}
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
          <MenuItem key={ROLLUP_TYPE.DEKU.name} value={ROLLUP_TYPE.DEKU.name}>
            <Chip
              sx={{ border: "none", margin: 0 }}
              avatar={
                <Avatar
                  sx={{ backgroundColor: "secondary.main" }}
                  src="deku_white.png"
                />
              }
              label={ROLLUP_TYPE.DEKU.name}
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
              <MenuItem style={{
            backgroundColor: "#405b70"}}
              onClick={() => {
                window.location.href = "https://tzstamp.io/";
              }}
            >
              Tz Stamp
            </MenuItem>
            <MenuItem style={{
            backgroundColor: "#405b70"}}
              onClick={() => {
                window.location.href = "https://tzvote.marigold.dev/";
              }}
            >
              Tz Vote
            </MenuItem>
            <MenuItem style={{
            backgroundColor: "#405b70"}}
              onClick={() => {
                window.location.href = "https://faucet.marigold.dev/";
              }}
            >
              Faucet App
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
              <MenuItem style={{
            backgroundColor: "#405b70"}}>
              <Select
                variant="standard"
                id="layer2-select"
                defaultValue={ROLLUP_TYPE.DEKU.name}
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
                  key={ROLLUP_TYPE.DEKU.name}
                  value={ROLLUP_TYPE.DEKU.name}
                >
                  <Chip
                    sx={{ border: "none", margin: 0 }}
                    avatar={
                      <Avatar
                        sx={{ backgroundColor: "secondary.main" }}
                        src="deku_white.png"
                      />
                    }
                    label={ROLLUP_TYPE.DEKU.name}
                    variant="outlined"
                  />
                </MenuItem>
              </Select>
            </MenuItem>
            <MenuItem style={{
            backgroundColor: "#405b70"}}>
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
              />
            </MenuItem>
            <MenuItem style={{
            backgroundColor: "#405b70"}}>
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
              rollupType={rollupType}
              userAddress={userAddress}
            />
          </TabPanel>
          <TabPanel
            style={{ paddingLeft: "calc(50% - 350px)" }}
            value={"" + PAGES.DEPOSIT}
          >
            <DepositWithdrawV2
              Tezos={Tezos}
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
            style={{ paddingLeft: "calc(50% - 350px)" }}
            value={"" + PAGES.WITHDRAW}
          >
            <DepositWithdrawV2
              Tezos={Tezos}
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
            style={{ paddingLeft: "calc(50% - 350px)" }}
            value={"" + PAGES.L2TRANSFER}
          >
            <TransferL2
              TezosL2={TezosL2}
              userL2Address={userL2Address}
              tokenBytes={tokenBytes}
              rollupType={rollupType}
              rollup={rollup}
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
              spacing={3}
              color="primary.main"
              width="auto"
              sx={{  padding: "2em" }}
              bgcolor="secondary.main"
            >
              <Grid item xs={6}>
                <Stack spacing={2}>
                  {userAddress === "" ? (
                    <div
                      style={{
                        padding: "1em",
                        backgroundColor: "var(--tertiary-color)",
                        width: "max-content"
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
          <TabPanel value={"" + PAGES.L1CLAIM}>
            <ClaimL1
              Tezos={Tezos}
              TezosL2={TezosL2}
              rollupType={rollupType}
              userAddress={userAddress}
            />
          </TabPanel>
          <TabPanel
            style={{ paddingLeft: "calc(50% - 350px)" }}
            value={"" + PAGES.DEPOSIT}
          >
            <DepositWithdrawV2
              Tezos={Tezos}
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
            style={{ paddingLeft: "calc(50% - 350px)" }}
            value={"" + PAGES.WITHDRAW}
          >
            <DepositWithdrawV2
              Tezos={Tezos}
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
            style={{ paddingLeft: "calc(50% - 350px)" }}
            value={"" + PAGES.L2TRANSFER}
          >
            <TransferL2
              TezosL2={TezosL2}
              userL2Address={userL2Address}
              tokenBytes={tokenBytes}
              rollupType={rollupType}
              rollup={rollup}
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
          <Typography variant="h5" color="primary">
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
          height: "80px",
          paddingLeft: "50px",
          paddingRight: "50px",
        }}
      >
        <a
          href="https://www.marigold.dev/project/deku-sidechain"
          target="_blank"
        >
          <img src="deku_logo_white.png" height={36} />
        </a>
        <a
          href="https://tezos.gitlab.io/alpha/transaction_rollups.html"
          target="_blank"
        >
          <img src="toru.png" height={36} />
        </a>

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